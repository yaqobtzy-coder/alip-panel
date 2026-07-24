import { NextResponse } from "next/server";

// Proxy ke Blckrose "download/play" — dipakai buat cari & main lagu/video
// dari judul. Base URL & apikey SAMA dengan tools-zone lain (canvas/game),
// cuma path & query beda. Apikey WAJIB dari env, tidak pernah hardcode.
const BASE_URL = "https://api.blckrose.my.id/download/play";
const API_KEY = process.env.TOOLS_ZONE_API_KEY;

const AUDIO_BITRATES = ["64k", "128k", "192k", "256k", "320k"];
const VIDEO_RESOLUTIONS = ["360", "480", "720", "1080"];

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q");
  const type = searchParams.get("type") === "video" ? "video" : "audio";
  const bitrate = searchParams.get("bitrate") || "320k";
  const resolution = searchParams.get("resolution") || "360";

  if (!q || !q.trim()) {
    return NextResponse.json({ status: false, message: "Judul lagu/video wajib diisi." }, { status: 400 });
  }
  if (!API_KEY) {
    return NextResponse.json(
      { status: false, message: "TOOLS_ZONE_API_KEY belum diatur di environment." },
      { status: 500 }
    );
  }
  if (type === "audio" && !AUDIO_BITRATES.includes(bitrate)) {
    return NextResponse.json({ status: false, message: "Bitrate tidak valid." }, { status: 400 });
  }
  if (type === "video" && !VIDEO_RESOLUTIONS.includes(resolution)) {
    return NextResponse.json({ status: false, message: "Resolusi tidak valid." }, { status: 400 });
  }

  const params = new URLSearchParams({ q: q.trim(), type, apikey: API_KEY });
  if (type === "audio") params.append("bitrate", bitrate);
  else params.append("resolution", resolution);

  try {
    const upstream = await fetch(`${BASE_URL}?${params.toString()}`);
    const data = await upstream.json();
    if (!upstream.ok || !data?.status) {
      return NextResponse.json(
        { status: false, message: data?.message || "Lagu/video tidak ditemukan." },
        { status: upstream.ok ? 404 : upstream.status }
      );
    }
    return NextResponse.json({ status: true, type, result: data.result });
  } catch (error) {
    console.error("Tools-zone musik error:", error);
    return NextResponse.json({ status: false, message: "Server error: " + error.message }, { status: 500 });
  }
}
