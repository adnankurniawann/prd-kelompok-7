"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  ensureSession,
  isAnonymous,
  linkEmailToSession,
} from "@/lib/supabase/session";

/**
 * Panel email untuk masuk, atau untuk menyimpan sesi anonim jadi akun.
 *
 * Perbedaannya penting. Kalau sesi yang berjalan anonim, emailnya DIKAITKAN ke
 * user yang sudah ada lewat `updateUser`, bukan membuat user baru — dengan
 * begitu `user_id`-nya tidak berubah dan riwayat spin yang sudah terkumpul
 * ikut terbawa. Memakai `signInWithOtp` di situ akan membuang riwayat itu
 * diam-diam, dan itu persis data yang nanti melatih model rekomendasi.
 */
export function AuthPanel({ className }: { className?: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [anonymous, setAnonymous] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;

    void ensureSession().then((session) => {
      if (!cancelled) setAnonymous(isAnonymous(session));
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setAnonymous(isAnonymous(session));
    });

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage({ text: "Masukkan email dulu.", isError: true });
      return;
    }

    setLoading(true);
    setMessage(null);

    const redirectTo = `${window.location.origin}/auth/callback`;

    try {
      let errorMessage: string | null;

      if (anonymous) {
        errorMessage = (await linkEmailToSession(email, redirectTo)).error;
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo },
        });
        errorMessage = error?.message ?? null;
      }

      if (errorMessage) {
        setMessage({ text: errorMessage, isError: true });
      } else {
        setMessage({
          text: anonymous
            ? "Cek emailmu. Buka linknya, dan riwayat spin kamu ikut kesimpan."
            : "Link ajaib telah dikirim ke email kamu!",
          isError: false,
        });
      }
    } catch {
      setMessage({ text: "Terjadi kesalahan. Coba lagi.", isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      {anonymous && (
        <p className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] leading-relaxed text-amber-800">
          Kamu udah bisa spin tanpa akun. Simpan email cuma kalau mau riwayat
          dan favoritmu tetap ada waktu ganti HP.
        </p>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {/* Label EMAIL yang dirapikan */}
        <label className="flex flex-col gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
            E M A I L
          </span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="nama@kampus.ac.id"
            required
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-rose-400 focus:bg-white focus:ring-2 focus:ring-rose-100"
          />
        </label>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-rose-500 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-rose-500/30 transition-all hover:bg-rose-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 mt-2"
        >
          {loading ? "Mengirim..." : anonymous ? "Simpan Akun" : "Kirim Link"}
        </button>
      </form>

      {/* Pesan Error / Sukses */}
      {message && (
        <div
          className={`mt-4 rounded-xl px-4 py-3 text-sm font-medium text-center ${
            message.isError
              ? "border border-rose-200 bg-rose-50 text-rose-600"
              : "border border-emerald-200 bg-emerald-50 text-emerald-600"
          }`}
        >
          {message.text}
        </div>
      )}
    </div>
  );
}
