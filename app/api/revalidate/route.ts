import { revalidateTag, revalidatePath } from "next/cache";
import { NextResponse } from "next/server";

export async function GET() {
  // revalidateTag("products");
  revalidatePath("/", "layout");
  return NextResponse.json({ message: "Cache cleared successfully" });
}
