export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_SOURCE_BYTES = 20 * 1024 * 1024;
const MAX_DIMENSION = 2000;

export type CompressedImage = { blob: Blob; width: number; height: number };

/** Resize to ≤2000px on the long edge and re-encode as WebP (browser only). */
export async function compressImage(file: File): Promise<CompressedImage> {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) throw new Error("type");
  if (file.size > MAX_SOURCE_BYTES) throw new Error("size");

  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/webp", 0.85),
  );
  if (!blob) throw new Error("encode");
  if (blob.size > MAX_UPLOAD_BYTES) throw new Error("size");
  return { blob, width, height };
}
