"use client";

import { useState, useEffect } from "react";
import { m } from "framer-motion";
import Link from "next/link";
import { Wallet } from "lucide-react";
import { MotionProvider } from "@/components/motion/motion-provider";
import { supabase } from "@/lib/supabase/client";
import { ensureSession } from "@/lib/supabase/session";

/**
 * Kartu dompet.
 *
 * PENTING: kartu ini pernah disembunyikan di beranda dengan syarat "sudah
 * pernah spin". Akibatnya, orang yang belum pernah spin tidak pernah melihat
 * fitur budgeting sama sekali — dan kalau pencatatan spin belum jalan,
 * syaratnya tidak pernah terpenuhi dan fiturnya hilang sepenuhnya.
 *
 * Pelajarannya: jangan menyembunyikan seluruh fitur di balik syarat yang
 * mungkin tidak pernah benar. Kalau sebuah fitur belum relevan, tampilkan
 * bentuk ajakannya — jangan hilangkan pintunya.
 *
 * Jadi sekarang ia selalu tampil. Saat budget belum diatur, ia menjelaskan
 * gunanya dan mengajak mengisi.
 */
export default function WalletCard({
  /** Bentuk ringkas untuk beranda; bentuk penuh dipakai di halaman /dompet. */
  compact = false,
}: {
  compact?: boolean;
}) {
  const [balance, setBalance] = useState(0);
  const [budget, setBudget] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const fetchWallet = async () => {
      // ensureSession, bukan getUser: pengunjung baru belum punya sesi sampai
      // sesi anonimnya selesai dibuat.
      const session = await ensureSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("wallets")
        .select("monthly_budget, current_balance")
        .eq("user_id", session.user.id)
        .maybeSingle();

      if (data) {
        setBudget(data.monthly_budget);
        setBalance(data.current_balance);
      }
      setLoading(false);
    };

    fetchWallet();
  }, []);

  const handleSetBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    const budgetValue = parseInt(newBudget, 10);
    if (Number.isNaN(budgetValue) || budgetValue <= 0) return;

    const session = await ensureSession();
    if (!session) {
      setMessage("Sesi belum siap. Muat ulang halaman lalu coba lagi.");
      return;
    }

    const { error } = await supabase.from("wallets").upsert({
      user_id: session.user.id,
      monthly_budget: budgetValue,
      current_balance: budgetValue, // Set budget baru berarti saldo direset penuh
      last_updated: new Date().toISOString(),
    });

    if (error) {
      setMessage("Gagal menyimpan budget. Coba lagi.");
      return;
    }

    setBudget(budgetValue);
    setBalance(budgetValue);
    setIsEditing(false);
    setNewBudget("");
    setMessage(null);
  };

  const percentage =
    budget > 0 ? Math.max(0, Math.min(100, (balance / budget) * 100)) : 0;

  const barColor =
    percentage > 50 ? "bg-emerald-500" : percentage > 20 ? "bg-amber-400" : "bg-rose-500";

  if (loading) {
    return <div className="h-28 animate-pulse rounded-xl bg-slate-200" />;
  }

  // --- Belum diatur: jelaskan gunanya, jangan sembunyikan --------------------
  if (budget <= 0 && !isEditing) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50">
            <Wallet className="h-4 w-4 text-emerald-600" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">
              Atur budget makan
            </p>
            <p className="mt-0.5 text-xs leading-relaxed text-slate-500">
              Tentukan jatah bulanan, dan tiap kali kamu tekan &ldquo;Jadi ke
              sini&rdquo; saldonya otomatis berkurang.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsEditing(true)}
          className="mt-3 w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-slate-800"
        >
          Atur sekarang
        </button>
      </div>
    );
  }

  return (
    <MotionProvider>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-slate-500">Sisa saldo makan</p>
            <p className="mt-0.5 text-2xl font-semibold tabular-nums tracking-tight text-slate-900">
              Rp {balance.toLocaleString("id-ID")}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-50"
          >
            {isEditing ? "Batal" : "Ubah"}
          </button>
        </div>

        {isEditing ? (
          <form onSubmit={handleSetBudget} className="mt-3 flex gap-2">
            <input
              type="number"
              inputMode="numeric"
              value={newBudget}
              onChange={(e) => setNewBudget(e.target.value)}
              placeholder="Contoh: 500000"
              required
              className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-100"
            />
            <button
              type="submit"
              className="shrink-0 rounded-lg bg-rose-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-rose-600"
            >
              Simpan
            </button>
          </form>
        ) : (
          <div className="mt-4">
            <div className="mb-1.5 flex justify-between text-xs text-slate-500">
              <span>Jatah bulan ini</span>
              <span className="tabular-nums">
                Rp {budget.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <m.div
                initial={{ width: 0 }}
                animate={{ width: `${percentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className={`h-full rounded-full ${barColor}`}
              />
            </div>
            {percentage <= 20 && (
              <p className="mt-2.5 text-xs font-medium text-rose-500">
                Saldo menipis. Kurangi jajan mahal.
              </p>
            )}
          </div>
        )}

        {message && (
          <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600">
            {message}
          </p>
        )}

        {compact && !isEditing && (
          <Link
            href="/dompet"
            className="mt-3 block text-xs font-medium text-rose-500 transition-colors hover:text-rose-600"
          >
            Kelola dompet →
          </Link>
        )}
      </div>
    </MotionProvider>
  );
}
