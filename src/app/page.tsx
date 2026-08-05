import Link from "next/link";
import { Suspense } from "react";

import { AppHeader } from "@/components/home/app-header";
import {
  HygieneReportsFeed,
  HygieneReportsFeedSkeleton,
} from "@/components/home/hygiene-reports-feed";
import {
  RestaurantStatsCards,
  RestaurantStatsSkeleton,
} from "@/components/home/restaurant-stats";
import { UsageGuide } from "@/components/home/usage-guide";
import WalletCard from "@/components/WalletCard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Beranda.
 *
 * Urutannya mengikuti apa yang dibutuhkan orang, bukan apa yang paling banyak
 * kodenya: panduan dulu, aksi utama, baru angka dan feed. Statistik katalog
 * menarik untuk kami yang membuatnya, tapi tidak menolong siapa pun memutuskan
 * mau makan apa.
 */

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Sesi anonim punya user_id sungguhan tapi tidak punya nama. Sebelumnya
  // halaman ini memperlakukan "ada sesi" sama dengan "sudah punya akun", jadi
  // pengunjung baru disambut "Selamat datang kembali" dengan nama kosong.
  const isAnonymous = user?.is_anonymous === true;
  const metadata = user?.user_metadata ?? {};
  const displayName: string | null =
    metadata.full_name || metadata.name || user?.email?.split("@")[0] || null;

  // Berapa kali orang ini pernah spin — menentukan apakah beranda ini
  // menyambut pendatang baru atau orang yang sudah tahu jalannya.
  let spinCount = 0;
  if (user) {
    const { count } = await supabase
      .from("spin_events")
      .select("id", { count: "exact", head: true });
    spinCount = count ?? 0;
  }

  const firstTime = spinCount === 0;

  return (
    <main className="min-h-screen bg-slate-50 pb-16 font-sans text-slate-800 selection:bg-rose-500 selection:text-white">
      <AppHeader displayName={displayName} isAnonymous={isAnonymous} />

      <div className="mx-auto w-full max-w-6xl px-4 pt-5 md:px-8">
        {/* Panduan di paling atas — bukan di dasar kolom kanan seperti
            sebelumnya. Orang yang paling butuh justru yang tidak akan
            menggulir sejauh itu. */}
        <UsageGuide forceOpen={firstTime} />
      </div>

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pt-6 md:flex-row md:px-8 lg:gap-8">
        <div className="flex flex-1 flex-col gap-6">
          {/* Sambutan menyesuaikan keadaan, bukan selalu "kembali". */}
          <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white shadow-lg shadow-slate-900/10">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/5 blur-3xl" />
            {firstTime ? (
              <>
                <p className="mb-1 text-sm text-slate-300">Halo,</p>
                <h1 className="text-2xl font-semibold tracking-tight text-white/95">
                  Satu tombol, satu warung.
                </h1>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-300">
                  Kami cuma kasih satu pilihan — biar kamu berhenti scroll dan
                  mulai makan.
                </p>
              </>
            ) : (
              <>
                <p className="mb-1 text-sm text-slate-300">
                  {displayName ? `Halo, ${displayName}` : "Selamat datang kembali"}
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-white/95">
                  Siap berburu makan siang?
                </h1>
                <p className="mt-2 text-sm text-slate-300">
                  Kamu sudah spin {spinCount}× sejauh ini.
                </p>
              </>
            )}

            <Link
              href="/spin"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-rose-500/25 transition-all hover:bg-rose-600 active:scale-[0.98]"
            >
              <span aria-hidden="true">🎰</span> Spin sekarang
            </Link>
          </section>

          {/* Dompet cuma relevan kalau sudah pernah dipakai atau sudah ada
              akunnya. Menyodorkan form budget ke pengunjung baru adalah
              gesekan sebelum nilainya terasa. */}
          {user && !firstTime && <WalletCard />}

          <section className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <h2 className="mb-1 text-base font-semibold tracking-tight text-slate-800">
              Cara lain mencari
            </h2>
            <p className="mb-4 text-xs text-slate-500">
              Semuanya menuju hal yang sama: satu tempat buat makan.
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Link
                href="/spin"
                className="group rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:-translate-y-0.5 hover:border-rose-200 hover:bg-white hover:shadow-sm active:scale-[0.98]"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-xl text-rose-500">
                  🎰
                </div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Spin dengan filter
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Atur budget, jarak, dan jam buka.
                </p>
              </Link>

              <Link
                href="/blind"
                className="group rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-sm active:scale-[0.98]"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200 text-xl text-slate-700">
                  🎲
                </div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Blind gacha
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Tanpa atur apa-apa. Sekali klik, terima nasib.
                </p>
              </Link>

              <Link
                href="/map"
                className="group rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:-translate-y-0.5 hover:border-sky-200 hover:bg-white hover:shadow-sm active:scale-[0.98]"
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-xl text-sky-500">
                  📍
                </div>
                <h3 className="text-sm font-semibold text-slate-800">
                  Lihat peta
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">
                  Kalau kamu memang mau memilih sendiri.
                </p>
              </Link>
            </div>
          </section>

          <Suspense fallback={<RestaurantStatsSkeleton />}>
            <RestaurantStatsCards />
          </Suspense>
        </div>

        <aside className="flex w-full shrink-0 flex-col gap-6 md:w-[340px] lg:w-[380px]">
          {!firstTime && (
            <Link
              href="/riwayat"
              className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
            >
              <div>
                <p className="mb-1 text-[10px] font-medium uppercase tracking-widest text-slate-400">
                  Punyamu
                </p>
                <p className="text-base font-bold tracking-tight text-slate-800">
                  Riwayat &amp; simpanan
                </p>
              </div>
              <span className="text-xl" aria-hidden="true">
                🕒
              </span>
            </Link>
          )}

          {isAnonymous && !firstTime && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-semibold text-amber-900">
                Riwayatmu belum aman
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-amber-800">
                Kamu belum punya akun. Simpan email sekali saja, biar riwayat
                dan favoritmu tetap ada waktu ganti HP.
              </p>
              <Link
                href="/login"
                className="mt-3 inline-block rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-600"
              >
                Simpan akun
              </Link>
            </div>
          )}

          <Suspense fallback={<HygieneReportsFeedSkeleton />}>
            <HygieneReportsFeed />
          </Suspense>
        </aside>
      </div>
    </main>
  );
}
