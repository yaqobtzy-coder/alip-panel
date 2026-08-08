// Cap "LUNAS" ala struk/faktur toko fisik — dipakai gantiin ikon centang
// hijau generik di setiap momen "sudah lunas" (popup pembayaran, halaman
// struk, dll). Lihat .stamp-lunas di globals.css.
export default function LunasStamp({ className = "", size = "md" }) {
  const sizeClass = size === "lg" ? "text-2xl px-6 py-2.5" : size === "sm" ? "text-xs px-3 py-1.5" : "text-base px-4 py-2";
  return (
    <span className={`stamp-lunas ${sizeClass} ${className}`} role="img" aria-label="Lunas">
      Lunas
    </span>
  );
}
