"use client";

import { useState, useEffect } from "react";
import { m } from "framer-motion";
import { MotionProvider } from "@/components/motion/motion-provider";
import { supabase } from "@/lib/supabase/client";
import { ensureSession } from "@/lib/supabase/session";

export default function WalletCard() {
  const [balance, setBalance] = useState(0);
  const [budget, setBudget] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [newBudget, setNewBudget] = useState("");
  const [loading, setLoading] = useState(true);

  // Ambil data dompet user saat komponen dimuat
  useEffect(() => {
    const fetchWallet = async () => {
      // ensureSession, bukan getUser: pengunjung baru belum punya sesi sampai
      // sesi anonimnya selesai dibuat. getUser akan menjawab null di situ dan
      // dompetnya diam-diam tidak pernah dimuat.
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
    const budgetValue = parseInt(newBudget);
    if (isNaN(budgetValue) || budgetValue <= 0) return;

    const session = await ensureSession();
    if (!session) return;

    // Upsert data (Update kalau ada, Insert kalau belum ada)
    const { error } = await supabase.from("wallets").upsert({
      user_id: session.user.id,
      monthly_budget: budgetValue,
      current_balance: budgetValue, // Saat set budget baru, saldo direset penuh
      last_updated: new Date().toISOString(),
    });

    if (!error) {
      setBudget(budgetValue);
      setBalance(budgetValue);
      setIsEditing(false);
      setNewBudget("");
    }
  };

  // Hitung persentase untuk progress bar
  const percentage = budget > 0 ? Math.max(0, Math.min(100, (balance / budget) * 100)) : 0;
  
  // Tentukan warna bar berdasarkan sisa saldo (Hijau -> Kuning -> Merah)
  const barColor = percentage > 50 ? "bg-emerald-500" : percentage > 20 ? "bg-amber-400" : "bg-rose-500";

  if (loading) return <div className="h-32 bg-slate-100 animate-pulse rounded-2xl"></div>;

  return (
    <MotionProvider>
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                  Sisa Saldo Makan
                </p>
                <h3 className="text-3xl font-bold text-slate-800 tracking-tight">
                  Rp {balance.toLocaleString("id-ID")}
                </h3>
              </div>
              <button 
                onClick={() => setIsEditing(!isEditing)}
                className="text-xs font-semibold text-sky-600 bg-sky-50 px-3 py-1.5 rounded-lg hover:bg-sky-100 transition-colors"
              >
                {isEditing ? "Batal" : "Set Budget"}
              </button>
            </div>

            {isEditing ? (
              <m.form 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSetBudget} 
                className="flex gap-2 mt-4"
              >
                <input
                  type="number"
                  value={newBudget}
                  onChange={(e) => setNewBudget(e.target.value)}
                  placeholder="Contoh: 1500000"
                  className="flex-1 rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100"
                  required
                />
                <button 
                  type="submit" 
                  className="bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-slate-800"
                >
                  Simpan
                </button>
              </m.form>
            ) : (
              <div className="mt-5">
                <div className="flex justify-between text-xs font-medium text-slate-500 mb-2">
                  <span>Progress Bulan Ini</span>
                  <span>Rp {budget.toLocaleString("id-ID")}</span>
                </div>
                {/* Progress Bar */}
                <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden">
                  <m.div
                    initial={{ width: 0 }}
                    animate={{ width: `${percentage}%` }}
                    transition={{ duration: 1, ease: "easeOut" }}
                    className={`h-full rounded-full ${barColor}`}
                  />
                </div>
                {percentage <= 20 && budget > 0 && (
                  <p className="text-xs text-rose-500 font-medium mt-3 flex items-center gap-1">
                    ⚠️ Saldo menipis! Kurangi jajan mahal.
                  </p>
                )}
              </div>
            )}
          </div>
    </MotionProvider>
  );
}