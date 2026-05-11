"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

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
  return value >= 1000 ? `${(value / 1000).toFixed(1)} km` : `${Math.round(value)} m`;
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
  const [usedPreset, setUsedPreset] = useState<(typeof BLIND_PRESETS)[number] | null>(null);
  const [rollingPresetLabel, setRollingPresetLabel] = useState("--");

  useEffect(() => {
    if (!isRolling) {
      return;
    }

    const ticker = window.setInterval(() => {
      const randomPreset = BLIND_PRESETS[Math.floor(Math.random() * BLIND_PRESETS.length)];
      setRollingPresetLabel(randomPreset.label);
    }, 120);

    return () => window.clearInterval(ticker);
  }, [isRolling]);

  const rollHint = useMemo(() => {
    if (!usedPreset) return "Tekan tombol dan biarkan sistem memilih budget + radius otomatis.";
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

    const pickedPreset = BLIND_PRESETS[Math.floor(Math.random() * BLIND_PRESETS.length)];
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
    <main
      className="min-h-screen text-white"
      style={{
        backgroundImage:
          "radial-gradient(circle at top, #1e1b4b 0%, #0f172a 42%, #020617 100%)",
      }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-3 py-4 sm:px-6 sm:py-5 lg:px-8">
        <header className="flex flex-col gap-3 rounded-3xl border border-white/10 bg-white/5 px-4 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-indigo-200">
              Blind Gacha
            </p>
            <h1 className="mt-1 text-xl font-black tracking-tight sm:text-3xl">
              Mode Kejutan Tanpa Pilih-Pilih.
            </h1>
          </div>
          <Link
            href="/"
            className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
          >
            Back home
          </Link>
        </header>

        <section className="mt-4 grid flex-1 gap-4 lg:grid-cols-[1fr_1fr] lg:gap-5">
          <div className="space-y-4 rounded-3xl border border-white/10 bg-white/4 p-4 sm:p-5">
            <div className="rounded-2xl border border-indigo-300/20 bg-indigo-400/10 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-indigo-100/80">Cara main</p>
              <p className="mt-2 text-sm leading-6 text-slate-200">
                Kamu tidak set budget, radius, atau kategori. Sistem memilih preset secara acak,
                lalu menjalankan spin otomatis.
              </p>
            </div>

            <div className="relative flex min-h-64 items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/5 py-8">
              <motion.div
                className="absolute h-56 w-56 rounded-full border border-violet-300/30"
                animate={isRolling ? { scale: [1, 1.18, 1], opacity: [0.5, 0.12, 0.5] } : { scale: 1, opacity: 0.35 }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              />
              <motion.div
                className="absolute h-44 w-44 rounded-full border border-indigo-300/20"
                animate={isRolling ? { scale: [1, 1.14, 1], opacity: [0.45, 0.18, 0.45] } : { scale: 1, opacity: 0.3 }}
                transition={{ duration: 0.85, repeat: Infinity, ease: "easeInOut" }}
              />

              <motion.button
                type="button"
                onClick={runBlindSpin}
                disabled={isRolling}
                animate={
                  isRolling
                    ? { rotate: [0, 180, 360], scale: [1, 1.06, 1] }
                    : { rotate: 0, scale: 1 }
                }
                transition={
                  isRolling
                    ? { repeat: Infinity, duration: 1.0, ease: "linear" }
                    : { duration: 0.25 }
                }
                className="relative z-10 flex h-40 w-40 items-center justify-center rounded-full border border-white/20 bg-linear-to-br from-violet-500 to-indigo-500 text-lg font-black shadow-[0_24px_70px_rgba(99,102,241,0.45)] disabled:cursor-not-allowed sm:h-44 sm:w-44 sm:text-xl"
              >
                {isRolling ? "ROLLING" : "BLIND ROLL"}
              </motion.button>

              <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-white/5 px-3 py-2 text-center text-xs font-semibold text-indigo-100">
                {isRolling ? `Memilih preset: ${rollingPresetLabel}` : "Tekan tombol untuk mulai blind spin"}
              </div>
            </div>

            {isRolling ? (
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-linear-to-r from-violet-400 via-indigo-300 to-cyan-300"
                  animate={{ x: ["-35%", "100%"] }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  style={{ width: "40%" }}
                />
              </div>
            ) : null}

            <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
              {rollHint}
            </p>

            {error ? (
              <p className="rounded-2xl border border-rose-300/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {error}
              </p>
            ) : null}
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/4 p-4 sm:p-5">
            {result ? (
              <div className="space-y-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4">
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-100/90">Hasil blind mode</p>
                <h2 className="text-3xl font-black leading-tight">{result.name}</h2>

                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className="rounded-full bg-white/10 px-3 py-1">
                    Rp {result.price_tier.toLocaleString("id-ID")}
                  </span>
                  <span className="rounded-full bg-white/10 px-3 py-1">{formatMeters(result.distance)}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1">{result.category ?? "Umum"}</span>
                  <span className="rounded-full bg-white/10 px-3 py-1">
                    {hygieneLabel(result.hygiene_score)} · {result.hygiene_score}
                  </span>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Link
                    href="/map"
                    className="rounded-2xl bg-white px-4 py-3 text-center text-sm font-semibold text-slate-950 transition hover:bg-slate-100"
                  >
                    Lihat di map
                  </Link>
                  <button
                    type="button"
                    onClick={runBlindSpin}
                    className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                  >
                    Roll lagi
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex h-full min-h-60 items-center justify-center rounded-2xl border border-dashed border-white/20 bg-white/5 p-5 text-center text-slate-300">
                Belum ada hasil. Tekan BLIND ROLL untuk mulai.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
