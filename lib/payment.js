import QRCode from "qrcode";

const PAKASIR_BASE = "https://app.pakasir.com";
const PROJECT = process.env.PAKASIR_PROJECT;
const API_KEY = process.env.PAKASIR_API_KEY;

// Create a QRIS transaction via the API and render the returned QR string
// into a PNG data URL, so the frontend can keep showing the QR inline
// (same UX as the old QRIS Zakki integration) instead of redirecting away.
export async function createInvoice(orderId, amount) {
  const res = await fetch(`${PAKASIR_BASE}/api/transactioncreate/qris`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project: PROJECT, order_id: orderId, amount, api_key: API_KEY })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Pakasir transactioncreate failed: ${res.status} ${text}`);
  }
  const { payment } = await res.json();
  const qrImage = await QRCode.toDataURL(payment.payment_number);
  return { ...payment, qr_image: qrImage };
}

// Re-renders the exact same QR image from a previously-issued payment
// number. Used to resume a still-pending invoice (refresh, cache clear,
// reopened tab) without calling Pakasir again or creating a new transaction.
export async function renderQrImage(paymentNumber) {
  return QRCode.toDataURL(paymentNumber);
}

// Build the hosted checkout URL as a fallback/alternative — Pakasir handles
// showing the QR/VA number, expiry countdown, and the "sudah bayar" flow.
// `amount` must be a whole number (no dots/spaces).
export function buildPaymentUrl(orderId, amount, { redirectUrl, qrisOnly = true } = {}) {
  const params = new URLSearchParams({ order_id: orderId });
  if (redirectUrl) params.set("redirect", redirectUrl);
  if (qrisOnly) params.set("qris_only", "1");
  return `${PAKASIR_BASE}/pay/${PROJECT}/${amount}?${params.toString()}`;
}

// Query the real status directly from Pakasir. Always trust this over a
// webhook payload alone — webhooks can be spoofed or arrive late/never.
export async function getTransactionDetail(orderId, amount) {
  const params = new URLSearchParams({
    project: PROJECT,
    amount: String(amount),
    order_id: orderId,
    api_key: API_KEY
  });
  const res = await fetch(`${PAKASIR_BASE}/api/transactiondetail?${params.toString()}`);
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Pakasir transactiondetail failed: ${res.status} ${text}`);
  }
  const data = await res.json();
  return data.transaction; // { amount, order_id, project, status, payment_method, completed_at }
}

export async function cancelTransaction(orderId, amount) {
  const res = await fetch(`${PAKASIR_BASE}/api/transactioncancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project: PROJECT, order_id: orderId, amount, api_key: API_KEY })
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Pakasir transactioncancel failed: ${res.status} ${text}`);
  }
  return res.json();
}
