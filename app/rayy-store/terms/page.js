import InfoPage, { InfoSection } from "@/components/rayy-store/InfoPage";

export default function RayyTermsPage() {
  return (
    <InfoPage icon="📜" title="Syarat & Ketentuan" subtitle="Terakhir diperbarui: 1 Juni 2026">
      <div className="border border-yellow-500/30 bg-yellow-500/10 rounded-md p-3 text-xs text-yellow-200">
        ℹ️ Dengan menggunakan Rayy Store, Anda menyetujui syarat dan ketentuan berikut.
      </div>

      <InfoSection heading="1. Akun Pengguna">
        <p>
          Anda wajib mengisi nama lengkap dan nomor WhatsApp yang valid untuk menggunakan layanan
          kami. Informasi yang diberikan harus akurat dan dapat dipertanggungjawabkan.
        </p>
      </InfoSection>

      <InfoSection heading="2. Pembelian dan Pembayaran">
        <ul className="list-disc list-inside space-y-1">
          <li>Semua harga produk sudah termasuk pajak.</li>
          <li>Pembayaran dilakukan melalui QRIS (RikyShop).</li>
          <li>Pesanan diproses otomatis begitu pembayaran terkonfirmasi.</li>
          <li>Voucher diskon hanya dapat digunakan sesuai ketentuan yang berlaku.</li>
        </ul>
      </InfoSection>

      <InfoSection heading="3. Sewa Bot">
        <ul className="list-disc list-inside space-y-1">
          <li>Masa sewa dimulai setelah pesanan disetujui oleh admin.</li>
          <li>Perpanjangan sewa dapat dilakukan sebelum masa aktif berakhir.</li>
          <li>Bot tidak dapat dipindahkan ke grup lain selama masa sewa.</li>
        </ul>
      </InfoSection>

      <InfoSection heading="4. Script Bot">
        <ul className="list-disc list-inside space-y-1">
          <li>Nomor WhatsApp bot yang Anda isi otomatis didaftarkan ke database bot setelah pembayaran sukses.</li>
          <li>Garansi script sesuai dengan deskripsi produk.</li>
          <li>Tidak ada refund setelah script dikirim.</li>
        </ul>
      </InfoSection>

      <InfoSection heading="5. Panel Hosting">
        <ul className="list-disc list-inside space-y-1">
          <li>Panel akan dibuat otomatis setelah pembayaran berhasil.</li>
          <li>Spesifikasi panel sesuai dengan paket yang dipilih.</li>
          <li>Data panel dapat diakses di halaman "Data Panel Saya".</li>
        </ul>
      </InfoSection>

      <InfoSection heading="6. Pembatalan dan Refund">
        <ul className="list-disc list-inside space-y-1">
          <li>Pembatalan hanya dapat dilakukan sebelum pembayaran.</li>
          <li>Refund tidak diberikan untuk produk digital yang sudah dikirim.</li>
          <li>Jika terjadi masalah teknis, silakan hubungi Customer Service.</li>
        </ul>
      </InfoSection>

      <InfoSection heading="7. Perubahan Ketentuan">
        <p>
          Kami berhak mengubah syarat dan ketentuan ini sewaktu-waktu. Perubahan akan diumumkan
          melalui halaman News.
        </p>
      </InfoSection>

      <InfoSection heading="8. Kontak">
        <p>Untuk pertanyaan lebih lanjut, hubungi:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Email: rayystore@myruko.web.id</li>
          <li>WhatsApp: +62 857-9454-5996</li>
        </ul>
      </InfoSection>
    </InfoPage>
  );
}
