"use client";
import { useMusicPlayer } from "@/components/MusicPlayerContext";

function formatDuration(sec) {
  if (!sec && sec !== 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = String(Math.floor(sec % 60)).padStart(2, "0");
  return `${m}:${s}`;
}

// Fixed mini player that floats above every page once a track is
// loaded, so audio keeps playing (and stays controllable) no matter
// which dashboard/menu the user navigates to.
export default function NowPlayingBar() {
  const { track, isPlaying, currentTime, duration, toggle, seekTo, close } = useMusicPlayer();
  if (!track) return null;

  const progressPct = duration ? Math.min((currentTime / duration) * 100, 100) : 0;

  return (
    <div className="now-playing-bar">
      <div
        className="now-playing-progress"
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          seekTo((e.clientX - rect.left) / rect.width);
        }}
      >
        <div className="now-playing-progress-fill" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="now-playing-row">
        {track.thumbnail ? (
          <img src={track.thumbnail} alt={track.title} className="now-playing-thumb" />
        ) : (
          <div className="now-playing-thumb now-playing-thumb-fallback">🎵</div>
        )}

        <div className="min-w-0 flex-1">
          <p className="text-white text-xs font-semibold truncate">{track.title}</p>
          <p className="text-[11px] text-muted truncate">
            {track.channel} · {formatDuration(currentTime)} / {formatDuration(duration)}
          </p>
        </div>

        <button type="button" onClick={toggle} className="now-playing-play">
          {isPlaying ? "⏸" : "▶"}
        </button>
        <button type="button" onClick={close} className="now-playing-close" title="Tutup">
          ✕
        </button>
      </div>
    </div>
  );
}
