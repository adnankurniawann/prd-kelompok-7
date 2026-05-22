"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

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

function hygieneLabel(score: number): string {
  if (score >= 85) return "AMAN";
  if (score >= 50) return "PERLU DICEK";
  return "TIDAK AMAN";
}

export default function BlindPage() {
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usedPreset, setUsedPreset] = useState<
    (typeof BLIND_PRESETS)[number] | null
  >(null);
  const [rollingPresetLabel, setRollingPresetLabel] = useState("--");

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
      return "Tekan tombol dan biarkan sistem memilih budget + radius secara acak.";
    return `Preset terakhir: ${usedPreset.label} • Rp ${usedPreset.budget.toLocaleString("id-ID")} • ${usedPreset.radius} m`;
  }, [usedPreset]);

  const runBlindSpin = async () => {
    setIsRolling(true);
    setError(null);
    setResult(null);
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

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-20">
      {/* STICKY HEADER - Konsisten dengan halaman lain */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 px-4 md:px-8 py-3 shadow-sm flex items-center gap-3">
        <Link
          href="/"
          className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all active:scale-95 font-bold"
        >
          ←
        </Link>
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">
          Blind Gacha
        </h1>
      </header>

      <div className="mx-auto max-w-6xl w-full px-4 md:px-8 pt-6 flex flex-col md:grid md:grid-cols-12 gap-6 lg:gap-8">
        {/* KOLOM KIRI: KONTROL BLIND GACHA */}
        <div className="md:col-span-6 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col gap-5 relative overflow-hidden">
            {/* Info Cara Main */}
            <div className="rounded-xl border border-sky-100 bg-sky-50 p-4">
              <p className="text-[10px] font-bold uppercase tracking-widest text-sky-600 mb-1">
                Cara main
              </p>
              <p className="text-sm font-medium leading-relaxed text-slate-600">
                Kamu tidak perlu repot set budget, radius, atau kategori. Sistem
                akan mengacak preset gaya makanmu dan langsung mencarikan
                restoran yang cocok.
              </p>
            </div>

            {/* Container Tombol Spin Besar */}
            <div className="relative flex flex-col items-center justify-center min-h-[300px] rounded-2xl border border-slate-100 bg-slate-50 py-8 overflow-hidden">
              {/* Animasi Gelombang Cincin ala Radar */}
              <motion.div
                className="absolute h-56 w-56 rounded-full border border-slate-300/50"
                animate={
                  isRolling
                    ? { scale: [1, 1.18, 1], opacity: [0.5, 0.1, 0.5] }
                    : { scale: 1, opacity: 0.3 }
                }
                transition={{
                  duration: 1.1,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />
              <motion.div
                className="absolute h-44 w-44 rounded-full border border-slate-400/40"
                animate={
                  isRolling
                    ? { scale: [1, 1.14, 1], opacity: [0.6, 0.2, 0.6] }
                    : { scale: 1, opacity: 0.4 }
                }
                transition={{
                  duration: 0.85,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
              />

              {/* Tombol Roll (Warna Slate Dark khas Blind Mode di Home) */}
              <motion.button
                type="button"
                onClick={runBlindSpin}
                disabled={isRolling}
                animate={
                  isRolling
                    ? { rotate: [0, 180, 360], scale: [1, 1.05, 1] }
                    : { rotate: 0, scale: 1 }
                }
                transition={
                  isRolling
                    ? { repeat: Infinity, duration: 1.0, ease: "linear" }
                    : { duration: 0.25 }
                }
                className="relative z-10 flex flex-col h-40 w-40 sm:h-44 sm:w-44 items-center justify-center rounded-full border-[6px] border-white bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-xl shadow-slate-900/20 disabled:opacity-90 active:scale-95 transition-all"
              >
                <span className="text-4xl mb-2">{isRolling ? "🎲" : "🎲"}</span>
                <span className="text-lg font-black tracking-tight drop-shadow-sm">
                  {isRolling ? "ROLLING..." : "BLIND ROLL"}
                </span>
              </motion.button>

              {/* Status Pemilihan Preset Live */}
              <div className="absolute bottom-4 left-4 right-4 rounded-xl border border-slate-200 bg-white/80 backdrop-blur px-3 py-2 text-center text-xs font-semibold text-slate-700 shadow-sm">
                {isRolling ? (
                  <span className="text-sky-600 animate-pulse">
                    Mengacak takdir: {rollingPresetLabel}...
                  </span>
                ) : (
                  "Tekan tombol di atas untuk mulai!"
                )}
              </div>
            </div>

            {/* Progress Bar Loading */}
            {isRolling && (
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <motion.div
                  className="h-full rounded-full bg-slate-800"
                  animate={{ x: ["-100%", "250%"] }}
                  transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                  style={{ width: "40%" }}
                />
              </div>
            )}

            {/* Info Hint Terakhir */}
            <p className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3 text-xs font-medium text-slate-500 text-center">
              {rollHint}
            </p>

            {/* Pesan Error */}
            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600 font-medium text-center">
                ⚠ {error}
              </div>
            )}
          </div>
        </div>

        {/* KOLOM KANAN: HASIL GACHA */}
        <div className="md:col-span-6 flex flex-col gap-6">
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                className="bg-white rounded-2xl border-2 border-emerald-100 shadow-sm p-6 md:p-8 relative overflow-hidden group hover:border-emerald-200 transition-colors h-full flex flex-col"
              >
                <div className="absolute top-0 right-0 p-5 opacity-10 text-6xl group-hover:rotate-12 group-hover:scale-110 group-hover:text-emerald-500 transition-all duration-500">
                  ✅
                </div>

                <div>
                  <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold uppercase tracking-widest border border-emerald-200 mb-4 shadow-inner">
                    Kejutan Didapat
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mb-3">
                    {result.name}
                  </h2>

                  <div className="flex flex-wrap gap-2.5 mt-3">
                    <span className="px-3.5 py-1.5 bg-slate-50 rounded-lg text-xs font-semibold text-slate-600 border border-slate-100">
                      Rp {result.price_tier.toLocaleString("id-ID")}
                    </span>
                    <span className="px-3.5 py-1.5 bg-slate-50 rounded-lg text-xs font-semibold text-slate-600 border border-slate-100">
                      📍 {formatMeters(result.distance)}
                    </span>
                    <span className="px-3.5 py-1.5 bg-slate-50 rounded-lg text-xs font-semibold text-slate-600 border border-slate-100">
                      🍴 {result.category ?? "Umum"}
                    </span>
                    <span className="px-3.5 py-1.5 bg-slate-50 rounded-lg text-xs font-semibold text-slate-600 border border-slate-100">
                      🛡️ Score: {result.hygiene_score}
                    </span>
                  </div>
                </div>

                <div className="mt-auto pt-8 flex flex-col sm:flex-row gap-4">
                  <Link
                    href={`/map?restaurant_id=${encodeURIComponent(result.id)}`}
                    className="flex-1 bg-slate-900 text-white py-3.5 rounded-xl text-center text-sm font-semibold shadow-sm transition-all hover:bg-slate-800 active:scale-[0.98]"
                  >
                    📍 Lihat di Peta
                  </Link>
                  <button
                    type="button"
                    onClick={runBlindSpin}
                    className="flex-1 border border-slate-200 py-3.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.98] hover:border-slate-300 transition-all"
                  >
                    🔄 Roll Ulang
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center flex flex-col items-center justify-center h-full min-h-[350px]"
              >
                <span className="text-5xl mb-4 opacity-50 grayscale">🎁</span>
                <h3 className="text-lg font-bold text-slate-800 mb-1">
                  Belum Ada Kejutan
                </h3>
                <p className="text-sm font-medium text-slate-500 max-w-sm leading-relaxed">
                  Tekan tombol BLIND ROLL di sebelah kiri, dan biarkan sistem
                  yang memilih takdir makan siangmu!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
