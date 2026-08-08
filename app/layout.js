import "./globals.css";
import AppChrome from "@/components/AppChrome";
import AnimatedBlobs from "@/components/AnimatedBlobs";
import ScrollRevealInit from "@/components/ScrollRevealInit";
import { MusicPlayerProvider } from "@/components/MusicPlayerContext";
import NowPlayingBar from "@/components/NowPlayingBar";
import PushBroadcastSetup from "@/components/PushBroadcastSetup";
import ButtonMicroInit from "@/components/ButtonMicroInit";
import { getSiteConfig } from "@/lib/siteConfig";
import { SITE_URL } from "@/lib/siteUrl";

const SITE_TITLE = "Database Rayy";
const SITE_DESC = "Panel database manajemen akses & nomor. Khusus database — tidak termasuk Rayy Store atau Tools Zone.";
// Banner landscape (WA/Telegram preview butuh ~1200x630). Logo kotak
// sering keliatan jelek / gak kebaca di preview chat.
const OG_BANNER =
  "https://raw.githubusercontent.com/ZrooPro/SaveDat2/main/uploads/20260723_085528_141_ovm7tld2.jpg";
const FALLBACK_IMAGE =
  "https://raw.githubusercontent.com/ZrooPro/SaveDat2/main/uploads/20260721_052745_975_ag5sddnb.jpg";

export async function generateMetadata() {
  const cfg = await getSiteConfig().catch(() => null);
  // Prioritas: ogBannerUrl (opsional di siteConfig) → banner default → logo
  const image = cfg?.ogBannerUrl || OG_BANNER || cfg?.logoUrl || FALLBACK_IMAGE;

  return {
    metadataBase: new URL(SITE_URL),
    title: SITE_TITLE,
    description: SITE_DESC,
    openGraph: {
      title: SITE_TITLE,
      description: SITE_DESC,
      url: SITE_URL,
      siteName: SITE_TITLE,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: SITE_TITLE
        }
      ],
      locale: "id_ID",
      type: "website"
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_TITLE,
      description: SITE_DESC,
      images: [image]
    }
  };
}

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css"
          integrity="sha512-DTOQO9RWCH3ppGqcWaEA1BIZOC6xxalwEsw9c2QQeAIftl+Vegovlnee1c9QX4TctnWMn13TZye+giMm8e2LwA=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
      </head>
      <body>
        <AnimatedBlobs />
        <ScrollRevealInit />
        <MusicPlayerProvider>
          <AppChrome>{children}</AppChrome>
          <NowPlayingBar />
        </MusicPlayerProvider>
        <PushBroadcastSetup />
        <ButtonMicroInit />
      </body>
    </html>
  );
}
