import axios from "axios";

// Backend yang sama persis dipakai command .amprem di bot WhatsApp kamu
// (lihat baseUrl/apiKey di case "amprem"). Dipindah ke sini biar
// dipanggil server-side dari web (API key jangan pernah nyampe ke
// browser).
const BASE_URL = process.env.AM_PREMIUM_BASE_URL || "https://alipshop.clutch.web.id/api/v1/premium";
const API_KEY = process.env.AM_PREMIUM_API_KEY;

function headers() {
  if (!API_KEY) {
    throw new Error("AM_PREMIUM_API_KEY belum di-set di environment variable.");
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${API_KEY}`
  };
}

export async function sendAmVerificationEmail(email) {
  const res = await axios.post(
    `${BASE_URL}/send`,
    { email },
    { headers: headers(), timeout: 30000 }
  );
  return res.data;
}

export async function verifyAmLink(email, link) {
  const res = await axios.post(
    `${BASE_URL}/verif`,
    { email, link },
    { headers: headers(), timeout: 30000 }
  );
  return res.data;
}

// Terjemahin error dari API AM ke pesan yang enak dibaca buyer — dipetik
// dari pola error handling yang sama di command .amprem bot WhatsApp.
export function describeAmError(err) {
  const status = err.response?.status;
  if (status === 400) return "Email/link tidak valid atau sudah terdaftar.";
  if (status === 401) return "API Key server bermasalah, hubungi admin.";
  if (status === 502) return "Server Alight Motion lagi bermasalah. Coba lagi nanti.";
  return err.message || "Terjadi kesalahan, coba lagi.";
}
