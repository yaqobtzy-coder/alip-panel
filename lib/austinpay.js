import crypto from "crypto";

const AUSTINPAY_BASE_URL = process.env.AUSTINPAY_BASE_URL || "https://austinstore.id";
const AUSTINPAY_API_KEY = process.env.AUSTINPAY_API_KEY;
// Vercel gak punya IP outbound tetap, jadi whitelist-IP dari AustinPay gak
// bisa dipakai. Solusi resminya (dari CS AustinPay): generate "API Secret"
// di dashboard AustinPay -> tiap request ditandatangani HMAC-SHA256.
// Opsional: kalau dikosongin, fallback ke cara lama (apikey di query string).
const AUSTINPAY_API_SECRET = process.env.AUSTINPAY_API_SECRET || "";

function stripApiVersion(url) {
  return String(url || "").replace(/\/api\/v[12]\/?$/, "").replace(/\/+$/, "");
}
const AUSTINPAY_HOST = stripApiVersion(AUSTINPAY_BASE_URL);

function signRequest(method, path, bodyStr) {
  const timestamp = Date.now().toString();
  const payload = `${method.toUpperCase()}\n${path}\n${bodyStr || ""}\n${timestamp}`;
  const signature = crypto.createHmac("sha256", AUSTINPAY_API_SECRET).update(payload).digest("hex");
  return { timestamp, signature };
}

async function austinPayRequest(method, path, body) {
  const apiPath = `/api/v2${path}`;
  const bodyStr = body ? JSON.stringify(body) : "";
  const headers = { "Content-Type": "application/json" };
  let url = `${AUSTINPAY_HOST}${apiPath}`;

  if (!AUSTINPAY_API_KEY) {
    throw new Error("AUSTINPAY_API_KEY belum di-set di environment Vercel.");
  }

  if (AUSTINPAY_API_SECRET) {
    const { timestamp, signature } = signRequest(method, apiPath, bodyStr);
    headers["X-Api-Key"] = AUSTINPAY_API_KEY || "";
    headers["X-Timestamp"] = timestamp;
    headers["X-Signature"] = signature;
  } else {
    url = `${url}?apikey=${encodeURIComponent(AUSTINPAY_API_KEY || "")}`;
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers,
      body: bodyStr || undefined
    });
  } catch (netErr) {
    throw new Error(`AustinPay tidak bisa dihubungi: ${netErr.message}`);
  }

  const data = await res.json().catch(() => null);

  if (!res.ok || !data?.success) {
    const msg =
      data?.message ||
      data?.error ||
      data?.msg ||
      `AustinPay ${path} gagal (HTTP ${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.austinPayBody = data;
    console.error("[AustinPay ERROR]", {
      path,
      status: res.status,
      body: data,
      amount: body?.amount
    });
    throw err;
  }
  return data;
}

export async function createDepositAustin(amount) {
  // Gateway biasanya cuma terima integer (rupiah bulat). Float/NaN = 400.
  const nominal = Math.round(Number(amount));
  if (!Number.isFinite(nominal) || nominal < 1) {
    throw new Error(`Nominal deposit tidak valid: ${amount}`);
  }
  if (nominal < 500) {
    throw new Error(`Minimal deposit Rp500 (diminta Rp${nominal}).`);
  }

  const data = await austinPayRequest("POST", "/deposit/create", { amount: nominal });
  if (!data?.deposit) {
    throw new Error("AustinPay tidak mengembalikan data deposit.");
  }
  return data.deposit;
}

export async function getDepositStatusAustin(transactionId) {
  if (!transactionId) return null;
  const data = await austinPayRequest("GET", `/deposit/check/${encodeURIComponent(transactionId)}`);
  return { status: data.status, message: data.message };
}

export async function cancelDepositAustin(transactionId) {
  if (!transactionId) return null;
  return austinPayRequest("POST", `/deposit/cancel/${encodeURIComponent(transactionId)}`);
}
