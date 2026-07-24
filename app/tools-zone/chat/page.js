"use client";

import { useState } from "react";
import Link from "next/link";

const MODELS = [{ value: "default", label: "Default" }];

export default function ChatAiPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [model, setModel] = useState("default");
  const [loading, setLoading] = useState(false);

  async function send(e) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;

    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`/api/tools-zone/ai?text=${encodeURIComponent(text)}&model=${model}`);
      const data = await res.json();
      const reply = data.result?.text || data.message || JSON.stringify(data);
      setMessages((m) => [...m, { role: "ai", text: reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: "ai", text: "Error: " + err.message }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-14 mx-auto max-w-2xl flex flex-col">
      <Link href="/tools-zone" className="mono text-sm text-accent2">← Tools Zone</Link>
      <h1 className="display text-3xl font-bold text-white mt-3 mb-6">Chat AI</h1>

      <div className="card flex-1 p-4 mb-4 min-h-[50vh] flex flex-col gap-3 overflow-y-auto hover-lift">
        {messages.length === 0 && <p className="text-muted text-sm">Mulai percakapan dengan AI. Ketik pertanyaan di bawah.</p>}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <span className={"inline-block rounded-md px-3 py-2 text-sm " + (m.role === "user" ? "bg-accent text-ink" : "bg-panel2 text-white border border-line")}>
              {m.text}
            </span>
          </div>
        ))}
        {loading && <p className="text-muted text-sm">AI sedang mengetik...</p>}
      </div>

      <form onSubmit={send} className="flex flex-col gap-2">
        <select value={model} onChange={(e) => setModel(e.target.value)} className="field">
          {MODELS.map((m) => (
            <option key={m.value} value={m.value}>{m.label}</option>
          ))}
        </select>
        <div className="flex gap-2">
          <input className="field" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ketik pertanyaan..." />
          <button type="submit" disabled={loading} className="btn-primary whitespace-nowrap">Kirim</button>
        </div>
      </form>
    </main>
  );
}
