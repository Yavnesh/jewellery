import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "public", "exports", "Vamika_Jewels_Products_Database.xlsx");
    const fallbackPath = path.join(process.cwd(), "Vamika_Jewels_Products_Database.xlsx");

    const targetPath = fs.existsSync(filePath) ? filePath : fallbackPath;

    if (!fs.existsSync(targetPath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const fileBuffer = fs.readFileSync(targetPath);

    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="Vamika_Jewels_Products_Database.xlsx"',
        "Content-Length": fileBuffer.length.toString(),
      },
    });
  } catch (error: any) {
    console.error("Export download error:", error);
    return NextResponse.json({ error: error.message || "Failed to download export" }, { status: 500 });
  }
}
