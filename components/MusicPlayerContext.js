"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";

const MusicPlayerContext = createContext(null);

function streamUrl(downloadUrl) {
  return `/api/tools-zone/musik/stream?url=${encodeURIComponent(downloadUrl)}`;
}

// Single <audio> element mounted once here in the root layout, so it
// keeps playing across client-side route changes (only the page
// content swaps — this provider never unmounts). MusikVideoPlayer and
// NowPlayingBar both read/control it through useMusicPlayer() instead
// of owning their own <audio> tag.
export function MusicPlayerProvider({ children }) {
  const audioRef = useRef(null);
  const [track, setTrack] = useState(null); // { title, channel, thumbnail, downloadUrl }
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;
    const onTime = () => setCurrentTime(el.currentTime);
    const onMeta = () => setDuration(el.duration || 0);
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnd = () => setIsPlaying(false);
    el.addEventListener("timeupdate", onTime);
    el.addEventListener("loadedmetadata", onMeta);
    el.addEventListener("play", onPlay);
    el.addEventListener("pause", onPause);
    el.addEventListener("ended", onEnd);
    return () => {
      el.removeEventListener("timeupdate", onTime);
      el.removeEventListener("loadedmetadata", onMeta);
      el.removeEventListener("play", onPlay);
      el.removeEventListener("pause", onPause);
      el.removeEventListener("ended", onEnd);
    };
  }, []);

  const play = (nextTrack) => {
    const el = audioRef.current;
    if (!el) return;
    const isSameTrack = track && track.downloadUrl === nextTrack.downloadUrl;
    setTrack(nextTrack);
    if (!isSameTrack) {
      setCurrentTime(0);
      setDuration(0);
    }
    // Give the <audio> tag a tick to pick up the new src before play().
    requestAnimationFrame(() => el.play().catch(() => {}));
  };

  const toggle = () => {
    const el = audioRef.current;
    if (!el || !track) return;
    if (el.paused) el.play().catch(() => {});
    else el.pause();
  };

  const seekBy = (delta) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = Math.min(Math.max(el.currentTime + delta, 0), el.duration || 0);
  };

  const seekTo = (ratio) => {
    const el = audioRef.current;
    if (!el || !el.duration) return;
    el.currentTime = ratio * el.duration;
  };

  const close = () => {
    const el = audioRef.current;
    if (el) {
      el.pause();
      el.removeAttribute("src");
      el.load();
    }
    setTrack(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
  };

  return (
    <MusicPlayerContext.Provider
      value={{ track, isPlaying, currentTime, duration, play, toggle, seekBy, seekTo, close }}
    >
      {children}
      <audio ref={audioRef} src={track ? streamUrl(track.downloadUrl) : undefined} className="hidden" />
    </MusicPlayerContext.Provider>
  );
}

export function useMusicPlayer() {
  const ctx = useContext(MusicPlayerContext);
  if (!ctx) throw new Error("useMusicPlayer must be used inside MusicPlayerProvider");
  return ctx;
}
