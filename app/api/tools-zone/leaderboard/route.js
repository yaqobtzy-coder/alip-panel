import { NextResponse } from "next/server";
import { db } from "@/lib/firebaseAdmin";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const game = searchParams.get("game");
  if (!game) {
    return NextResponse.json({ status: false, message: "game wajib diisi" }, { status: 400 });
  }

  try {
    const snap = await db.collection("toolsLeaderboard").where("game", "==", game).get();
    const top10 = snap.docs
      .map((d) => d.data())
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map((d) => ({ username: d.username, score: d.score }));

    return NextResponse.json({ status: true, leaderboard: top10 });
  } catch (error) {
    console.error("Tools-zone leaderboard GET error:", error);
    return NextResponse.json({ status: false, message: "Server error: " + error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const { game, username, score } = await req.json();
    if (!game || !username || score === undefined) {
      return NextResponse.json({ status: false, message: "game, username, dan score wajib diisi" }, { status: 400 });
    }

    const docId = `${game}__${username}`;
    const docRef = db.collection("toolsLeaderboard").doc(docId);
    const existingSnap = await docRef.get();
    const existingScore = existingSnap.exists ? existingSnap.data().score : 0;

    if (score > existingScore) {
      await docRef.set({ game, username, score, updatedAt: new Date().toISOString() });
    }

    return NextResponse.json({ status: true, message: "Skor tersimpan", best: Math.max(score, existingScore) });
  } catch (error) {
    console.error("Tools-zone leaderboard POST error:", error);
    return NextResponse.json({ status: false, message: "Server error: " + error.message }, { status: 500 });
  }
}
