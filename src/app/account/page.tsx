"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

function getDisplayName(session: Session | null): string {
  if (!session) return "Tamu";
  const user = session.user;
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const fullName = metadata?.full_name;
  const name = metadata?.name;

  if (typeof fullName === "string" && fullName.trim().length > 0)
    return fullName;
  if (typeof name === "string" && name.trim().length > 0) return name;
  return user.email?.split("@")[0] ?? "Pengguna";
}

function formatDate(value: string | undefined): string {
  if (!value) return "-";
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function AccountPage() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const hasCheckedSession = useRef(false);

  useEffect(() => {
    let isMounted = true;
    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!isMounted) return;
      setSession(data.session ?? null);
      setIsLoading(false);
      hasCheckedSession.current = true;
      // BARIS INI DIMATIKAN SEMENTARA AGAR TIDAK DILEMPAR KE LOGIN
      // if (!data.session) router.replace("/login");
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      // BARIS INI DIMATIKAN SEMENTARA
      // if (hasCheckedSession.current && !nextSession) router.replace("/login");
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    await supabase.auth.signOut();
    setIsSigningOut(false);
    // Kalau mau logout, tetap diarahin ke home atau biarin aja di halaman ini
    router.replace("/");
  };

  const displayName = getDisplayName(session);
  const email = session?.user.email ?? "Tamu belum login";
  const createdAt = formatDate(session?.user.created_at);
  const lastSignIn = formatDate(session?.user.last_sign_in_at ?? undefined);

  // Fallback initial untuk avatar kalau nama tidak ada
  const initials =
    displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "GM";

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      {/* HEADER - Clean Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 px-4 md:px-8 py-3 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-95 font-bold"
          >
            ←
          </Link>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight">
            Akun Saya
          </h1>
        </div>

        {/* Tampilkan tombol login jika belum login, dan tombol logout jika sudah login */}
        {session ? (
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={isLoading || isSigningOut}
            className="rounded-full bg-rose-50 text-rose-600 border border-rose-200 px-4 py-1.5 text-xs font-bold transition hover:bg-rose-100 active:scale-95 disabled:opacity-50"
          >
            {isSigningOut ? "Keluar..." : "Keluar Akun"}
          </button>
        ) : (
          <Link
            href="/login"
            className="rounded-full bg-sky-50 text-sky-600 border border-sky-200 px-4 py-1.5 text-xs font-bold transition hover:bg-sky-100 active:scale-95"
          >
            Login Sekarang
          </Link>
        )}
      </header>

      <div className="mx-auto w-full max-w-4xl px-4 md:px-8 pt-6 flex flex-col gap-6">
        {isLoading ? (
          // Skeleton Loading State
          <div className="animate-pulse flex flex-col gap-6">
            <div className="h-40 rounded-3xl bg-slate-200" />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="h-32 rounded-2xl bg-slate-200" />
              <div className="h-32 rounded-2xl bg-slate-200" />
              <div className="h-32 rounded-2xl bg-slate-200" />
            </div>
          </div>
        ) : (
          <>
            {/* PROFILE CARD - Kombinasi Putih dan Pattern Halus */}
            <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 md:p-8 shadow-sm">
              <div className="absolute top-0 right-0 w-64 h-64 bg-rose-50 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4"></div>

              <div className="relative z-10 flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
                {/* Avatar */}
                <div className="h-24 w-24 shrink-0 rounded-full border-4 border-white shadow-md bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-3xl font-black text-slate-400 overflow-hidden">
                  <img
                    src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName}`}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 mt-2">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-rose-500 mb-1">
                    {session ? "Profil Pengguna" : "Profil Tamu"}
                  </p>
                  <h2 className="text-3xl font-black tracking-tight text-slate-900">
                    {displayName}
                  </h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    {email}
                  </p>

                  {session ? (
                    <span className="inline-block mt-3 px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-widest rounded-md border border-emerald-100">
                      Status: Aktif
                    </span>
                  ) : (
                    <span className="inline-block mt-3 px-2.5 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold uppercase tracking-widest rounded-md border border-slate-200">
                      Status: Belum Login
                    </span>
                  )}
                </div>
              </div>

              {/* Stats Bar */}
              <div className="relative z-10 mt-8 grid grid-cols-2 gap-4 border-t border-slate-100 pt-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    Dibuat Sejak
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {createdAt}
                  </p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400">
                    Terakhir Masuk
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-800">
                    {lastSignIn}
                  </p>
                </div>
              </div>
            </section>

            {/* QUICK ACTIONS & INFO GRID */}
            <section className="grid gap-6 md:grid-cols-[1fr_2fr]">
              {/* Quick Actions */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 mb-4">
                  Aksi Cepat
                </p>
                <div className="space-y-3">
                  <Link
                    href="/spin"
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-rose-50 hover:text-rose-600 hover:border-rose-100 active:scale-95"
                  >
                    <span className="text-lg">🎰</span> Buka Spin Makanan
                  </Link>
                  <Link
                    href="/map"
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-sky-50 hover:text-sky-600 hover:border-sky-100 active:scale-95"
                  >
                    <span className="text-lg">📍</span> Lihat Peta Restoran
                  </Link>
                  <Link
                    href="/blind"
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-800 hover:text-white active:scale-95"
                  >
                    <span className="text-lg">🎲</span> Coba Blind Gacha
                  </Link>
                </div>
              </div>

              {/* Developer Info Cards */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
                  <span className="text-2xl mb-3">🚀</span>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Mode Tamu (Guest)
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    Saat ini fitur redirect ke login dimatikan sementara. Kamu
                    bisa bebas melihat tampilan dashboard tanpa harus
                    autentikasi.
                  </p>
                </div>

                <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col">
                  <span className="text-2xl mb-3">🔒</span>
                  <h3 className="text-base font-bold text-slate-900 tracking-tight">
                    Supabase Ready
                  </h3>
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    Kalau kamu sudah login sungguhan nanti, profil ini akan
                    terisi otomatis dengan data akun yang asli.
                  </p>
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
