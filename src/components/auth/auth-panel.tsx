"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";

export function AuthPanel({
  variant,
  className,
}: {
  variant?: string;
  className?: string;
}) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    text: string;
    isError: boolean;
  } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setMessage({ text: "Masukkan email dulu.", isError: true });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        setMessage({ text: error.message, isError: true });
      } else {
        setMessage({
          text: "Link ajaib telah dikirim ke email kamu!",
          isError: false,
        });
      }
    } catch (err) {
      setMessage({ text: "Terjadi kesalahan. Coba lagi.", isError: true });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full ${className}`}>
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
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

        {/* Tombol yang diubah menjadi 'Kirim Link' */}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-rose-500 px-4 py-3 text-sm font-bold text-white shadow-sm shadow-rose-500/30 transition-all hover:bg-rose-600 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 mt-2"
        >
          {loading ? "Mengirim..." : "Kirim Link"}
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
