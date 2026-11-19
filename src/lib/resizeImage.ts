/**
 * A photo made fit to post: a JPEG at most `maxEdge` px on its long side, turned the right way
 * up. Returns its size too, so a thumbnail can take its shape before the image loads.
 * (A GIF comes out as a still.)
 */
export async function resizeImage(file: File, maxEdge = 1600) {
  const bitmap = await decode(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) =>
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Couldn't read that photo"))),
      "image/jpeg",
      0.82,
    ),
  );
  return { blob, width, height };
}

/** Decoded the right way up. Older Safari rejects the option, but rotates by default anyway. */
async function decode(file: File) {
  try {
    return await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    return createImageBitmap(file);
  }
}
