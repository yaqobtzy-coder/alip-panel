import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";
import { GAMES_DATA, checkAnswer } from "@/lib/toolsZoneData";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const tool = searchParams.get("tool");
  const username = searchParams.get("username");

  if (action === "list") {
    const gameList = {};
    Object.keys(GAMES_DATA).forEach((key) => {
      gameList[key] = { name: GAMES_DATA[key].name, responseType: GAMES_DATA[key].responseType };
    });
    return NextResponse.json({ status: true, games: gameList, total: Object.keys(GAMES_DATA).length });
  }

  if (tool && username) {
    const gameData = GAMES_DATA[tool];
    if (!gameData) {
      return NextResponse.json({ status: false, message: "Game tidak ditemukan" }, { status: 404 });
    }

    try {
      const response = await fetch(gameData.reqUrl);
      const data = await response.json();

      if (!data.status || !data.result) {
        return NextResponse.json({ status: false, message: "Format respons game tidak sesuai" }, { status: 502 });
      }

      const responseType = gameData.responseType || "text";
      const result = data.result;
      let soal = "", jawaban = "", deskripsi = "", img = "", audio = "", judul = "", artis = "", tipe = "";

      if (responseType === "image") {
        img = result.img || "";
        jawaban = result.name || result.jawaban || "";
        deskripsi = result.deskripsi || "";
        soal = "Tebak gambar di bawah ini!";
      } else if (responseType === "image-text") {
        img = result.img || "";
        jawaban = result.jawaban || "";
        deskripsi = result.deskripsi || "";
        soal = result.soal || "Tebak gambar di bawah ini!";
      } else if (responseType === "audio") {
        audio = result.lagu || "";
        judul = result.judul || "";
        artis = result.artis || "";
        jawaban = result.judul || "";
        soal = "🎵 Tebak judul lagu ini!";
        if (artis) deskripsi = `Artis: ${artis}`;
      } else if (responseType === "list") {
        soal = result.soal || "";
        jawaban = result.jawaban || [];
        deskripsi = result.deskripsi || "";
      } else {
        soal = result.soal || "";
        jawaban = result.jawaban || "";
        deskripsi = result.deskripsi || "";
        tipe = result.tipe || "";
      }

      const jawabanEmpty = !jawaban || (typeof jawaban === "string" && jawaban === "") || (Array.isArray(jawaban) && jawaban.length === 0);
      if (jawabanEmpty) {
        return NextResponse.json({ status: false, message: "Format respons game tidak sesuai (jawaban tidak ditemukan)" }, { status: 502 });
      }

      const sessionId = `${username}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await db.collection("toolsGameSessions").doc(sessionId).set({
        jawaban, tool, username, responseType, createdAt: new Date().toISOString()
      });

      return NextResponse.json({
        status: true, sessionId, soal, jawaban, deskripsi, img, audio, judul, artis, tipe,
        responseType, isArray: Array.isArray(jawaban)
      });
    } catch (error) {
      console.error("Tools-zone game GET error:", error);
      return NextResponse.json({ status: false, message: "Server error: " + error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ status: false, message: "Invalid request" }, { status: 400 });
}

export async function POST(req) {
  try {
    const { sessionId, guess } = await req.json();
    if (!sessionId || guess === undefined) {
      return NextResponse.json({ status: false, message: "sessionId dan guess wajib diisi" }, { status: 400 });
    }

    const docRef = db.collection("toolsGameSessions").doc(sessionId);
    const snap = await docRef.get();
    if (!snap.exists) {
      return NextResponse.json({ status: false, message: "Sesi permainan tidak ditemukan atau sudah dipakai" }, { status: 404 });
    }

    const session = snap.data();
    const correct = checkAnswer(guess, session.jawaban);
    await docRef.delete();

    return NextResponse.json({ status: true, correct, correctAnswer: session.jawaban });
  } catch (error) {
    console.error("Tools-zone game POST error:", error);
    return NextResponse.json({ status: false, message: "Server error: " + error.message }, { status: 500 });
  }
}
