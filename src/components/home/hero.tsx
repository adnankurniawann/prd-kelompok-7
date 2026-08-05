import Link from "next/link";
import { ArrowRight, Clock, MapPin, ShieldCheck } from "lucide-react";

import { GachaBall } from "@/components/home/gacha-ball";

/**
 * Hero untuk pengunjung yang belum pernah spin.
 *
 * CATATAN SOAL ASALNYA: kode `Hero195` yang dirujuk tidak ikut terkirim —
 * berkas berlabel `hero-195-1.tsx` isinya primitif Card shadcn, dan `demo.tsx`
 * mengimpor dari `@/components/ui/hero-195` yang tidak ada. Ini bukan salinan
 * Hero195; ia disusun untuk aplikasi ini.
 *
 * Prinsip tata letaknya: SATU hal yang besar, sisanya mengecil. Sebelumnya
 * hero, panduan, kartu aksi, dan petak ikon semuanya berukuran mirip dan
 * sama-sama tebal, jadi tidak ada yang menonjol dan mata tidak tahu harus ke
 * mana. Sekarang judul dan tombolnya jauh lebih besar dari apa pun di
 * bawahnya.
 */

const POINTS = [
  { icon: MapPin, label: "Yang deket" },
  { icon: Clock, label: "Yang lagi buka" },
  { icon: ShieldCheck, label: "Yang bersih" },
] as const;

export function Hero() {
  return (
    <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {/* Bidang warna di belakang bola, memberi kedalaman tanpa gradien di
          belakang teks — teks di atas gradien selalu lebih sulit dibaca. */}
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full bg-rose-50 sm:-right-10"
        aria-hidden="true"
      />

      <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:gap-4 sm:p-9">
        <div className="min-w-0 flex-1">
          <p className="rise-in text-[11px] font-semibold uppercase tracking-[0.15em] text-rose-500">
            Jatinangor
          </p>

          {/* Satu-satunya teks besar di halaman. Bobot 700, bukan 800 —
              cukup untuk memimpin tanpa terasa berteriak. */}
          <h1
            className="rise-in mt-2.5 text-[2rem] font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-[2.75rem]"
            style={{ animationDelay: "60ms" }}
          >
            Laper, tapi
            <br />
            bingung mau apa?
          </h1>

          <p
            className="rise-in mt-3.5 max-w-sm text-[15px] leading-relaxed text-slate-600"
            style={{ animationDelay: "120ms" }}
          >
            Tekan sekali, dapat satu warung. Bukan daftar dua puluh pilihan yang
            bikin kamu makin lama memutuskan.
          </p>

          <div
            className="rise-in mt-6 flex flex-wrap items-center gap-3"
            style={{ animationDelay: "180ms" }}
          >
            <Link
              href="/spin"
              className="group inline-flex items-center gap-2 rounded-xl bg-rose-500 px-7 py-4 text-base font-semibold text-white shadow-lg shadow-rose-500/25 transition-all hover:bg-rose-600 hover:shadow-xl hover:shadow-rose-500/30 active:scale-[0.98]"
            >
              Spin sekarang
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href="/map"
              className="text-sm font-medium text-slate-500 underline-offset-4 transition-colors hover:text-slate-800 hover:underline"
            >
              atau lihat peta dulu
            </Link>
          </div>

          <ul
            className="rise-in mt-7 flex flex-wrap items-center gap-x-5 gap-y-2"
            style={{ animationDelay: "240ms" }}
          >
            {POINTS.map((point) => (
              <li
                key={point.label}
                className="flex items-center gap-1.5 text-[13px] text-slate-500"
              >
                <point.icon className="h-3.5 w-3.5 text-rose-400" aria-hidden="true" />
                {point.label}
              </li>
            ))}
          </ul>
        </div>

        <GachaBall className="mx-auto h-40 w-40 shrink-0 sm:mx-0 sm:h-56 sm:w-56" />
      </div>
    </section>
  );
}
