import { NextResponse } from "next/server";
import { CANVAS_TOOLS } from "@/lib/toolsZoneData";

const API_KEY = process.env.TOOLS_ZONE_API_KEY;

async function forwardResponse(response) {
  const contentType = response.headers.get("content-type") || "";

  if (contentType.includes("image/")) {
    const buffer = Buffer.from(await response.arrayBuffer());
    return new NextResponse(buffer, {
      status: 200,
      headers: { "Content-Type": contentType }
    });
  }

  if (contentType.includes("application/json")) {
    const data = await response.json();
    return NextResponse.json(data);
  }

  const text = await response.text();
  return NextResponse.json({ status: true, raw: text });
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const tool = searchParams.get("tool");

  const toolData = CANVAS_TOOLS[tool];
  if (!toolData) {
    return NextResponse.json({ status: false, message: `Tool "${tool}" tidak ditemukan.` }, { status: 404 });
  }
  if (toolData.method !== "GET") {
    return NextResponse.json({ status: false, message: "Tool ini butuh method POST." }, { status: 400 });
  }

  const urlParams = new URLSearchParams();
  if (toolData.needsApiKey) {
    if (!API_KEY) {
      return NextResponse.json({ status: false, message: "TOOLS_ZONE_API_KEY belum diatur di environment." }, { status: 500 });
    }
    urlParams.append("apikey", API_KEY);
  }

  for (const p of toolData.params) {
    const val = searchParams.get(p.name);
    if (p.required && !val) {
      return NextResponse.json({ status: false, message: `Parameter "${p.name}" wajib diisi.` }, { status: 400 });
    }
    if (val) urlParams.append(p.name, val);
  }

  try {
    const response = await fetch(`${toolData.reqUrl}?${urlParams.toString()}`);
    if (!response.ok) {
      return NextResponse.json(
        { status: false, message: `API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    return forwardResponse(response);
  } catch (error) {
    console.error("Tools-zone proxy GET error:", error);
    return NextResponse.json({ status: false, message: "Server error: " + error.message }, { status: 500 });
  }
}

export async function POST(req) {
  const { searchParams } = new URL(req.url);
  const tool = searchParams.get("tool");

  const toolData = CANVAS_TOOLS[tool];
  if (!toolData) {
    return NextResponse.json({ status: false, message: `Tool "${tool}" tidak ditemukan.` }, { status: 404 });
  }
  if (toolData.method !== "POST") {
    return NextResponse.json({ status: false, message: "Tool ini pakai method GET." }, { status: 400 });
  }
  if (toolData.needsApiKey && !API_KEY) {
    return NextResponse.json({ status: false, message: "TOOLS_ZONE_API_KEY belum diatur di environment." }, { status: 500 });
  }

  try {
    const incoming = await req.formData();
    const outgoing = new FormData();
    if (toolData.needsApiKey) outgoing.append("apikey", API_KEY);

    for (const p of toolData.params) {
      const val = incoming.get(p.name);
      if (p.required && !val) {
        return NextResponse.json({ status: false, message: `Parameter "${p.name}" wajib diisi.` }, { status: 400 });
      }
      if (val) outgoing.append(p.name, val);
    }

    if (toolData.fileField) {
      const file = incoming.get(toolData.fileField);
      if (!file) {
        return NextResponse.json({ status: false, message: `File "${toolData.fileField}" wajib diupload.` }, { status: 400 });
      }
      outgoing.append(toolData.fileField, file, file.name || "upload.jpg");
    }

    const response = await fetch(toolData.reqUrl, { method: "POST", body: outgoing });
    if (!response.ok) {
      return NextResponse.json(
        { status: false, message: `API error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }
    return forwardResponse(response);
  } catch (error) {
    console.error("Tools-zone proxy POST error:", error);
    return NextResponse.json({ status: false, message: "Server error: " + error.message }, { status: 500 });
  }
}
