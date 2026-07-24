"use client";
import { useEffect, useState } from "react";

// Animasi teks nama store: ketikan muncul dari kiri->kanan, jeda, lalu
// "mundur"/terhapus dari kanan->kiri, lalu hilang sesaat, lalu berulang.
export default function TypewriterLoop({ text, className = "" }) {
  const [display, setDisplay] = useState("");
  const [phase, setPhase] = useState("typing"); // typing | pause | deleting | blank

  useEffect(() => {
    let timer;
    if (phase === "typing") {
      if (display.length < text.length) {
        timer = setTimeout(() => setDisplay(text.slice(0, display.length + 1)), 110);
      } else {
        timer = setTimeout(() => setPhase("pause"), 1200);
      }
    } else if (phase === "pause") {
      timer = setTimeout(() => setPhase("deleting"), 300);
    } else if (phase === "deleting") {
      if (display.length > 0) {
        timer = setTimeout(() => setDisplay(display.slice(0, -1)), 60);
      } else {
        timer = setTimeout(() => setPhase("blank"), 400);
      }
    } else if (phase === "blank") {
      timer = setTimeout(() => setPhase("typing"), 500);
    }
    return () => clearTimeout(timer);
  }, [display, phase, text]);

  return (
    <span className={className}>
      {display}
      <span className="inline-block w-[2px] h-[1em] bg-accent align-middle ml-1 animate-pulse" />
    </span>
  );
}
