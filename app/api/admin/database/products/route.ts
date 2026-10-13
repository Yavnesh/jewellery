import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth, recordAuditLog } from "@/lib/adminAuthHelper";
import { verifyElevatedSession } from "@/lib/elevatedAuthHelper";
import prisma from "@/utils/db";

// Critical fields that cause verification invalidation if altered
export const CRITICAL_VERIFICATION_FIELDS = [
  "price",
  "originalPrice",
  "metalType",
  "purity",
  "weight",
  "title",
  "images",
  "mainImage",
];

// GET: Query products with verification & governance metadata
export async function GET(req: NextRequest) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const categoryId = searchParams.get("categoryId");

    const where: any = {
      deletedAt: null, // by default don't show archived unless requested
    };

    if (status) {
      where.verificationStatus = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { slug: { contains: search } },
        { manufacturer: { contains: search } },
      ];
    }

    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { title: "asc" },
        include: {
          category: { select: { id: true, name: true } },
          verifiedBy: { select: { id: true, email: true } },
          verifications: {
            orderBy: { verifiedAt: "desc" },
            take: 1,
            include: { verifiedBy: { select: { email: true } } },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    // Summary counts for dashboard KPI cards
    const [pendingCount, verifiedCount, reqCount, proposedCount] = await Promise.all([
      prisma.product.count({ where: { verificationStatus: "PENDING_VERIFICATION", deletedAt: null } }),
      prisma.product.count({ where: { verificationStatus: "VERIFIED", deletedAt: null } }),
      prisma.product.count({ where: { verificationStatus: "VERIFICATION_REQUIRED", deletedAt: null } }),
      prisma.product.count({ where: { verificationStatus: "CHANGES_PROPOSED", deletedAt: null } }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats: {
        pending: pendingCount,
        verified: verifiedCount,
        verificationRequired: reqCount,
        changesProposed: proposedCount,
        total: totalCount,
      },
    });
  } catch (error: any) {
    console.error("Error fetching governance products:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Direct Verify or Reject (requires elevated DBA session)
export async function POST(req: NextRequest) {
  const elevated = await verifyElevatedSession(req);
  if (!elevated.authorized) return elevated.response;

  try {
    const body = await req.json();
    const { productId, action, notes } = body; // action: 'VERIFY' | 'REJECT' | 'REQUEST_REVERIFY'

    if (!productId || !action) {
      return NextResponse.json({ error: "Product ID and action are required" }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    let newStatus: any = "VERIFIED";
    if (action === "REJECT") newStatus = "REJECTED";
    if (action === "REQUEST_REVERIFY") newStatus = "VERIFICATION_REQUIRED";

    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.product.update({
        where: { id: productId },
        data: {
          verificationStatus: newStatus,
          verifiedAt: newStatus === "VERIFIED" ? new Date() : product.verifiedAt,
          verifiedById: newStatus === "VERIFIED" ? (elevated.user as any).id : product.verifiedById,
        },
      });

      await tx.productVerification.create({
        data: {
          productId,
          verifiedById: (elevated.user as any).id,
          verifiedVersion: p.version,
          status: newStatus,
          notes: notes || null,
          diffSnapshot: JSON.stringify({
            title: p.title,
            price: p.price,
            originalPrice: p.originalPrice,
            purity: p.purity,
            weight: p.weight,
          }),
        },
      });

      return p;
    });

    await recordAuditLog({
      actorId: (elevated.user as any).id,
      action: `PRODUCT_VERIFICATION_${action}`,
      entityType: "Product",
      entityId: productId,
      oldValue: { status: product.verificationStatus },
      newValue: { status: newStatus, notes },
    });

    return NextResponse.json({ success: true, product: updated });
  } catch (error: any) {
    console.error("Error updating verification:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Direct edit product details (elevated DBA) or auto-create change request (proposer)
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { productId, updates, reason } = body;

    if (!productId || !updates) {
      return NextResponse.json({ error: "Product ID and updates are required" }, { status: 400 });
    }

    const currentProduct = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!currentProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Check elevated session
    const elevated = await verifyElevatedSession(req);
    if (elevated.authorized && elevated.isElevated) {
      // Direct update permitted! DBA edits are directly applied and verified
      const updated = await prisma.$transaction(async (tx) => {
        const p = await tx.product.update({
          where: { id: productId },
          data: {
            ...updates,
            version: { increment: 1 },
            verificationStatus: "VERIFIED",
            verifiedAt: new Date(),
            verifiedById: (elevated.user as any).id,
          },
        });

        await tx.productVerification.create({
          data: {
            productId,
            verifiedById: (elevated.user as any).id,
            verifiedVersion: p.version,
            status: "VERIFIED",
            notes: reason || "Direct DBA product update & verification",
            diffSnapshot: JSON.stringify(updates),
          },
        });

        return p;
      });

      await recordAuditLog({
        actorId: (elevated.user as any).id,
        action: "PRODUCT_DIRECT_UPDATE",
        entityType: "Product",
        entityId: productId,
        oldValue: currentProduct,
        newValue: updates,
      });

      return NextResponse.json({
        success: true,
        mode: "DIRECT_APPLIED",
        product: updated,
      });
    }

    // Otherwise, user is a regular admin: submit as a ChangeRequest
    const auth = await verifyAdminAuth();
    if (!auth.authorized) return auth.response;

    const fieldChanges: any = {};
    for (const [key, newVal] of Object.entries(updates)) {
      const oldVal = (currentProduct as any)[key];
      const isNum = typeof oldVal === "number" || typeof newVal === "number";
      const normOld = isNum ? Number(oldVal ?? 0) : String(oldVal ?? "").trim();
      const normNew = isNum ? Number(newVal ?? 0) : String(newVal ?? "").trim();
      const hasChanged = normOld !== normNew;

      fieldChanges[key] = {
        old: oldVal,
        new: newVal,
        changed: hasChanged,
      };
    }

    const changeRequest = await prisma.$transaction(async (tx) => {
      const cr = await tx.changeRequest.create({
        data: {
          requestedById: (auth.user as any).id,
          requestType: "FIELD_UPDATE",
          scope: "SINGLE_PRODUCT",
          status: "PENDING",
          reason: reason || "Field details updated via Product Inspector",
        },
      });

      await tx.changeRequestItem.create({
        data: {
          changeRequestId: cr.id,
          productId,
          fieldChanges: JSON.stringify(fieldChanges),
        },
      });

      await tx.product.update({
        where: { id: productId },
        data: { verificationStatus: "CHANGES_PROPOSED" },
      });

      return cr;
    });

    await recordAuditLog({
      actorId: (auth.user as any).id,
      action: "CHANGE_PROPOSAL_SUBMITTED",
      entityType: "ChangeRequest",
      entityId: changeRequest.id,
      newValue: { productId, fieldChanges, reason },
    });

    return NextResponse.json({
      success: true,
      mode: "PROPOSAL_CREATED",
      message: "Proposed changes submitted for Database Administrator approval.",
      changeRequest,
    });
  } catch (error: any) {
    console.error("Error saving product updates:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

