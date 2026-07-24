"use client";

import { useState } from "react";
import Link from "next/link";

const GAMES = {
  "asah-otak": "Asah Otak",
  "cak-lontong": "Cak Lontong",
  "family-100": "Family 100",
  "lengkapi-kalimat": "Lengkapi Kalimat",
  "siapakah-aku": "Siapakah Aku",
  "susun-kata": "Susun Kata",
  "tebak-bendera": "Tebak Bendera",
  "tebak-gambar": "Tebak Gambar",
  "tebak-game": "Tebak Game",
  "tebak-kata": "Tebak Kata",
  "tebak-lagu": "Tebak Lagu",
  "tebak-logo": "Tebak Logo",
  "tebak-makanan": "Tebak Makanan"
};

export default function GamePage() {
  const [username, setUsername] = useState("");
  const [selected, setSelected] = useState(null);
  const [question, setQuestion] = useState(null);
  const [guess, setGuess] = useState("");
  const [result, setResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState(null);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function startGame(key) {
    if (!username.trim()) {
      setError("Isi username dulu ya.");
      return;
    }
    setError("");
    setSelected(key);
    setResult(null);
    setGuess("");
    setLoading(true);
    try {
      const res = await fetch(`/api/tools-zone/game?tool=${key}&username=${encodeURIComponent(username)}`);
      const data = await res.json();
      if (!data.status) throw new Error(data.message);
      setQuestion(data);
    } catch (err) {
      setError(err.message);
      setSelected(null);
    } finally {
      setLoading(false);
    }
  }

  async function submitGuess(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/tools-zone/game", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: question.sessionId, guess })
      });
      const data = await res.json();
      setResult(data);
      if (data.correct) {
        const newScore = score + 10;
        setScore(newScore);
        await fetch("/api/tools-zone/leaderboard", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ game: selected, username, score: newScore })
        });
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function showLeaderboard(key) {
    const res = await fetch(`/api/tools-zone/leaderboard?game=${key}`);
    const data = await res.json();
    setLeaderboard({ game: key, list: data.leaderboard || [] });
  }

  return (
    <main className="min-h-screen px-6 py-14 mx-auto max-w-3xl">
      <Link href="/tools-zone" className="mono text-sm text-accent2">← Tools Zone</Link>
      <h1 className="display text-3xl font-bold text-white mt-3 mb-6">Tebak-Tebakan</h1>

      <div className="mb-6">
        <label className="text-sm text-muted block mb-1">Username kamu</label>
        <input className="field" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="masukin nama" />
      </div>

      {error && <p className="text-danger text-sm mb-4">{error}</p>}

      {!selected && (
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(GAMES).map(([key, name]) => (
            <div key={key} className="card p-4 flex items-center justify-between hover-lift">
              <button onClick={() => startGame(key)} className="text-white font-medium text-left flex-1">{name}</button>
              <button onClick={() => showLeaderboard(key)} className="mono text-xs text-accent2 ml-3">skor</button>
            </div>
          ))}
        </div>
      )}

      {leaderboard && (
        <div className="card p-5 mt-5 hover-lift">
          <div className="flex items-center justify-between mb-3">
            <h3 className="display text-white">Leaderboard — {GAMES[leaderboard.game]}</h3>
            <button onClick={() => setLeaderboard(null)} className="mono text-xs text-muted">tutup</button>
          </div>
          {leaderboard.list.length === 0 ? (
            <p className="text-muted text-sm">Belum ada skor.</p>
          ) : (
            <ol className="space-y-1">
              {leaderboard.list.map((l, i) => (
                <li key={l.username} className="flex justify-between text-sm">
                  <span className="text-white">{i + 1}. {l.username}</span>
                  <span className="mono text-accent2">{l.score}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}

      {selected && question && (
        <div className="card p-5 hover-lift">
          <div className="flex items-center justify-between mb-4">
            <h2 className="display text-lg text-white">{GAMES[selected]}</h2>
            <button onClick={() => setSelected(null)} className="mono text-xs text-muted">ganti game</button>
          </div>

          <p className="text-white mb-2">{question.soal}</p>
          {question.deskripsi && <p className="text-muted text-sm mb-3">{question.deskripsi}</p>}
          {question.img && <img src={question.img} alt="soal" className="rounded-md border border-line mb-3 max-w-full" />}
          {question.audio && <audio controls src={question.audio} className="w-full mb-3" />}

          {!result && (
            <form onSubmit={submitGuess} className="flex gap-2">
              <input className="field" value={guess} onChange={(e) => setGuess(e.target.value)} placeholder="Jawaban kamu" required />
              <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap">Jawab</button>
            </form>
          )}

          {result && (
            <div className="mt-3">
              <p className={result.correct ? "text-accent2" : "text-danger"}>
                {result.correct ? "Bener! +10 poin 🎉" : "Salah 😅"}
              </p>
              {!result.correct && (
                <p className="text-muted text-sm mt-1">
                  Jawaban benar: {Array.isArray(result.correctAnswer) ? result.correctAnswer.join(", ") : result.correctAnswer}
                </p>
              )}
              <button onClick={() => startGame(selected)} className="btn-primary mt-3">Main lagi</button>
            </div>
          )}
        </div>
      )}

      {score > 0 && <p className="mono text-sm text-muted mt-6">Skor sesi ini: {score}</p>}
    </main>
  );
}
