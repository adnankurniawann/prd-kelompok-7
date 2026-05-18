"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

function getDisplayName(session: Session | null): string {
  if (!session) {
    return "Tamu";
  }

  const user = session.user;
  const metadata = user.user_metadata as Record<string, unknown> | undefined;
  const fullName = metadata?.full_name;
  const name = metadata?.name;

  if (typeof fullName === "string" && fullName.trim().length > 0) {
    return fullName;
  }

  if (typeof name === "string" && name.trim().length > 0) {
    return name;
  }

  return user.email?.split("@")[0] ?? "Pengguna";
}

function formatDate(value: string | undefined): string {
  if (!value) {
    return "-";
  }

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

      if (!isMounted) {
        return;
      }

      setSession(data.session ?? null);
      setIsLoading(false);
      hasCheckedSession.current = true;

      if (!data.session) {
        router.replace("/login");
      }
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);

      if (hasCheckedSession.current && !nextSession) {
        router.replace("/login");
      }
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
    router.replace("/login");
  };

  const displayName = getDisplayName(session);
  const email = session?.user.email ?? "-";
  const createdAt = formatDate(session?.user.created_at);
  const lastSignIn = formatDate(session?.user.last_sign_in_at ?? undefined);

  return (
    <main className="min-h-screen bg-[#0e1b28] px-4 py-6 text-white sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-6xl flex-col gap-6 rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_35%),linear-gradient(180deg,#0f2232_0%,#0b1620_100%)] p-4 shadow-[0_30px_120px_rgba(2,8,23,0.45)] sm:p-8">
        <header className="flex flex-col gap-4 rounded-[1.75rem] border border-white/10 bg-white/5 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-[0.7rem] font-bold uppercase tracking-[0.4em] text-cyan-400">
              Account dashboard
            </p>
            <h1 className="mt-2 text-2xl font-black tracking-tight text-white sm:text-3xl">
              Dashboard akun kamu.
            </h1>
            <p className="mt-2 text-sm text-slate-400">
              Tempat cek profil, sesi login, dan pintasan utama sebelum deploy ke Vercel.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              Homepage
            </Link>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={isLoading || isSigningOut}
              className="rounded-full bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSigningOut ? "Keluar..." : "Keluar akun"}
            </button>
          </div>
        </header>

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="h-64 animate-pulse rounded-[1.75rem] bg-white/5" />
            <div className="h-64 animate-pulse rounded-[1.75rem] bg-white/5" />
            <div className="h-64 animate-pulse rounded-[1.75rem] bg-white/5" />
          </div>
        ) : session ? (
          <>
            <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[1.75rem] border border-white/10 bg-[#17283a]/95 p-6 shadow-[0_24px_90px_rgba(2,8,23,0.4)]">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">
                      Profil
                    </p>
                    <h2 className="mt-2 text-3xl font-black tracking-tight text-white">
                      {displayName}
                    </h2>
                    <p className="mt-2 text-sm text-slate-400">{email}</p>
                  </div>
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-cyan-400 text-2xl font-black text-slate-950">
                    {displayName
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0]?.toUpperCase() ?? "")
                      .join("") || "GM"}
                  </div>
                </div>

                <div className="mt-6 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Status
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">Logged in</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Dibuat
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">{createdAt}</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
                      Terakhir masuk
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white">{lastSignIn}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-cyan-400">
                  Quick actions
                </p>
                <div className="mt-4 space-y-3">
                  <Link
                    href="/spin"
                    className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Buka spin makanan
                  </Link>
                  <Link
                    href="/map"
                    className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Lihat peta restoran
                  </Link>
                  <Link
                    href="/blind"
                    className="block rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Coba blind gacha
                  </Link>
                </div>
              </div>
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">
                  Deploy ready
                </p>
                <h3 className="mt-2 text-xl font-black text-white">Siap ke Vercel</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Halaman ini aman dipakai untuk cek autentikasi setelah deployment.
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">
                  Session
                </p>
                <h3 className="mt-2 text-xl font-black text-white">Supabase aktif</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Login tersimpan di browser dan bisa dipakai ulang saat buka halaman lain.
                </p>
              </div>
              <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5">
                <p className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">
                  Next step
                </p>
                <h3 className="mt-2 text-xl font-black text-white">Tambah data akun</h3>
                <p className="mt-2 text-sm leading-6 text-slate-400">
                  Kalau mau, dashboard ini bisa dikembangin jadi profil, riwayat, dan favorit.
                </p>
              </div>
            </section>
          </>
        ) : (
          <section className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 text-center">
            <p className="text-lg font-semibold text-white">Mengalihkan ke halaman login...</p>
            <p className="mt-2 text-sm text-slate-400">
              Jika tidak otomatis, buka halaman login secara manual.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex rounded-full bg-cyan-400 px-4 py-2 text-sm font-bold text-slate-950 transition hover:bg-cyan-300"
            >
              Ke login
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
