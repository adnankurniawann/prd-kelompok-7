"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { MotionProvider } from "@/components/motion/motion-provider";

type SpinResult = {
  id: string;
  name: string;
  category: string | null;
  price_tier: number;
  distance: number;
  hygiene_score: number;
};

const DEFAULT_LOCATION = { lat: -6.9262, lng: 107.7717 };
const MIN_ROLL_DURATION_MS = 1400;

const BLIND_PRESETS = [
  { label: "Hemat Aman", budget: 18000, radius: 1200 },
  { label: "Comfort", budget: 25000, radius: 1800 },
  { label: "Jelajah", budget: 32000, radius: 2800 },
  { label: "Mepet Banget", budget: 15000, radius: 900 },
] as const;

function formatMeters(value: number): string {
  return value >= 1000
    ? `${(value / 1000).toFixed(1)} km`
    : `${Math.round(value)} m`;
}

export default function BlindPage() {
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usedPreset, setUsedPreset] = useState<
    (typeof BLIND_PRESETS)[number] | null
  >(null);
  const [rollingPresetLabel, setRollingPresetLabel] = useState("--");
  
  // State tambahan untuk fitur potong saldo
  const [isConfirming, setIsConfirming] = useState(false);
  const [confirmMessage, setConfirmMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!isRolling) {
      return;
    }

    const ticker = window.setInterval(() => {
      const randomPreset =
        BLIND_PRESETS[Math.floor(Math.random() * BLIND_PRESETS.length)];
      setRollingPresetLabel(randomPreset.label);
    }, 120);

    return () => window.clearInterval(ticker);
  }, [isRolling]);

  const rollHint = useMemo(() => {
    if (!usedPreset)
      return "Tekan tombol, sistem akan memilih budget & radius secara rahasia.";
    return `Terakhir dipakai: ${usedPreset.label} • Rp ${usedPreset.budget.toLocaleString("id-ID")} • ${usedPreset.radius} m`;
  }, [usedPreset]);

  const runBlindSpin = async () => {
    setIsRolling(true);
    setError(null);
    setResult(null);
    setConfirmMessage(null); // Reset pesan konfirmasi setiap kali roll ulang

    const minRollDelay = new Promise<void>((resolve) => {
      window.setTimeout(resolve, MIN_ROLL_DURATION_MS);
    });

    let nextResult: SpinResult | null = null;
    let nextError: string | null = null;

    const pickedPreset =
      BLIND_PRESETS[Math.floor(Math.random() * BLIND_PRESETS.length)];
    setUsedPreset(pickedPreset);
    setRollingPresetLabel(pickedPreset.label);

    try {
      const response = await fetch("/api/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget: pickedPreset.budget,
          radius: pickedPreset.radius,
          user_lat: DEFAULT_LOCATION.lat,
          user_lng: DEFAULT_LOCATION.lng,
        }),
      });

      const payload = (await response.json()) as {
        data?: SpinResult;
        error?: string;
      };

      if (!response.ok) {
        nextError = payload.error ?? "Blind spin gagal dijalankan.";
      } else {
        nextResult = payload.data ?? null;
      }
    } catch {
      nextError = "Tidak bisa menjangkau API spin.";
    } finally {
      await minRollDelay;
      setError(nextError);
      setResult(nextResult);
      setIsRolling(false);
    }
  };

  // Fungsi tambahan untuk memotong saldo wallet
  const handleConfirmFood = async () => {
    if (!result) return;
    setIsConfirming(true);
    setConfirmMessage(null);

    try {
      const res = await fetch("/api/wallet/deduct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: result.price_tier }),
      });

      if (res.ok) {
        setConfirmMessage("✅ Selamat makan! Saldo berhasil dipotong.");
      } else {
        setConfirmMessage("⚠️ Gagal memotong saldo.");
      }
    } catch (err) {
      setConfirmMessage("⚠️ Terjadi kesalahan jaringan.");
    } finally {
      setIsConfirming(false);
    }
  };

  return (
    <MotionProvider>
          <main className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20 selection:bg-slate-800 selection:text-white">
            {/* Background Decor */}
            <div className="absolute top-0 inset-x-0 h-[400px] bg-gradient-to-b from-slate-200/50 via-slate-50 to-transparent z-0 pointer-events-none"></div>

            {/* STICKY HEADER */}
            <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 px-4 md:px-8 py-3 shadow-sm flex items-center gap-3">
              <Link
                href="/"
                className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-800 hover:text-white transition-all active:scale-95 font-bold"
              >
                ←
              </Link>
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">
                Blind Gacha
              </h1>
            </header>

            <div className="relative z-10 mx-auto max-w-6xl w-full px-4 md:px-8 pt-6 flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8">
        
              {/* KOLOM KIRI: KONTROL BLIND GACHA */}
              <div className="lg:col-span-5 flex flex-col gap-5">
                <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 flex flex-col gap-6 relative overflow-hidden">
            
                  {/* Judul & Info */}
                  <div>
                    <h2 className="text-xl font-black text-slate-900 tracking-tight">
                      Mode Uji Nyali
                    </h2>
                    <p className="text-sm font-medium leading-relaxed text-slate-500 mt-2">
                      Nggak usah pusing mikirin budget atau jarak. Biar sistem yang acak preset gaya makanmu hari ini.
                    </p>
                  </div>

                  {/* Container Tombol Spin Besar (Dark Theme) */}
                  <div className="relative flex flex-col items-center justify-center min-h-[320px] rounded-3xl bg-gradient-to-br from-slate-800 to-slate-950 py-8 overflow-hidden shadow-inner group">
                    {/* Dekorasi Cahaya di background kotak gelap */}
                    <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
              
                    {/* Animasi Gelombang Cincin ala Radar */}
                    <m.div
                      className="absolute h-56 w-56 rounded-full border border-slate-600/30"
                      animate={
                        isRolling
                          ? { scale: [1, 1.25, 1], opacity: [0.5, 0.1, 0.5] }
                          : { scale: 1, opacity: 0.2 }
                      }
                      transition={{
                        duration: 1.1,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <m.div
                      className="absolute h-44 w-44 rounded-full border border-slate-500/40"
                      animate={
                        isRolling
                          ? { scale: [1, 1.15, 1], opacity: [0.6, 0.2, 0.6] }
                          : { scale: 1, opacity: 0.3 }
                      }
                      transition={{
                        duration: 0.85,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />

                    {/* Tombol Roll Utama */}
                    <m.button
                      type="button"
                      onClick={runBlindSpin}
                      disabled={isRolling}
                      animate={
                        isRolling
                          ? { rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.05, 1] }
                          : { rotate: 0, scale: 1 }
                      }
                      transition={
                        isRolling
                          ? { repeat: Infinity, duration: 0.5, ease: "easeInOut" }
                          : { duration: 0.25 }
                      }
                      className="relative z-10 flex flex-col h-36 w-36 sm:h-40 sm:w-40 items-center justify-center rounded-full border-4 border-slate-700 bg-white text-slate-900 shadow-[0_0_40px_rgba(255,255,255,0.1)] disabled:opacity-90 active:scale-95 transition-all hover:shadow-[0_0_60px_rgba(255,255,255,0.2)] hover:border-slate-500"
                    >
                      <span className="text-4xl mb-1">{isRolling ? "🎲" : "🎲"}</span>
                      <span className="text-sm font-black tracking-widest uppercase">
                        {isRolling ? "Mengacak" : "Blind Roll"}
                      </span>
                    </m.button>

                    {/* Status Pemilihan Preset Live (Di dalam kotak gelap) */}
                    <div className="absolute bottom-5 left-5 right-5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-md px-3 py-2.5 text-center text-xs font-semibold text-slate-300 shadow-sm">
                      {isRolling ? (
                        <span className="text-white animate-pulse">
                          Mencari: {rollingPresetLabel}...
                        </span>
                      ) : (
                        "Tekan dadu untuk mulai!"
                      )}
                    </div>
                  </div>

                  {/* Info Hint Terakhir */}
                  <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 text-center">
                    <p className="text-xs font-semibold text-slate-600">
                      {rollHint}
                    </p>
                  </div>

                  {/* Daftar Preset (Biar visualnya penuh) */}
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-3 ml-1">
                      Kemungkinan Preset
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {BLIND_PRESETS.map((preset) => (
                        <div key={preset.label} className="rounded-lg border border-slate-100 bg-white p-2.5 text-center shadow-sm">
                          <p className="text-[10px] font-bold text-slate-700">{preset.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Pesan Error */}
                  {error && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 font-medium text-center">
                      ⚠ {error}
                    </div>
                  )}
                </div>
              </div>

              {/* KOLOM KANAN: HASIL GACHA */}
              <div className="lg:col-span-7 flex flex-col gap-6">
                <AnimatePresence mode="wait">
                  {result ? (
                    <m.div
                      key={result.id}
                      initial={{ opacity: 0, y: 15, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.98 }}
                      className="bg-white rounded-[2rem] border-2 border-slate-800 shadow-lg shadow-slate-900/5 p-6 md:p-8 relative overflow-hidden group h-full flex flex-col"
                    >
                      {/* Dekorasi Watermark Logo */}
                      <div className="absolute -top-10 -right-10 p-5 opacity-[0.03] text-[150px] rotate-12 pointer-events-none">
                        🎲
                      </div>

                      <div className="relative z-10">
                        <div className="inline-block px-3 py-1.5 bg-slate-800 text-white rounded-md text-[10px] font-bold uppercase tracking-widest mb-5 shadow-sm">
                          ✨ Kejutan Terpilih
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-tight">
                          {result.name}
                        </h2>
                      </div>

                      {/* Grid Stats yang bikin penuh layout */}
                      <div className="grid grid-cols-2 gap-3 mt-8 relative z-10">
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Budget Terpakai</p>
                          <p className="text-lg font-bold text-slate-800">Rp {result.price_tier.toLocaleString("id-ID")}</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Jarak Tempuh</p>
                          <p className="text-lg font-bold text-slate-800">📍 {formatMeters(result.distance)}</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Kategori</p>
                          <p className="text-lg font-bold text-slate-800">🍴 {result.category ?? "Umum"}</p>
                        </div>
                        <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 flex flex-col justify-center">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Skor Kebersihan</p>
                          <p className="text-lg font-bold text-emerald-600">🛡️ {result.hygiene_score} / 100</p>
                        </div>
                      </div>

                      {/* Tombol Aksi - DENGAN FITUR POTONG SALDO */}
                      <div className="mt-auto pt-8 flex flex-col gap-3 relative z-10">
                        {confirmMessage ? (
                          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold text-center shadow-sm">
                            {confirmMessage}
                          </div>
                        ) : (
                          <>
                            {/* Tombol Konfirmasi Makan & Potong Saldo */}
                            <button
                              onClick={handleConfirmFood}
                              disabled={isConfirming}
                              className="w-full bg-rose-500 text-white py-4 rounded-xl text-center text-sm font-bold shadow-md shadow-rose-500/30 transition-all hover:bg-rose-600 active:scale-[0.98] disabled:opacity-70 flex justify-center items-center gap-2"
                            >
                              {isConfirming ? "Memproses..." : `🍽️ Konfirmasi Makan di Sini (- Rp ${result.price_tier.toLocaleString("id-ID")})`}
                            </button>

                            <div className="flex flex-col sm:flex-row gap-4">
                              <Link
                                href={`/map?restaurant_id=${encodeURIComponent(result.id)}`}
                                className="flex-1 flex items-center justify-center gap-2 bg-slate-900 py-4 rounded-xl text-sm font-semibold !text-white shadow-md transition-all hover:bg-slate-800 active:scale-[0.98]"
                              >
                                <span className="text-base">📍</span> <span className="!text-white">Lihat di Radar Peta</span>
                              </Link>
                              <button
                                type="button"
                                onClick={runBlindSpin}
                                className="flex-1 flex items-center justify-center gap-2 border-2 border-slate-200 bg-white py-4 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 active:scale-[0.98] hover:border-slate-300 transition-all"
                              >
                                <span className="text-base">🔄</span> Coba Acak Lagi
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </m.div>
                  ) : (
                    <m.div
                      key="empty-state"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white rounded-[2rem] border-2 border-dashed border-slate-200 p-10 text-center flex flex-col items-center justify-center h-full min-h-[400px]"
                    >
                      <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6 border border-slate-100">
                        <span className="text-5xl grayscale opacity-60">🎁</span>
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">
                        Belum Ada Kejutan
                      </h3>
                      <p className="text-sm font-medium text-slate-500 max-w-sm leading-relaxed">
                        Tekan tombol dadu <strong className="text-slate-700">Blind Roll</strong> di sebelah kiri, dan biarkan takdir yang memilih menu makan siangmu hari ini!
                      </p>
                    </m.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </main>
    </MotionProvider>
  );
}