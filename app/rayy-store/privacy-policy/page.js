import InfoPage, { InfoSection } from "@/components/rayy-store/InfoPage";

export default function RayyPrivacyPage() {
  return (
    <InfoPage icon="🛡️" title="Kebijakan Privasi" subtitle="Terakhir diperbarui: 1 Juni 2026">
      <InfoSection heading="1. Informasi yang Kami Kumpulkan">
        <p>Kami mengumpulkan informasi berikut saat Anda menggunakan layanan Rayy Store:</p>
        <ul className="list-disc list-inside space-y-1">
          <li><span className="text-white">Data Pribadi:</span> Nama, nomor WhatsApp, alamat email.</li>
          <li><span className="text-white">Data Transaksi:</span> Riwayat pembelian, voucher yang digunakan.</li>
          <li><span className="text-white">Data Teknis:</span> Alamat IP, jenis browser, perangkat yang digunakan.</li>
        </ul>
      </InfoSection>

      <InfoSection heading="2. Penggunaan Informasi">
        <p>Informasi yang kami kumpulkan digunakan untuk:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Memproses pesanan dan pembayaran Anda.</li>
          <li>Mengirim notifikasi terkait pesanan.</li>
          <li>Meningkatkan layanan dan pengalaman berbelanja.</li>
          <li>Menghubungi Anda jika diperlukan.</li>
        </ul>
      </InfoSection>

      <InfoSection heading="3. Perlindungan Data">
        <p>
          Kami menggunakan teknologi enkripsi dan sistem keamanan untuk melindungi data Anda. Data
          disimpan di database dengan akses terbatas, hanya untuk kebutuhan operasional toko.
        </p>
      </InfoSection>

      <InfoSection heading="4. Pembagian Data">
        <p>Kami tidak menjual atau membagikan data pribadi Anda kepada pihak ketiga, kecuali:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Untuk memproses pembayaran melalui payment gateway (RikyShop).</li>
          <li>Jika diwajibkan oleh hukum.</li>
        </ul>
      </InfoSection>

      <InfoSection heading="5. Hak Anda">
        <p>
          Anda berhak untuk mengakses, memperbaiki, atau menghapus data pribadi Anda. Silakan
          hubungi kami melalui kontak yang tersedia.
        </p>
      </InfoSection>

      <InfoSection heading="6. Kontak">
        <p>Jika Anda memiliki pertanyaan tentang kebijakan privasi ini, silakan hubungi:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Email: rayystore@myruko.web.id</li>
          <li>WhatsApp: +62 857-9454-5996</li>
          <li>Telegram: @DeltaxReal</li>
        </ul>
      </InfoSection>
    </InfoPage>
  );
}
