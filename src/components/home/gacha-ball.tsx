/**
 * Bola gacha yang berayun pelan.
 *
 * Digambar dengan SVG, bukan foto stok. Foto restoran generik dari bank gambar
 * akan terasa seperti janji yang tidak ditepati begitu orang menggulir ke
 * katalog aslinya — dan foto stok justru salah satu penanda paling kuat bahwa
 * sebuah halaman dirakit asal-asalan.
 *
 * Animasinya CSS murni, bukan Framer Motion: elemen ini muncul di layar
 * pertama, dan menunggu mesin animasi diunduh dulu untuk menggerakkannya
 * berarti membayar dua kali di jaringan yang justru paling lambat.
 *
 * Menghormati `prefers-reduced-motion` — lihat globals.css.
 */
export function GachaBall({ className = "" }: { className?: string }) {
  return (
    <div className={`gacha-float ${className}`} aria-hidden="true">
      <svg viewBox="0 0 200 200" className="h-full w-full">
        <defs>
          <linearGradient id="ball-top" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fb7185" />
            <stop offset="100%" stopColor="#e11d48" />
          </linearGradient>
          <linearGradient id="ball-bottom" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#e2e8f0" />
          </linearGradient>
        </defs>

        {/* Bayangan di lantai, ikut mengempis saat bolanya naik. */}
        <ellipse
          className="gacha-shadow"
          cx="100"
          cy="182"
          rx="46"
          ry="9"
          fill="#0f172a"
          opacity="0.12"
        />

        <circle cx="100" cy="100" r="72" fill="url(#ball-bottom)" />
        <path d="M28 100a72 72 0 0 1 144 0z" fill="url(#ball-top)" />
        <rect x="28" y="94" width="144" height="12" rx="6" fill="#9f1239" />
        <circle cx="100" cy="100" r="20" fill="#fff1f2" stroke="#9f1239" strokeWidth="7" />

        {/* Kilau, supaya bolanya terbaca sebagai benda dan bukan lingkaran. */}
        <ellipse cx="72" cy="62" rx="17" ry="11" fill="#ffffff" opacity="0.45" transform="rotate(-28 72 62)" />
      </svg>
    </div>
  );
}
