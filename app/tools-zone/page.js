import Link from "next/link";

const SECTIONS = [
  {
    href: "/tools-zone/tools",
    title: "Canvas Tools",
    desc: "Sertifikat, chart crypto, filter foto, dan generator teks/gambar lainnya.",
    tag: "9 tools"
  },
  {
    href: "/tools-zone/game",
    title: "Tebak-Tebakan",
    desc: "Kuis asah otak, tebak gambar, tebak lagu, sampai family 100 — lengkap leaderboard.",
    tag: "13 game"
  },
  {
    href: "/tools-zone/chat",
    title: "Chat AI",
    desc: "Ngobrol bebas dengan pilihan model AI.",
    tag: "Chat"
  },
  {
    href: "/tools-zone/musik",
    title: "Musik & Video",
    desc: "Cari judul lagu/video, pilih kualitas (bitrate/resolusi), lalu putar atau unduh.",
    tag: "Baru"
  }
];

export const metadata = {
  title: "Tools Zone Rayy"
};

const LOGO_URL =
  "https://raw.githubusercontent.com/ZrooPro/SaveDat2/main/uploads/20260721_052745_975_ag5sddnb.jpg";

export default function ToolsZonePage() {
  return (
    <main className="min-h-screen px-6 py-10 mx-auto max-w-3xl">
      <div className="mb-10">
        <img
          src={LOGO_URL}
          alt="Logo"
          className="w-10 h-10 rounded-md object-cover mb-3 border border-line"
        />
        <p className="mono text-sm text-accent2 mb-2">/tools-zone</p>
        <h1 className="display text-3xl font-bold text-white">Tools Zone Rayy</h1>
        <p className="text-muted mt-2">Kumpulan tools & game buat having fun.</p>
      </div>

      <div className="grid gap-4">
        {SECTIONS.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="card p-5 flex items-center justify-between hover:border-accent transition-colors hover-lift"
          >
            <div>
              <h2 className="display text-lg font-semibold text-white">{s.title}</h2>
              <p className="text-muted text-sm mt-1">{s.desc}</p>
            </div>
            <span className="mono text-xs text-muted border border-line rounded-sm px-2 py-1 whitespace-nowrap">
              {s.tag}
            </span>
          </Link>
        ))}
      </div>
    </main>
  );
}
