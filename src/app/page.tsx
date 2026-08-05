import Link from "next/link";
import { Suspense } from "react";

import { AppHeader } from "@/components/home/app-header";
import { BottomNav } from "@/components/home/bottom-nav";
import {
  HygieneReportsFeed,
  HygieneReportsFeedSkeleton,
} from "@/components/home/hygiene-reports-feed";
import {
  RestaurantStatsCards,
  RestaurantStatsSkeleton,
} from "@/components/home/restaurant-stats";
import { Hero } from "@/components/home/hero";
import { UsageGuide } from "@/components/home/usage-guide";
import { Card, IconTile, SectionHeader } from "@/components/ui/surface";
import WalletCard from "@/components/WalletCard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Beranda.
 *
 * Urutannya mengikuti apa yang dibutuhkan orang, bukan apa yang paling banyak
 * kodenya: panduan, aksi utama, pintasan, baru angka dan feed. Statistik
 * katalog menarik untuk kami yang membuatnya, tapi tidak menolong siapa pun
 * memutuskan mau makan apa.
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

  let spinCount = 0;
  if (user) {
    const { count } = await supabase
      .from("spin_events")
      .select("id", { count: "exact", head: true });
    spinCount = count ?? 0;
  }

  const firstTime = spinCount === 0;

  return (
    <main className="min-h-screen bg-slate-100 pb-24 font-sans text-slate-800 md:pb-10">
      <AppHeader displayName={displayName} isAnonymous={isAnonymous} />

      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 pt-3 md:px-6">
        {/* Pengunjung baru dapat hero yang menjelaskan produknya; yang sudah
            pernah spin tidak perlu dijelaskan lagi dan langsung dapat tombol.
            Menyodorkan hero yang sama tiap kali buka aplikasi cuma memakan
            layar. */}
        {firstTime ? (
          <>
            <Hero />
            <UsageGuide forceOpen />
          </>
        ) : (
          <>
            <UsageGuide />
            <Card className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[15px] font-bold tracking-tight text-slate-900">
                  Siap makan siang?
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  Kamu sudah spin {spinCount}× sejauh ini.
                </p>
              </div>
              <Link
                href="/spin"
                className="shrink-0 rounded-lg bg-rose-500 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-rose-600 active:scale-95"
              >
                Spin
              </Link>
            </Card>
          </>
        )}

        {/* Petak ikon: pola yang sudah dikenal orang dari aplikasi belanja.
            Empat kolom, label pendek, tanpa deskripsi. */}
        <Card>
          <div className="grid grid-cols-4 gap-1">
            <IconTile href="/spin" icon="🎰" label="Spin" tone="rose" />
            <IconTile href="/blind" icon="🎲" label="Blind" tone="slate" />
            <IconTile href="/map" icon="📍" label="Peta" tone="sky" />
            <IconTile href="/riwayat" icon="🕒" label="Riwayat" tone="amber" />
          </div>
        </Card>

        {user && !firstTime && <WalletCard />}

        {isAnonymous && !firstTime && (
          <Card className="border-amber-200 bg-amber-50">
            <p className="text-sm font-bold text-amber-900">
              Riwayatmu belum aman
            </p>
            <p className="mt-1 text-xs leading-relaxed text-amber-800">
              Kamu belum punya akun. Simpan email sekali saja, biar riwayat dan
              favoritmu tetap ada waktu ganti HP.
            </p>
            <Link
              href="/login"
              className="mt-2.5 inline-block rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-bold text-white transition-colors hover:bg-amber-600"
            >
              Simpan akun
            </Link>
          </Card>
        )}

        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <SectionHeader title="Laporan terbaru" action="Peta" actionHref="/map" />
            <Suspense fallback={<HygieneReportsFeedSkeleton />}>
              <HygieneReportsFeed />
            </Suspense>
          </div>

          <div>
            <SectionHeader title="Isi katalog" />
            <Suspense fallback={<RestaurantStatsSkeleton />}>
              <RestaurantStatsCards />
            </Suspense>
          </div>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
