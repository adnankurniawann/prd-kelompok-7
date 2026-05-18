"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase/client";

type AuthPanelVariant = "compact" | "full";

type AuthPanelProps = {
  variant?: AuthPanelVariant;
  className?: string;
};

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

function getAvatarLabel(session: Session | null): string {
  if (!session?.user.email) {
    return "GM";
  }

  const displayName = getDisplayName(session);
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

  return initials.length > 0 ? initials : session.user.email[0]?.toUpperCase() ?? "GM";
}

export function AuthPanel({ variant = "compact", className = "" }: AuthPanelProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    let isMounted = true;

    const loadSession = async () => {
      const { data } = await supabase.auth.getSession();

      if (!isMounted) {
        return;
      }

      setSession(data.session ?? null);
      setIsLoading(false);
    };

    void loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      return;
    }

    const timer = window.setInterval(() => {
      setCooldownSeconds((currentValue) => {
        if (currentValue <= 1) {
          window.clearInterval(timer);
          return 0;
        }

        return currentValue - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [cooldownSeconds]);

  const getMagicLinkErrorMessage = (authError: unknown): string => {
    if (authError && typeof authError === "object") {
      const error = authError as { message?: string; status?: number; code?: string };

      if (error.status === 429 || error.code === "over_email_send_rate_limit") {
        setCooldownSeconds(60);
        return "Terlalu sering kirim email. Tunggu 60 detik lalu coba lagi.";
      }

      const message = error.message ?? "Gagal mengirim magic link.";

      return message;
    }

    if (authError instanceof Error && /rate.?limit|too many/i.test(authError.message)) {
      setCooldownSeconds(60);
      return "Terlalu sering kirim email. Tunggu 60 detik lalu coba lagi.";
    }

    return "Gagal mengirim magic link.";
  };

  const handleMagicLink = async () => {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setErrorMessage("Masukkan email dulu.");
      return;
    }

    if (cooldownSeconds > 0) {
      setErrorMessage(`Tunggu ${cooldownSeconds} detik sebelum kirim lagi.`);
      return;
    }

    setIsBusy(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const redirectTo = `${window.location.origin}/account`;
      const { error } = await supabase.auth.signInWithOtp({
        email: trimmedEmail,
        options: {
          emailRedirectTo: redirectTo,
        },
      });

      if (error) {
        throw error;
      }

      setSuccessMessage("Link login sudah dikirim. Cek inbox atau spam email kamu.");
    } catch (authError) {
      setErrorMessage(getMagicLinkErrorMessage(authError));
    }

    setIsBusy(false);
  };

  const handleSignOut = async () => {
    setIsBusy(true);
    setErrorMessage(null);

    const { error } = await supabase.auth.signOut();

    if (error) {
      setErrorMessage(error.message);
    }

    setIsBusy(false);
  };

  const displayName = getDisplayName(session);
  const avatarLabel = getAvatarLabel(session);

  if (variant === "full") {
    return (
      <section className={`space-y-5 ${className}`.trim()}>
        {isLoading ? (
          <div className="space-y-3">
            <div className="h-4 w-24 animate-pulse rounded-full bg-slate-700/80" />
            <div className="h-11 animate-pulse rounded-2xl bg-slate-800/80" />
            <div className="h-11 animate-pulse rounded-2xl bg-slate-800/80" />
          </div>
        ) : session ? (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-sm font-semibold text-white">Kamu sudah login sebagai {displayName}.</p>
            <p className="mt-1 text-xs text-slate-400">{session.user.email}</p>
            <button
              type="button"
              onClick={() => void handleSignOut()}
              disabled={isBusy}
              className="mt-4 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? "Keluar..." : "Keluar"}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.28em] text-slate-400">
                Email
              </span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="nama@kampus.ac.id"
                className="w-full rounded-2xl border border-white/10 bg-[#0f1f2f] px-4 py-3 text-sm text-white placeholder:text-slate-500 outline-none transition focus:border-cyan-400"
              />
            </label>

            <button
              type="button"
              onClick={() => void handleMagicLink()}
              disabled={isBusy || cooldownSeconds > 0}
              className="flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isBusy
                ? "Mengirim..."
                : cooldownSeconds > 0
                  ? `Tunggu ${cooldownSeconds} detik`
                  : "Kirim magic link"}
            </button>
          </div>
        )}

        {errorMessage ? (
          <p className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {errorMessage}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-3 text-sm text-cyan-100">
            {successMessage}
          </p>
        ) : null}
      </section>
    );
  }

  return (
    <div
      className={`rounded-[1.75rem] border border-white/70 bg-white/80 p-4 shadow-[0_18px_60px_rgba(15,23,42,0.12)] backdrop-blur ${className}`.trim()}
    >
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500 text-sm font-black text-white">
          {avatarLabel}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-emerald-600">
            {session ? "Akun aktif" : "Masuk cepat"}
          </p>
          <p className="truncate text-sm font-semibold text-slate-950">
            {isLoading ? "Memuat akun..." : session ? displayName : "Masuk dengan email"}
          </p>
        </div>
        {session ? (
          <button
            type="button"
            onClick={() => void handleSignOut()}
            disabled={isBusy}
            className="rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBusy ? "..." : "Keluar"}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              window.location.href = "/login";
            }}
            disabled={isBusy}
            className="rounded-full bg-slate-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isBusy ? "..." : "Email"}
          </button>
        )}
      </div>

      {errorMessage ? <p className="mt-3 text-xs text-rose-600">{errorMessage}</p> : null}
    </div>
  );
}
