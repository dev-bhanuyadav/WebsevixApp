import { v2 as cloudinary } from "cloudinary";

let configured = false;

function ensureConfigured() {
  if (configured) return;
  const name   = process.env.CLOUDINARY_CLOUD_NAME;
  const key    = process.env.CLOUDINARY_API_KEY;
  const secret = process.env.CLOUDINARY_API_SECRET;
  if (!name || !key || !secret) throw new Error("Cloudinary env vars not configured");
  cloudinary.config({ cloud_name: name, api_key: key, api_secret: secret, secure: true });
  configured = true;
}

export async function uploadFile(
  buffer: Buffer,
  options: { filename: string; mimeType: string; folder?: string }
): Promise<{ url: string; publicId: string }> {
  ensureConfigured();

  const isImage = options.mimeType.startsWith("image/");
  const resourceType = isImage ? "image" : "raw";

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder:         options.folder ?? "websevix/chat",
        resource_type:  resourceType,
        public_id:      `${Date.now()}-${options.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`,
        use_filename:   true,
        unique_filename: false,
      },
      (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

export function getFileSize(bytes: number): string {
  if (bytes < 1024)       return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
