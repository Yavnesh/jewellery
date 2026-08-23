import { NextResponse } from "next/server";
import prisma from "@/utils/db";

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const deleteProducts = url.searchParams.get("deleteProducts") === "true";

    const batch = await prisma.bulk_upload_batch.findUnique({
      where: { id },
      include: { items: true }
    });

    if (!batch) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      if (deleteProducts) {
        // Delete all products created in this batch
        const productIds = batch.items
          .map(item => item.productId)
          .filter(Boolean) as string[];

        if (productIds.length > 0) {
          // Cascade handles delete dependencies (CartItem, Wishlist, Image)
          await tx.product.deleteMany({
            where: { id: { in: productIds } }
          });
        }
      }

      // Delete batch and audit items (cascade onDelete)
      await tx.bulk_upload_batch.delete({
        where: { id }
      });
    });

    return NextResponse.json({ success: true, message: "Batch deleted successfully" });
  } catch (error: any) {
    console.error("Delete Batch Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
