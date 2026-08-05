"use client";

import { useState } from "react";

/**
 * Membagikan hasil gacha ke grup WA/Line.
 *
 * Mahasiswa memutuskan makan beramai-ramai di grup chat, jadi hasil gacha itu
 * konten yang sudah setengah jadi. Ini jalur distribusi termurah yang ada —
 * dan tidak butuh apa pun selain tombol.
 *
 * Tautannya menunjuk halaman hasil, yang punya Open Graph image sendiri, jadi
 * yang muncul di grup adalah kartu bergambar, bukan URL telanjang.
 */
export function ShareResultButton({
  restaurantId,
  name,
  distanceMeters,
  priceTier,
}: {
  restaurantId: string;
  name: string;
  distanceMeters: number;
  priceTier: number;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/hasil/${restaurantId}`;
    const distance =
      distanceMeters >= 1000
        ? `${(distanceMeters / 1000).toFixed(1)} km`
        : `${Math.round(distanceMeters)} m`;

    const text =
      `🎲 Gacha Makan hari ini: ${name} · ${distance} · ` +
      `Rp${priceTier.toLocaleString("id-ID")}\ncoba punyamu →`;

    // Web Share API membuka lembar bagikan bawaan HP, yang sudah berisi WA dan
    // Line. Di desktop biasanya tidak ada, jadi jatuh ke salin tautan.
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title: "Gacha Makan", text, url });
        return;
      } catch {
        // Termasuk saat pengguna menutup lembar bagikan. Bukan kegagalan —
        // lanjut ke salin tautan supaya tetap ada jalan.
      }
    }

    try {
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard bisa ditolak tanpa interaksi yang dianggap sah oleh browser.
      window.prompt("Salin tautannya:", url);
    }
  };

  return (
    <button
      type="button"
      onClick={handleShare}
      className="w-full rounded-xl border border-slate-200 bg-white py-3 text-sm font-semibold text-slate-600 transition-all hover:bg-slate-50 active:scale-[0.98]"
    >
      {copied ? "✅ Tautan tersalin" : "📤 Bagikan ke grup"}
    </button>
  );
}
