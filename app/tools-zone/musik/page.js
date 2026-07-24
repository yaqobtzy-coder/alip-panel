import Link from "next/link";
import MusikVideoPlayer from "@/components/MusikVideoPlayer";

export const metadata = { title: "Musik & Video" };

export default function MusikVideoPage() {
  return (
    <main className="min-h-screen px-4 py-6 md:px-8 md:py-8 max-w-2xl mx-auto">
      <Link href="/tools-zone" className="text-sm text-accent2">&larr; Tools Zone</Link>
      <h1 className="display text-2xl font-bold text-white mt-3 mb-1">Musik &amp; Video</h1>
      <p className="text-muted text-sm mb-6">Cari judul lagu atau video, lalu putar/unduh langsung.</p>
      <MusikVideoPlayer />
    </main>
  );
}
