import { NextRequest, NextResponse } from "next/server";
import { verifyAdminAuth, recordAuditLog } from "@/lib/adminAuthHelper";
import { verifyElevatedSession } from "@/lib/elevatedAuthHelper";
import prisma from "@/utils/db";

// GET: List change proposals
export async function GET(req: NextRequest) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "15");

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [requests, totalCount] = await Promise.all([
      prisma.changeRequest.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { submittedAt: "desc" },
        include: {
          requestedBy: { select: { id: true, email: true } },
          reviewedBy: { select: { id: true, email: true } },
          items: {
            include: {
              product: {
                select: { id: true, title: true, price: true, originalPrice: true, mainImage: true },
              },
            },
          },
        },
      }),
      prisma.changeRequest.count({ where }),
    ]);

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching change proposals:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Submit a new change proposal (accessible by regular admins and DBAs)
export async function POST(req: NextRequest) {
  const auth = await verifyAdminAuth();
  if (!auth.authorized) return auth.response;

  try {
    const body = await req.json();
    const {
      requestType, // e.g. "FIELD_UPDATE", "SOFT_DELETE", "BULK_DISCOUNT"
      scope,       // "SINGLE_PRODUCT" | "SELECTED_PRODUCTS" | "CATEGORY_BULK"
      reason,
      items,       // Array of { productId, fieldChanges: { field: { old: ..., new: ... } } }
      metadata,
    } = body;

    if (!requestType || !scope || !reason || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: "Invalid proposal payload. requestType, scope, reason, and items are required." },
        { status: 400 }
      );
    }

    const changeRequest = await prisma.$transaction(async (tx) => {
      const cr = await tx.changeRequest.create({
        data: {
          requestedById: (auth.user as any).id,
          requestType,
          scope,
          status: "PENDING",
          reason,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      });

      // Create items
      for (const item of items) {
        await tx.changeRequestItem.create({
          data: {
            changeRequestId: cr.id,
            productId: item.productId,
            fieldChanges: JSON.stringify(item.fieldChanges),
          },
        });

        // Set product status to CHANGES_PROPOSED
        await tx.product.update({
          where: { id: item.productId },
          data: { verificationStatus: "CHANGES_PROPOSED" },
        });
      }

      return cr;
    });

    await recordAuditLog({
      actorId: (auth.user as any).id,
      action: "CHANGE_PROPOSAL_SUBMITTED",
      entityType: "ChangeRequest",
      entityId: changeRequest.id,
      newValue: { scope, requestType, itemCount: items.length, reason },
    });

    return NextResponse.json({ success: true, changeRequest }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating change proposal:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Approve or Reject one or multiple change proposals (requires elevated DBA access)
export async function PUT(req: NextRequest) {
  const elevated = await verifyElevatedSession(req);
  if (!elevated.authorized) return elevated.response;

  try {
    const body = await req.json();
    const { requestId, requestIds, action, reviewNotes } = body; // action: 'APPROVE' | 'REJECT'

    const targetIds: string[] = Array.isArray(requestIds) && requestIds.length > 0
      ? requestIds
      : requestId
      ? [requestId]
      : [];

    if (targetIds.length === 0 || !action) {
      return NextResponse.json(
        { error: "Proposal ID(s) and action ('APPROVE' | 'REJECT') are required" },
        { status: 400 }
      );
    }

    if (action !== "APPROVE" && action !== "REJECT") {
      return NextResponse.json(
        { error: "Invalid action. Must be 'APPROVE' or 'REJECT'" },
        { status: 400 }
      );
    }

    const requests = await prisma.changeRequest.findMany({
      where: { id: { in: targetIds } },
      include: { items: true },
    });

    if (requests.length === 0) {
      return NextResponse.json({ error: "No matching change proposals found" }, { status: 404 });
    }

    const pendingRequests = requests.filter((r) => r.status === "PENDING");
    if (pendingRequests.length === 0) {
      return NextResponse.json(
        { error: "Selected proposal(s) have already been evaluated" },
        { status: 400 }
      );
    }

    const reviewerId = (elevated.user as any).id;
    const now = new Date();

    if (action === "REJECT") {
      await prisma.$transaction(async (tx) => {
        for (const reqItem of pendingRequests) {
          await tx.changeRequest.update({
            where: { id: reqItem.id },
            data: {
              status: "REJECTED",
              reviewedById: reviewerId,
              reviewedAt: now,
              reviewNotes: reviewNotes || "Rejected by Database Administrator",
            },
          });

          // Revert product statuses: if previously verified, keep VERIFIED, else PENDING_VERIFICATION
          for (const item of reqItem.items) {
            const currentProd = await tx.product.findUnique({
              where: { id: item.productId },
              select: { verifiedAt: true },
            });
            const revertStatus = currentProd?.verifiedAt ? "VERIFIED" : "PENDING_VERIFICATION";
            await tx.product.update({
              where: { id: item.productId },
              data: { verificationStatus: revertStatus },
            });
          }
        }
      });

      for (const reqItem of pendingRequests) {
        await recordAuditLog({
          actorId: reviewerId,
          action: "CHANGE_PROPOSAL_REJECTED",
          entityType: "ChangeRequest",
          entityId: reqItem.id,
          newValue: { reviewNotes },
        });
      }

      return NextResponse.json({
        success: true,
        processedCount: pendingRequests.length,
        message:
          pendingRequests.length === 1
            ? `Proposal #${pendingRequests[0].id.slice(0, 8)} rejected.`
            : `Successfully rejected ${pendingRequests.length} proposals.`,
      });
    }

    if (action === "APPROVE") {
      // Apply the proposed changes inside an atomic transaction and mark products as VERIFIED directly
      await prisma.$transaction(async (tx) => {
        for (const reqItem of pendingRequests) {
          for (const item of reqItem.items) {
            let parsedChanges: Record<string, { old: any; new: any }> = {};
            try {
              parsedChanges = JSON.parse(item.fieldChanges);
            } catch (err) {
              console.error("Failed to parse fieldChanges:", err);
            }

            const updatePayload: any = {};
            for (const [field, change] of Object.entries<any>(parsedChanges)) {
              updatePayload[field] = change.new;
            }

            // Directly update product in DB & mark VERIFIED (no reverification barrier)
            const updatedProduct = await tx.product.update({
              where: { id: item.productId },
              data: {
                ...updatePayload,
                version: { increment: 1 },
                verificationStatus: "VERIFIED",
                verifiedAt: now,
                verifiedById: reviewerId,
              },
            });

            // Write verification entry
            await tx.productVerification.create({
              data: {
                productId: item.productId,
                verifiedById: reviewerId,
                verifiedVersion: updatedProduct.version,
                status: "VERIFIED",
                notes:
                  reviewNotes ||
                  `Approved via Proposal #${reqItem.id.slice(0, 8)}: ${reqItem.reason || "Approved by DBA"}`,
                diffSnapshot: item.fieldChanges,
              },
            });

            await tx.changeRequestItem.update({
              where: { id: item.id },
              data: { applied: true },
            });
          }

          await tx.changeRequest.update({
            where: { id: reqItem.id },
            data: {
              status: "APPROVED",
              reviewedById: reviewerId,
              reviewedAt: now,
              reviewNotes: reviewNotes || "Approved and applied by Database Administrator",
            },
          });
        }
      });

      for (const reqItem of pendingRequests) {
        await recordAuditLog({
          actorId: reviewerId,
          action: "CHANGE_PROPOSAL_APPROVED_APPLIED",
          entityType: "ChangeRequest",
          entityId: reqItem.id,
          newValue: { itemsCount: reqItem.items.length, status: "VERIFIED" },
        });
      }

      return NextResponse.json({
        success: true,
        processedCount: pendingRequests.length,
        message:
          pendingRequests.length === 1
            ? `Proposal #${pendingRequests[0].id.slice(0, 8)} approved & updated in database.`
            : `Successfully approved & updated ${pendingRequests.length} proposals directly in database.`,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Error evaluating change proposal:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
