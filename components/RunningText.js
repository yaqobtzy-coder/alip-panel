"use client";

export default function RunningText({ text }) {
  if (!text) return null;
  return (
    <div className="overflow-hidden whitespace-nowrap border border-accent2/30 bg-accent2/10 rounded-sm py-2 mb-4">
      <div className="inline-block running-text-track mono text-xs text-accent2">
        {text}&nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp;{text}&nbsp;&nbsp;&nbsp;&nbsp;•&nbsp;&nbsp;&nbsp;&nbsp;
      </div>
      <style jsx>{`
        .running-text-track {
          padding-left: 100%;
          animation: running-text-scroll 18s linear infinite;
        }
        @keyframes running-text-scroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
