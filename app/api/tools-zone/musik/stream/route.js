import { NextResponse } from "next/server";

// Stream ulang file audio/video dari Blckrose lewat server kita sendiri.
// Alasannya: kalau <audio>/<video> di browser langsung nembak URL CDN
// blckrose, sering diblok (proteksi hotlink berdasar Referer, atau CORS)
// sehingga terlihat seperti "gak bisa diputar". Dengan proxy server-to-
// server, request itu jadi datang dari backend kita (tanpa Referer
// browser), dan kita juga bisa mastiin Content-Type & dukungan
// Range/seek-nya benar.
const ALLOWED_HOST = "api.blckrose.my.id";

function guessContentType(url) {
  if (url.endsWith(".mp3")) return "audio/mpeg";
  if (url.endsWith(".mp4")) return "video/mp4";
  if (url.endsWith(".m4a")) return "audio/mp4";
  if (url.endsWith(".webm")) return "video/webm";
  return null;
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const src = searchParams.get("url");

  if (!src) {
    return NextResponse.json({ status: false, message: "Parameter url wajib diisi." }, { status: 400 });
  }

  let parsed;
  try {
    parsed = new URL(src);
  } catch {
    return NextResponse.json({ status: false, message: "URL tidak valid." }, { status: 400 });
  }
  if (parsed.hostname !== ALLOWED_HOST) {
    return NextResponse.json({ status: false, message: "Sumber URL tidak diizinkan." }, { status: 400 });
  }

  const range = req.headers.get("range");

  try {
    const upstream = await fetch(src, { headers: range ? { Range: range } : {} });
    if (!upstream.ok && upstream.status !== 206) {
      return NextResponse.json(
        { status: false, message: `Gagal mengambil file (${upstream.status}).` },
        { status: upstream.status }
      );
    }

    const headers = new Headers();
    const contentType = upstream.headers.get("content-type") || guessContentType(src) || "application/octet-stream";
    headers.set("Content-Type", contentType);
    headers.set("Accept-Ranges", "bytes");
    const contentLength = upstream.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);
    const contentRange = upstream.headers.get("content-range");
    if (contentRange) headers.set("Content-Range", contentRange);
    headers.set("Cache-Control", "public, max-age=3600");

    return new NextResponse(upstream.body, { status: upstream.status, headers });
  } catch (error) {
    console.error("Musik stream proxy error:", error);
    return NextResponse.json({ status: false, message: "Server error: " + error.message }, { status: 500 });
  }
}
