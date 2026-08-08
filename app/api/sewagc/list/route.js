import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import axios from "axios";

const BASE = process.env.SEWAGC_API_BASE_URL;
const API_KEY = process.env.SEWAGC_API_KEY;

export async function GET() {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });

  try {
    const res = await axios.get(`${BASE}/api/sewagc/list`, {
      headers: { "x-api-key": API_KEY },
      timeout: 15000
    });
    return NextResponse.json({ success: true, data: res.data.data });
  } catch (e) {
    const message = e.response?.data?.error || "Gagal menghubungi bot. Pastikan bot sedang online.";
    return NextResponse.json({ error: message }, { status: e.response?.status || 502 });
  }
}
