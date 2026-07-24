import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import axios from "axios";

const BASE = process.env.SEWAGC_API_BASE_URL;
const API_KEY = process.env.SEWAGC_API_KEY;

export async function POST(req) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  const { link, days } = await req.json();
  const groupLink = String(link || "").trim();
  const durasi = parseInt(days, 10);

  if (!groupLink.includes("chat.whatsapp.com")) {
    return NextResponse.json({ error: "Link grup tidak valid." }, { status: 400 });
  }
  if (!durasi || durasi <= 0) {
    return NextResponse.json({ error: "Durasi (hari) harus lebih dari 0." }, { status: 400 });
  }

  try {
    const res = await axios.post(
      `${BASE}/api/sewagc/add`,
      { link: groupLink, days: durasi },
      { headers: { "x-api-key": API_KEY, "Content-Type": "application/json" }, timeout: 30000 }
    );
    return NextResponse.json({ success: true, data: res.data.data });
  } catch (e) {
    const status = e.response?.status || 502;
    const message = e.response?.data?.error || "Gagal menghubungi bot. Pastikan bot sedang online.";
    return NextResponse.json({ error: message }, { status });
  }
}
