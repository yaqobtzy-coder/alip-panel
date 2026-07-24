"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const CANVAS_TOOLS = {
  basket: { name: "Sertifikat Basket", method: "GET", params: [{ name: "text", label: "Nama Peserta" }] },
  cbadminton: { name: "Sertifikat Badminton", method: "GET", params: [{ name: "text", label: "Nama Penerima" }] },
  crypto: { name: "Crypto Chart Generator", method: "GET", params: [{ name: "symbol", label: "Symbol (BTCUSDT, ETHUSDT, dll)" }] },
  circle: { name: "Circle Foto", method: "POST", fileField: "image", params: [] },
  gura: { name: "Gura Filter", method: "POST", fileField: "image", params: [] },
  cyberspider: { name: "Cyber Spider", method: "POST", fileField: "image", params: [{ name: "text", label: "Teks" }] },
  fakeml: { name: "Fake Mobile Legend", method: "POST", fileField: "avatar", params: [{ name: "nickname", label: "Nickname" }] },
  fakeffduo: {
    name: "Fake FF Duo",
    method: "GET",
    params: [
      { name: "name1", label: "Nama Player 1" },
      { name: "name2", label: "Nama Player 2" },
      { name: "bg", label: "Background (1-11)", type: "number" }
    ]
  },
  lobyff: {
    name: "Lobby FF",
    method: "GET",
    params: [
      { name: "nickname", label: "Nickname" },
      { name: "versi", label: "Versi (1-11)", type: "number" }
    ]
  },
  iqc: { name: "IQC Generator", method: "GET", params: [{ name: "teks", label: "Teks" }] },
  iqcv2: { name: "IQC V2 Generator", method: "GET", params: [{ name: "text", label: "Teks" }] }
};

export default function ToolsPage() {
  const [active, setActive] = useState(null);
  const [values, setValues] = useState({});
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resultUrl, setResultUrl] = useState("");
  const [nameOverrides, setNameOverrides] = useState({});

  useEffect(() => {
    fetch("/api/site-config")
      .then((r) => r.json())
      .then((d) => setNameOverrides(d.toolNameOverrides || {}))
      .catch(() => {});
  }, []);

  function displayName(key) {
    return nameOverrides[key] || CANVAS_TOOLS[key].name;
  }

  function selectTool(key) {
    setActive(key);
    setValues({});
    setFile(null);
    setError("");
    setResultUrl("");
  }

  async function runTool(e) {
    e.preventDefault();
    setError("");
    setResultUrl("");
    setLoading(true);
    const tool = CANVAS_TOOLS[active];

    try {
      let response;
      if (tool.method === "GET") {
        const qs = new URLSearchParams({ tool: active, ...values });
        response = await fetch(`/api/tools-zone/proxy?${qs.toString()}`);
      } else {
        const fd = new FormData();
        Object.entries(values).forEach(([k, v]) => fd.append(k, v));
        if (file) fd.append(tool.fileField, file);
        response = await fetch(`/api/tools-zone/proxy?tool=${active}`, { method: "POST", body: fd });
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("image/")) {
        const blob = await response.blob();
        setResultUrl(URL.createObjectURL(blob));
      } else {
        const data = await response.json();
        if (!data.status) throw new Error(data.message || "Gagal memproses.");
        setResultUrl(data.raw || data.url || JSON.stringify(data));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const tool = active ? CANVAS_TOOLS[active] : null;

  return (
    <main className="min-h-screen px-6 py-14 mx-auto max-w-3xl">
      <Link href="/tools-zone" className="mono text-sm text-accent2">← Tools Zone</Link>
      <h1 className="display text-3xl font-bold text-white mt-3 mb-8">Canvas Tools</h1>

      {!active && (
        <div className="grid gap-3 sm:grid-cols-2">
          {Object.entries(CANVAS_TOOLS).map(([key, t]) => (
            <button key={key} onClick={() => selectTool(key)} className="card p-4 text-left hover:border-accent transition-colors hover-lift">
              <p className="text-white font-medium">{displayName(key)}</p>
            </button>
          ))}
        </div>
      )}

      {active && (
        <div className="card p-5 hover-lift">
          <div className="flex items-center justify-between mb-4">
            <h2 className="display text-lg text-white">{displayName(active)}</h2>
            <button onClick={() => selectTool(null)} className="mono text-xs text-muted">ganti tool</button>
          </div>

          <form onSubmit={runTool} className="space-y-3">
            {tool.params.map((p) => (
              <div key={p.name}>
                <label className="text-sm text-muted block mb-1">{p.label}</label>
                <input
                  className="field"
                  type={p.type || "text"}
                  required
                  value={values[p.name] || ""}
                  onChange={(e) => setValues((v) => ({ ...v, [p.name]: e.target.value }))}
                />
              </div>
            ))}

            {tool.fileField && (
              <div>
                <label className="text-sm text-muted block mb-1">Upload foto</label>
                <input
                  className="field"
                  type="file"
                  accept="image/*"
                  required
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                />
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? "Memproses..." : "Generate"}
            </button>
          </form>

          {error && <p className="text-danger text-sm mt-4">{error}</p>}

          {resultUrl && (
            resultUrl.startsWith("blob:") ? (
              <img src={resultUrl} alt="Hasil" className="mt-5 rounded-md border border-line w-full" />
            ) : (
              <pre className="mono text-xs text-muted mt-5 whitespace-pre-wrap break-words">{resultUrl}</pre>
            )
          )}
        </div>
      )}
    </main>
  );
}
