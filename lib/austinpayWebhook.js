import crypto from "crypto";

export function verifyAustinPaySignature(rawBody, signatureHex) {
  const secret = process.env.AUSTINPAY_WEBHOOK_SECRET;
  if (!secret || !signatureHex) return false;

  try {
    const computed = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("hex");
    const sigBuf = Buffer.from(signatureHex, "hex");
    const computedBuf = Buffer.from(computed, "hex");
    if (sigBuf.length !== computedBuf.length) return false;
    return crypto.timingSafeEqual(sigBuf, computedBuf);
  } catch {
    return false;
  }
}
