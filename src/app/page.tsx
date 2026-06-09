import {
  HygieneReportsFeed,
  HygieneReportsFeedSkeleton,
} from "@/components/home/hygiene-reports-feed";
import {
  RestaurantStatsCards,
  RestaurantStatsSkeleton,
} from "@/components/home/restaurant-stats";
import WalletCard from "@/components/WalletCard";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Suspense } from "react";

export default async function Home() {
  const supabase = await createSupabaseServerClient();
  const { data: { session } } = await supabase.auth.getSession();

  const metadata = session?.user?.user_metadata || {};
  const displayName = metadata.full_name || metadata.name || session?.user?.email?.split("@")[0];
  const avatarUrl = metadata.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(displayName || "User")}`;

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 selection:bg-rose-500 selection:text-white">
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 px-4 md:px-8 py-3 shadow-sm flex items-center justify-between transition-all">
        <Link href="/" className="flex items-center gap-1">
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900">
            Gacha<span className="text-rose-500">Makan</span>
          </h1>
        </Link>

        {session ? (
          <Link
            href="/account"
            className="flex items-center gap-3 group cursor-pointer transition-transform active:scale-95"
          >
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                Mahasiswa ITB
              </p>
              <p className="text-sm font-semibold text-slate-700 group-hover:text-rose-500 transition-colors">
                {displayName}
              </p>
            </div>
            <div className="h-9 w-9 rounded-full border-2 border-white shadow-sm overflow-hidden bg-slate-200 transition-transform group-hover:scale-105">
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            </div>
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-3 group cursor-pointer transition-transform active:scale-95"
          >
            <div className="text-right hidden sm:block">
              <p className="text-[10px] font-medium uppercase tracking-widest text-slate-400">
                Pengguna Tamu
              </p>
              <p className="text-sm font-semibold text-slate-700 group-hover:text-rose-500 transition-colors">
                Login Akun
              </p>
            </div>
            <div className="h-9 w-9 rounded-full border-2 border-slate-200 bg-slate-100 flex items-center justify-center text-slate-400 transition-all group-hover:scale-105 group-hover:border-rose-200 group-hover:text-rose-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="w-5 h-5"
              >
                <path
                  fillRule="evenodd"
                  d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
          </Link>
        )}
      </header>

      <div className="mx-auto max-w-6xl w-full px-4 md:px-8 pt-6 flex flex-col md:flex-row gap-6 lg:gap-8">
        <div className="flex-1 flex flex-col gap-6">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 text-white shadow-lg shadow-slate-900/10 relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/5 rounded-full blur-3xl transition-transform duration-700 group-hover:scale-150"></div>
            <p className="text-sm font-normal text-slate-300 mb-1">
              Selamat datang kembali,
            </p>
            <h2 className="text-2xl font-semibold tracking-tight text-white/95">
              Siap berburu makan siang?
            </h2>
          </div>

          {session && <WalletCard />}

          <Suspense fallback={<RestaurantStatsSkeleton />}>
            <RestaurantStatsCards />
          </Suspense>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h3 className="text-base font-semibold text-slate-800 mb-4 tracking-tight">Pilih Mode Gacha</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <Link href="/spin" className="group relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:bg-white hover:border-rose-200 hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.98]">
                <div className="w-10 h-10 rounded-lg bg-rose-100 text-rose-500 flex items-center justify-center text-xl mb-3 transition-transform group-hover:scale-110 group-hover:rotate-12">🎰</div>
                <h4 className="text-sm font-semibold text-slate-800 group-hover:text-rose-600 transition-colors">Mode Higienis</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed font-normal">Spin restoran aman sesuai budget.</p>
              </Link>
              <Link href="/map" className="group relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:bg-white hover:border-sky-200 hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.98]">
                <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-500 flex items-center justify-center text-xl mb-3 transition-transform group-hover:scale-110 group-hover:-translate-y-1">📍</div>
                <h4 className="text-sm font-semibold text-slate-800 group-hover:text-sky-600 transition-colors">Radar Eksplor</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed font-normal">Pantau area dan status higienitas.</p>
              </Link>
              <Link href="/blind" className="group relative overflow-hidden rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:bg-slate-800 hover:border-slate-800 hover:shadow-sm hover:-translate-y-0.5 active:scale-[0.98]">
                <div className="w-10 h-10 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center text-xl mb-3 transition-transform group-hover:scale-110 group-hover:rotate-180">🎲</div>
                <h4 className="text-sm font-semibold text-slate-800 group-hover:text-white transition-colors">Blind Gacha</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed font-normal group-hover:text-slate-300 transition-colors">Kejutan instan sekali klik.</p>
              </Link>
            </div>
          </div>
        </div>

        <div className="w-full md:w-[340px] lg:w-[380px] flex flex-col gap-6 shrink-0">
          <Link href="/spin" className="group w-full bg-gradient-to-r from-rose-500 to-orange-500 text-white rounded-2xl p-5 flex items-center justify-between shadow-md shadow-rose-500/20 transition-all duration-300 hover:shadow-lg hover:shadow-rose-500/30 hover:-translate-y-0.5 active:scale-[0.98] active:translate-y-0 active:shadow-sm">
            <div>
              <p className="text-[10px] uppercase tracking-widest text-rose-100 font-medium mb-1">Aksi Cepat</p>
              <p className="text-lg font-bold tracking-tight text-white/95">Spin Makan Siang</p>
            </div>
            <div className="h-11 w-11 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm transition-transform group-hover:scale-110 group-hover:rotate-12">
              <span className="text-xl">🎰</span>
            </div>
          </Link>

          <Suspense fallback={<HygieneReportsFeedSkeleton />}>
            <HygieneReportsFeed />
          </Suspense>

          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm mb-6">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 tracking-tight">Cara Penggunaan</h3>
            <div className="space-y-4">
              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">1</div>
                <p className="text-xs font-normal text-slate-500 leading-relaxed pt-0.5">Pilih budget & radius untuk <span className="font-medium text-slate-700">spin restoran acak</span>.</p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-sky-50 text-sky-500 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">2</div>
                <p className="text-xs font-normal text-slate-500 leading-relaxed pt-0.5">Pantau status higienitas di menu <span className="font-medium text-slate-700">Radar Map</span>.</p>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0 text-[10px] font-bold mt-0.5">3</div>
                <p className="text-xs font-normal text-slate-500 leading-relaxed pt-0.5">Berpartisipasi kirim laporan kotor atau bersih.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}