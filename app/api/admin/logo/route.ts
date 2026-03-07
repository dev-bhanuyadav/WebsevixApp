export const dynamic = "force-dynamic";
import { NextRequest } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { jsonResponse } from "@/lib/api";
import { verifyAdmin } from "@/lib/adminAuth";
import { connectDB } from "@/lib/mongodb";
import { SiteSettings } from "@/models/SiteSettings";

/** POST /api/admin/logo
 *  Body: FormData with field "file" (image) and "type" = "wide" | "square"
 *  Saves to /public/uploads/ and updates SiteSettings in DB
 */
export async function POST(request: NextRequest) {
  try {
    await verifyAdmin(request);

    const formData = await request.formData();
    const file     = formData.get("file") as File | null;
    const type     = (formData.get("type") as string) || "square"; // "wide" | "square"

    if (!file) return jsonResponse({ error: "No file uploaded" }, 400);

    // Validate file type
    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/svg+xml", "image/webp"];
    if (!allowed.includes(file.type))
      return jsonResponse({ error: "Only PNG, JPG, SVG, or WEBP allowed" }, 400);

    // Max 2MB
    if (file.size > 2 * 1024 * 1024)
      return jsonResponse({ error: "File too large (max 2MB)" }, 400);

    const ext      = file.name.split(".").pop() ?? "png";
    const filename = type === "wide" ? `logo-wide.${ext}` : `logo-square.${ext}`;
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(path.join(uploadDir, filename), buffer);

    const url = `/uploads/${filename}?t=${Date.now()}`; // cache-bust

    // Persist URL to DB
    await connectDB();
    await SiteSettings.findOneAndUpdate(
      {},
      type === "wide" ? { logoWide: url } : { logoSquare: url },
      { upsert: true, new: true }
    );

    return jsonResponse({ success: true, url, type });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "Unauthorized" || msg === "Forbidden")
      return jsonResponse({ error: msg }, msg === "Unauthorized" ? 401 : 403);
    console.error("[admin/logo]", e);
    return jsonResponse({ error: "Upload failed" }, 500);
  }
}
