import Link from "next/link";
import { Dices, History, MapPin } from "lucide-react";
import { Suspense } from "react";

import { AppHeader } from "@/components/home/app-header";
import { BottomNav } from "@/components/home/bottom-nav";
import { Hero } from "@/components/home/hero";
import {
  HygieneReportsFeed,
  HygieneReportsFeedSkeleton,
} from "@/components/home/hygiene-reports-feed";
import {
  RestaurantStatsCards,
  RestaurantStatsSkeleton,
} from "@/components/home/restaurant-stats";
import { UsageGuide } from "@/components/home/usage-guide";
import { Card, IconTile, SectionHeader } from "@/components/ui/surface";
import WalletCard from "@/components/WalletCard";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Beranda.
 *
 * SATU AKSI UTAMA PER LAYAR. Sebelumnya ada tiga tautan "spin" sekaligus:
 * tombol di hero, tombol di panduan, dan petak ikon. Tiga tombol yang menuju
 * tempat yang sama bukan memudahkan — ia membuat orang berhenti sebentar untuk
 * menebak apakah ketiganya benar-benar sama.
 *
 * Sekarang: satu tombol spin yang besar, dan petak ikon berisi tujuan LAIN.
 */

export const dynamic = "force-dynamic";

export default async function Home() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    <main className="min-h-screen bg-slate-100 pb-24 font-sans text-slate-800 md:pb-12">
      <AppHeader displayName={displayName} isAnonymous={isAnonymous} />

      <div className="mx-auto w-full max-w-5xl px-4 pt-4 md:px-6">
        {/* --- Aksi utama. Satu-satunya tombol spin di halaman ini. --------- */}
        {firstTime ? (
          <Hero />
        ) : (
          <Card className="flex items-center justify-between gap-4 p-5">
            <div className="min-w-0">
              <p className="text-lg font-semibold tracking-tight text-slate-900">
                Siap makan siang?
              </p>
              <p className="mt-0.5 text-[13px] text-slate-500">
                Kamu sudah spin {spinCount}× sejauh ini.
              </p>
            </div>
            <Link
              href="/spin"
              className="shrink-0 rounded-xl bg-rose-500 px-6 py-3.5 text-[15px] font-semibold text-white shadow-lg shadow-rose-500/25 transition-all hover:bg-rose-600 active:scale-[0.98]"
            >
              Spin
            </Link>
          </Card>
        )}

        {/* --- Tujuan lain. Tidak ada "Spin" di sini; ia sudah di atas. ----- */}
        <nav className="mt-3 grid grid-cols-3 rounded-xl border border-slate-200 bg-white">
          <IconTile href="/blind" icon={Dices} label="Blind gacha" tone="slate" />
          <IconTile href="/map" icon={MapPin} label="Peta" tone="sky" />
          <IconTile href="/riwayat" icon={History} label="Riwayat" tone="amber" />
        </nav>

        {user && !firstTime && (
          <div className="mt-3">
            <WalletCard />
          </div>
        )}

        {isAnonymous && !firstTime && (
          <Card className="mt-3 border-amber-200 bg-amber-50">
            <p className="text-sm font-semibold text-amber-900">
              Riwayatmu belum aman
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-amber-800">
              Simpan email sekali saja, biar riwayat dan favoritmu tetap ada
              waktu ganti HP.
            </p>
            <Link
              href="/login"
              className="mt-2.5 inline-block rounded-lg bg-amber-500 px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-amber-600"
            >
              Simpan akun
            </Link>
          </Card>
        )}

        {/* --- Panduan, sekarang tanpa tombolnya sendiri -------------------- */}
        <div className="mt-6">
          <UsageGuide forceOpen={firstTime} />
        </div>

        {/* --- Bagian bawah: satu kolom, bukan dua -------------------------
            Dua kolom berdampingan yang tingginya tidak pernah sama membuat
            sisi kanan menggantung kosong. Ditumpuk saja: laporan dulu karena
            ia berubah tiap hari, angka katalog paling bawah karena ia hampir
            tidak pernah berubah. */}
        <div className="mt-8">
          <SectionHeader
            title="Laporan kebersihan terbaru"
            action="Lihat peta"
            actionHref="/map"
          />
          <Suspense fallback={<HygieneReportsFeedSkeleton />}>
            <HygieneReportsFeed />
          </Suspense>
        </div>

        <div className="mt-6">
          <Suspense fallback={<RestaurantStatsSkeleton />}>
            <RestaurantStatsCards />
          </Suspense>
          <p className="mt-2 px-1 text-[11px] leading-relaxed text-slate-400">
            Katalog masih terus dikurasi. Kalau warung langgananmu belum ada,
            laporkan lewat peta.
          </p>
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
