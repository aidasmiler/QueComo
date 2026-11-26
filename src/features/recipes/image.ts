const MAX_EDGE = 1600;
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

/**
 * Shrinks a photo in the browser before uploading (keeps the free Storage quota small and removes
 * EXIF metadata such as GPS, since the canvas re-encodes the pixels only).
 */
export async function preparePhoto(file: File): Promise<Blob> {
  if (!file.type.startsWith('image/') || file.size > MAX_INPUT_BYTES) {
    throw new Error('photo-too-big');
  }
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('canvas-unavailable');
  context.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', 0.82),
  );
  if (blob && blob.type === 'image/webp') return blob;
  // Safari < 17 can't encode WebP: fall back to JPEG.
  const jpeg = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/jpeg', 0.85),
  );
  if (!jpeg) throw new Error('encode-failed');
  return jpeg;
}
