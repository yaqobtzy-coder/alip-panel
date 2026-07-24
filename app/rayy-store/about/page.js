import InfoPage, { InfoSection } from "@/components/rayy-store/InfoPage";

export default function RayyAboutPage() {
  return (
    <InfoPage icon="🏬" title="Tentang Rayy Store" subtitle="Premium Digital Store Since 2024">
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-panel2 rounded-lg py-3">
          <p className="text-xl font-bold text-accent2">500+</p>
          <p className="text-[11px] text-muted">Produk Terjual</p>
        </div>
        <div className="bg-panel2 rounded-lg py-3">
          <p className="text-xl font-bold text-accent2">100+</p>
          <p className="text-[11px] text-muted">Customer Puas</p>
        </div>
        <div className="bg-panel2 rounded-lg py-3">
          <p className="text-xl font-bold text-accent2">24/7</p>
          <p className="text-[11px] text-muted">Support</p>
        </div>
      </div>

      <InfoSection heading="📖 Sejarah Singkat">
        <p>
          Rayy Store didirikan pada tahun 2024 sebagai toko digital yang menyediakan berbagai
          produk digital berkualitas seperti sewa bot WhatsApp, script bot, dan panel hosting
          Pterodactyl.
        </p>
      </InfoSection>

      <InfoSection heading="🎯 Visi & Misi">
        <p><span className="text-white font-medium">Visi:</span> Menjadi toko digital terpercaya dengan pelayanan terbaik di Indonesia.</p>
        <p>
          <span className="text-white font-medium">Misi:</span> Menyediakan produk digital berkualitas
          dengan harga terjangkau, serta memberikan pelayanan customer service yang responsif 24/7.
        </p>
      </InfoSection>

      <InfoSection heading="✅ Mengapa Memilih Rayy Store?">
        <ul className="list-disc list-inside space-y-1">
          <li>Proses cepat dan otomatis</li>
          <li>Customer service 24/7 via Live Chat &amp; CS Chat</li>
          <li>Garansi produk sesuai deskripsi</li>
          <li>Pembayaran mudah via QRIS (RikyShop)</li>
          <li>Sistem voucher diskon</li>
          <li>Histori transaksi lengkap</li>
        </ul>
      </InfoSection>

      <InfoSection heading="🤝 Tim Kami">
        <p>
          Rayy Store dikelola oleh tim profesional yang berpengalaman di bidang digital dan bot
          WhatsApp. Kami berkomitmen memberikan yang terbaik untuk setiap pelanggan.
        </p>
      </InfoSection>
    </InfoPage>
  );
}
