import { NextResponse } from "next/server";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const text = searchParams.get("text");
  const model = searchParams.get("model") || "default";

  if (!text) {
    return NextResponse.json({ status: false, message: "Text is required" }, { status: 400 });
  }

  const apiUrl = process.env.AI_API_URL;
  const apiKey = process.env.AI_API_KEY;
  if (!apiUrl || !apiKey) {
    return NextResponse.json({ status: false, message: "AI API configuration missing" }, { status: 500 });
  }

  try {
    const response = await fetch(`${apiUrl}?text=${encodeURIComponent(text)}&model=${model}&apikey=${apiKey}`);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Tools-zone AI error:", error);
    return NextResponse.json({ status: false, message: "Server error: " + error.message }, { status: 500 });
  }
}
