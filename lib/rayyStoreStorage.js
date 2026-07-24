import { bucket } from "@/lib/firebaseAdmin";

// Generic public-file uploader (logo, banner, thumbnail, ATAU file .zip
// script). Sama pola dengan lib/storage.js (uniform bucket-level access
// fallback ke signed URL panjang umur).
export async function uploadRayyFile(buffer, path, contentType) {
  const file = bucket.file(path);
  await file.save(buffer, { metadata: { contentType } });
  try {
    await file.makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${path}`;
  } catch (err) {
    if (!/uniform bucket-level access/i.test(err?.message || "")) throw err;
    const [signedUrl] = await file.getSignedUrl({ action: "read", expires: "01-01-2100" });
    return signedUrl;
  }
}
