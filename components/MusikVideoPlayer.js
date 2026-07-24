"use client";
import { useEffect, useRef, useState } from "react";
import { useMusicPlayer } from "@/components/MusicPlayerContext";

const AUDIO_BITRATES = ["64k", "128k", "192k", "256k", "320k"];
const VIDEO_RESOLUTIONS = ["360", "480", "720", "1080"];

function formatDuration(sec) {
  if (!sec && sec !== 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = String(Math.floor(sec % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

function streamUrl(downloadUrl) {
  return `/api/tools-zone/musik/stream?url=${encodeURIComponent(downloadUrl)}`;
}

// Komponen search+play lagu/video Blckrose. Dipakai langsung tertanam di
// dashboard (semua role) DAN di /tools-zone/musik — satu sumber kebenaran.
// Audio diputar lewat MusicPlayerContext (satu <audio> global di root
// layout) supaya lagu terus jalan biarpun pindah halaman. Video tetap
// diputar lokal karena elemen videonya sendiri yang perlu terlihat.
export default function MusikVideoPlayer() {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("audio");
  const [bitrate, setBitrate] = useState("320k");
  const [resolution, setResolution] = useState("360");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const videoRef = useRef(null);

  const player = useMusicPlayer();
  const isCurrentTrack = type === "audio" && player.track && result && player.track.downloadUrl === result.download_url;

  useEffect(() => {
    if (result && type === "video" && videoRef.current) {
      videoRef.current.play().catch(() => {});
    }
  }, [result, type]);

  const runSearch = async (nextType, quality) => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ q: query.trim(), type: nextType });
      if (nextType === "audio") params.append("bitrate", quality);
      else params.append("resolution", quality);

      const res = await fetch(`/api/tools-zone/musik?${params.toString()}`);
      const data = await res.json();
      if (!res.ok || !data.status) throw new Error(data.message || "Tidak ditemukan.");
      setResult(data.result);
      setType(nextType);
      if (nextType === "audio") {
        setBitrate(quality);
        player.play({
          title: data.result.title,
          channel: data.result.channel,
          thumbnail: data.result.thumbnail,
          downloadUrl: data.result.download_url
        });
      } else {
        setResolution(quality);
      }
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const submit = (e) => {
    e.preventDefault();
    runSearch(type, type === "audio" ? bitrate : resolution);
  };

  const progressPct = isCurrentTrack && player.duration
    ? Math.min((player.currentTime / player.duration) * 100, 100)
    : 0;

  return (
    <section className="card p-4 space-y-4 hover-lift overflow-hidden">
      <h2 className="display font-semibold text-white flex items-center gap-2">
        <span className="text-lg">🎵</span> Musik &amp; Video
      </h2>

      {/* ---- Now playing card (audio) ---- */}
      {result && type === "audio" && (
        <div className="mvp-nowplaying">
          <div className="mvp-cover-wrap">
            {result.thumbnail ? (
              <img src={result.thumbnail} alt={result.title} className="mvp-cover" />
            ) : (
              <div className="mvp-cover mvp-cover-fallback">🎵</div>
            )}
          </div>

          <div className="min-w-0 mt-3">
            <p className="text-white font-semibold text-sm line-clamp-2">{result.title}</p>
            <p className="text-xs text-muted mt-0.5 truncate">{result.channel}</p>
          </div>

          <div className="mvp-progress-row">
            <span className="mono text-[10px] text-muted w-9 text-right">
              {formatDuration(isCurrentTrack ? player.currentTime : 0)}
            </span>
            <div
              className="mvp-progress-track"
              onClick={(e) => {
                if (!isCurrentTrack) return;
                const rect = e.currentTarget.getBoundingClientRect();
                player.seekTo((e.clientX - rect.left) / rect.width);
              }}
            >
              <div className="mvp-progress-fill" style={{ width: `${progressPct}%` }} />
              <div className="mvp-progress-thumb" style={{ left: `${progressPct}%` }} />
            </div>
            <span className="mono text-[10px] text-muted w-9">
              {formatDuration(isCurrentTrack ? player.duration : 0)}
            </span>
          </div>

          <div className="mvp-controls">
            <button type="button" onClick={() => player.seekBy(-10)} className="mvp-ctrl-btn" title="Mundur 10 detik">
              ⏮
            </button>
            <button type="button" onClick={player.toggle} className="mvp-play-btn">
              {isCurrentTrack && player.isPlaying ? "⏸" : "▶"}
            </button>
            <button type="button" onClick={() => player.seekBy(10)} className="mvp-ctrl-btn" title="Maju 10 detik">
              ⏭
            </button>
          </div>

          <p className="text-[11px] text-muted mt-2">
            🎧 Lagu ini tetap jalan walau kamu pindah halaman — lihat bar mini di bawah layar.
          </p>
        </div>
      )}

      {/* ---- Now playing card (video) ---- */}
      {result && type === "video" && (
        <div className="space-y-2">
          <div className="flex gap-3">
            {result.thumbnail && (
              <img src={result.thumbnail} alt={result.title} className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0" />
            )}
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm line-clamp-2">{result.title}</p>
              <p className="text-xs text-muted mt-0.5 truncate">{result.channel}</p>
            </div>
          </div>
          <video
            key={result.download_url}
            ref={videoRef}
            controls
            poster={result.thumbnail}
            className="w-full rounded-lg border border-white/10 bg-black"
            src={streamUrl(result.download_url)}
          />
        </div>
      )}

      {/* ---- Search form ---- */}
      <form onSubmit={submit} className="space-y-3">
        <div className="mvp-search-row">
          <input
            className="field flex-1"
            placeholder="Cari judul lagu / video, mis. Garam Madu"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            required
          />
          <button type="submit" disabled={loading} className="mvp-search-btn" title="Cari">
            {loading ? "…" : "🔍"}
          </button>
        </div>

        <div className="mvp-segmented">
          <button
            type="button"
            onClick={() => setType("audio")}
            className={`mvp-segment ${type === "audio" ? "mvp-segment-active" : ""}`}
          >
            🎵 Audio
          </button>
          <button
            type="button"
            onClick={() => setType("video")}
            className={`mvp-segment ${type === "video" ? "mvp-segment-active" : ""}`}
          >
            🎬 Video
          </button>
        </div>

        {type === "audio" ? (
          <div>
            <label className="text-xs text-muted mb-1 block">Bitrate</label>
            <div className="flex gap-2 flex-wrap">
              {AUDIO_BITRATES.map((b) => (
                <button
                  type="button"
                  key={b}
                  onClick={() => setBitrate(b)}
                  className={`mvp-chip ${bitrate === b ? "mvp-chip-active" : ""}`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <label className="text-xs text-muted mb-1 block">Resolusi</label>
            <div className="flex gap-2 flex-wrap">
              {VIDEO_RESOLUTIONS.map((r) => (
                <button
                  type="button"
                  key={r}
                  onClick={() => setResolution(r)}
                  className={`mvp-chip ${resolution === r ? "mvp-chip-active" : ""}`}
                >
                  {r}p
                </button>
              ))}
            </div>
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
          {loading ? "Mencari..." : "Cari & Putar"}
        </button>
      </form>

      {error && <p className="text-sm text-danger">{error}</p>}

      {result && (
        <div className="flex gap-2 flex-wrap border-t border-line pt-3">
          {(type === "audio" ? AUDIO_BITRATES : VIDEO_RESOLUTIONS).map((v) => (
            <button
              key={v}
              onClick={() => runSearch(type, v)}
              disabled={loading}
              className={`mvp-chip ${(type === "audio" ? bitrate : resolution) === v ? "mvp-chip-active" : ""}`}
            >
              {type === "audio" ? v : `${v}p`}
            </button>
          ))}
          <a
            href={streamUrl(result.download_url)}
            download
            className="btn-primary text-center ml-auto px-4 py-1.5 text-sm inline-block"
          >
            ⬇ Unduh {type === "audio" ? "MP3" : "MP4"}
          </a>
        </div>
      )}
    </section>
  );
}
