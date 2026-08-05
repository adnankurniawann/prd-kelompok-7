"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Panduan penggunaan, di paling atas.
 *
 * Sebelumnya panduan ini ada di dasar kolom kanan — di bawah statistik, feed
 * laporan, dan tiga kartu mode. Orang yang baru pertama membuka aplikasi
 * justru yang paling butuh, dan justru mereka yang tidak akan menggulir
 * sejauh itu.
 *
 * Tapi panduan yang selamanya memenuhi layar juga mengganggu orang yang sudah
 * hafal. Jadi ia bisa ditutup, dan pilihannya diingat.
 */

const STORAGE_KEY = "gacha-makan:panduan-ditutup";

const STEPS = [
  {
    n: 1,
    tone: "rose",
    title: "Tentukan budget & jarak",
    body: "Geser dua slider sesuai isi dompet dan seberapa jauh kamu mau jalan.",
  },
  {
    n: 2,
    tone: "amber",
    title: "Tekan SPIN",
    body: "Dapat satu warung, bukan daftar panjang. Nggak cocok? Spin lagi.",
  },
  {
    n: 3,
    tone: "emerald",
    title: "Kasih tahu hasilnya",
    body: "Jadi ke sana, simpan buat nanti, atau laporkan kalau tempatnya kotor.",
  },
] as const;

const TONE: Record<string, string> = {
  rose: "bg-rose-50 text-rose-600",
  amber: "bg-amber-50 text-amber-600",
  emerald: "bg-emerald-50 text-emerald-600",
};

export function UsageGuide({
  /** Pengguna yang belum pernah spin selalu melihatnya terbuka. */
  forceOpen = false,
}: {
  forceOpen?: boolean;
}) {
  // Dimulai terbuka, lalu ditutup setelah mount kalau memang pernah ditutup.
  // Kebalikannya — dimulai tertutup — membuat panduan berkedip muncul untuk
  // orang yang sudah menutupnya.
  const [open, setOpen] = useState(true);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Harus lewat effect, bukan lazy useState: halaman ini dirender di server,
    // dan membaca localStorage saat render awal membuat HTML hasil hidrasi
    // berbeda dari yang dikirim server.
    /* eslint-disable react-hooks/set-state-in-effect */
    if (forceOpen) {
      setReady(true);
      return;
    }

    try {
      if (window.localStorage.getItem(STORAGE_KEY) === "1") setOpen(false);
    } catch {
      // Storage diblokir; panduannya tetap tampil. Itu kegagalan yang aman.
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [forceOpen]);

  const close = () => {
    setOpen(false);
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // Tidak apa-apa; ia akan muncul lagi lain kali.
    }
  };

  const reopen = () => {
    setOpen(true);
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Sama.
    }
  };

  // Sebelum localStorage terbaca, ruangnya ditahan supaya isi di bawahnya
  // tidak melompat begitu panduannya menutup.
  if (!ready) return <div className="h-[132px]" aria-hidden="true" />;

  if (!open) {
    return (
      <button
        type="button"
        onClick={reopen}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-left transition-colors hover:bg-slate-50"
      >
        <span className="text-sm font-semibold text-slate-600">
          Lihat cara pakai
        </span>
        <span className="text-xs text-slate-400">Buka</span>
      </button>
    );
  }

  return (
    <section
      aria-label="Cara pakai"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold tracking-tight text-slate-900">
            Bingung mau makan apa? Tiga langkah.
          </h2>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
            Nggak perlu daftar. Langsung bisa dipakai.
          </p>
        </div>

        {!forceOpen && (
          <button
            type="button"
            onClick={close}
            className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
          >
            Tutup
          </button>
        )}
      </div>

      <ol className="mt-4 grid gap-3 sm:grid-cols-3">
        {STEPS.map((step) => (
          <li
            key={step.n}
            className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5"
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${TONE[step.tone]}`}
            >
              {step.n}
            </span>
            <p className="mt-2.5 text-sm font-semibold text-slate-800">
              {step.title}
            </p>
            <p className="mt-1 text-xs leading-relaxed text-slate-500">
              {step.body}
            </p>
          </li>
        ))}
      </ol>

      <Link
        href="/spin"
        className="mt-4 block w-full rounded-xl bg-rose-500 px-5 py-3 text-center text-sm font-bold text-white shadow-md shadow-rose-500/25 transition-all hover:bg-rose-600 active:scale-[0.98]"
      >
        Mulai spin sekarang →
      </Link>
    </section>
  );
}
