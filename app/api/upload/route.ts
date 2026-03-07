export const dynamic = 'force-dynamic'
import { NextRequest } from "next/server";
import { jsonResponse } from "@/lib/api";
import { verifyAccessToken } from "@/lib/jwt";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/zip", "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
];

export async function POST(request: NextRequest) {
  try {
    const auth = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!auth) return jsonResponse({ error: "Unauthorized" }, 401);
    await verifyAccessToken(auth);

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) return jsonResponse({ error: "No file provided" }, 400);

    if (file.size > MAX_FILE_SIZE)             return jsonResponse({ error: "File too large (max 10MB)" }, 400);
    if (!ALLOWED_TYPES.includes(file.type))    return jsonResponse({ error: "File type not allowed" }, 400);

    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      const { uploadFile } = await import("@/lib/cloudinary");
      const { url, publicId } = await uploadFile(buffer, {
        filename: file.name,
        mimeType: file.type,
        folder:   "websevix/chat",
      });

      return jsonResponse({
        success: true,
        file: {
          url,
          publicId,
          name:     file.name,
          size:     file.size,
          mimeType: file.type,
        },
      });
    } catch (cloudErr) {
      // Fallback: return base64 data URL (dev only)
      console.warn("[upload] Cloudinary not configured, using base64 fallback");
      const base64 = `data:${file.type};base64,${buffer.toString("base64")}`;
      return jsonResponse({
        success: true,
        file: { url: base64, name: file.name, size: file.size, mimeType: file.type },
      });
    }
  } catch (e) {
    console.error("[upload]", e);
    return jsonResponse({ error: "Upload failed" }, 500);
  }
}
