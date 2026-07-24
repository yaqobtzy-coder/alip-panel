"use client";
import { useState } from "react";
import InfoPage from "@/components/rayy-store/InfoPage";

const FAQS = [
  {
    q: "Bagaimana cara membeli produk di Rayy Store?",
    a: "1. Login ke akun Anda (isi nama dan nomor WA di halaman Profil).\n2. Pilih produk yang ingin dibeli.\n3. Klik \"Sewa Sekarang\" atau \"Beli Sekarang\".\n4. Isi data yang diperlukan (untuk produk Script, isi nomor WA bot Anda).\n5. Lanjutkan ke pembayaran dan scan QRIS.\n6. Tunggu konfirmasi pembayaran otomatis."
  },
  {
    q: "Metode pembayaran apa saja yang tersedia?",
    a: "Kami menyediakan pembayaran melalui QRIS via RikyShop, otomatis terkonfirmasi tanpa perlu upload bukti transfer manual."
  },
  {
    q: "Bagaimana cara menggunakan kode voucher?",
    a: "1. Salin kode voucher dari halaman Voucher Center.\n2. Buka halaman pembelian produk.\n3. Masukkan kode voucher di kolom yang tersedia.\n4. Klik \"Pakai Voucher\" untuk melihat potongan harga.\n5. Voucher hanya berlaku untuk produk yang mendukung voucher."
  },
  {
    q: "Berapa lama proses setelah pembayaran?",
    a: "Untuk sewa bot: 5-15 menit setelah pembayaran terkonfirmasi.\nUntuk script: nomor bot langsung ditambahkan ke database begitu pembayaran sukses.\nUntuk panel hosting: 1-5 menit setelah pembayaran berhasil."
  },
  {
    q: "Bagaimana cara memperpanjang sewa bot?",
    a: "Buka halaman \"Histori Belanja\" atau \"Sewa Aktif\", lalu klik tombol \"Perpanjang\" pada pesanan yang ingin diperpanjang. Isi data dan lanjutkan ke pembayaran."
  },
  {
    q: "Apa yang harus dilakukan jika bot tidak aktif?",
    a: "Hubungi Customer Service melalui halaman CS Chat atau langsung via WhatsApp/Telegram. Sertakan Order ID Anda untuk proses lebih cepat."
  },
  {
    q: "Apakah ada garansi untuk script?",
    a: "Ya, script dilengkapi garansi sesuai deskripsi produk. Jika ada bug atau error dari sisi kami, akan kami perbaiki. Garansi tidak berlaku jika script sudah dimodifikasi sendiri."
  },
  {
    q: "Bagaimana cara melihat data panel hosting?",
    a: "Buka menu di halaman utama, lalu klik \"Data Panel Saya\". Semua panel yang sudah Anda beli akan muncul beserta detail loginnya."
  }
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-line rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 bg-panel2 px-4 py-3 text-left"
      >
        <span className="text-white text-sm font-medium">❓ {q}</span>
        <span className={`text-muted text-xs transition-transform ${open ? "rotate-180" : ""}`}>▾</span>
      </button>
      {open && (
        <div className="px-4 py-3 text-sm text-muted whitespace-pre-line leading-relaxed">{a}</div>
      )}
    </div>
  );
}

export default function RayyFaqPage() {
  return (
    <InfoPage icon="❓" title="Frequently Asked Questions">
      <div className="space-y-2.5">
        {FAQS.map((f) => (
          <FaqItem key={f.q} {...f} />
        ))}
      </div>
    </InfoPage>
  );
}
