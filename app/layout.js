import "./globals.css";
import AppChrome from "@/components/AppChrome";
import AnimatedBlobs from "@/components/AnimatedBlobs";
import ScrollRevealInit from "@/components/ScrollRevealInit";
import { MusicPlayerProvider } from "@/components/MusicPlayerContext";
import NowPlayingBar from "@/components/NowPlayingBar";

export const metadata = {
  title: "Database Rayy X Alip ai",
  description: "Panel manajemen akses & nomor — Database Rayy X Alip ai"
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <AnimatedBlobs />
        <ScrollRevealInit />
        <MusicPlayerProvider>
          <AppChrome>{children}</AppChrome>
          <NowPlayingBar />
        </MusicPlayerProvider>
      </body>
    </html>
  );
}
