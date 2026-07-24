import { bucket } from "@/lib/firebaseAdmin";

// Uploads a buffer (e.g. downloaded from a Telegram photo) as a public
// object and returns its public URL. Used for the "ganti logo" and promo
// popup image flows in the Telegram bot.
//
// Note: modern Firebase Storage buckets default to "Uniform bucket-level
// access", which disables legacy per-object ACLs — `public: true` throws
// in that case ("Cannot use legacy ACL because uniform bucket-level access
// is enabled"). We save the object first (that part always works), then
// try to make it public; if that fails because of uniform access, fall
// back to a long-lived signed URL so the upload still succeeds instead of
// throwing and silently killing the Telegram webhook response.
export async function uploadPublicImage(buffer, path, contentType = "image/jpeg") {
  const file = bucket.file(path);
  await file.save(buffer, { metadata: { contentType } });

  try {
    await file.makePublic();
    return `https://storage.googleapis.com/${bucket.name}/${path}`;
  } catch (err) {
    if (!/uniform bucket-level access/i.test(err?.message || "")) throw err;
    const [signedUrl] = await file.getSignedUrl({
      action: "read",
      expires: "01-01-2100"
    });
    return signedUrl;
  }
}
