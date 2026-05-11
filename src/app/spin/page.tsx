"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
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
const MIN_SPIN_DURATION_MS = 1300;

function formatMeters(value: number): string {
  return value >= 1000 ? `${(value / 1000).toFixed(1)} km` : `${Math.round(value)} m`;
}

function hygieneLabel(score: number): string {
  if (score >= 85) return "AMAN";
  if (score >= 50) return "PERLU DICEK";
  return "TIDAK AMAN";
}

export default function SpinPage() {
  const [budget, setBudget] = useState(20000);
  const [radius, setRadius] = useState(1500);
  const [lat, setLat] = useState(DEFAULT_LOCATION.lat);
  const [lng, setLng] = useState(DEFAULT_LOCATION.lng);
  const [isLocating, setIsLocating] = useState(false);
  const [isSpinning, setIsSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
      },
      () => {
        setError("Lokasi otomatis tidak tersedia, pakai koordinat default Jatinangor.");
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }, []);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Browser ini tidak mendukung geolocation.");
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
        setIsLocating(false);
      },
      () => {
        setError("Gagal mengambil lokasi perangkat.");
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  const handleSpin = async () => {
    setIsSpinning(true);
    setError(null);
    setResult(null);
    const minSpinDelay = new Promise<void>((resolve) => {
      window.setTimeout(resolve, MIN_SPIN_DURATION_MS);
    });

    let nextResult: SpinResult | null = null;
    let nextError: string | null = null;

    try {
      const response = await fetch("/api/spin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          budget,
          radius,
          user_lat: lat,
          user_lng: lng,
        }),
      });

      const payload = (await response.json()) as {
        data?: SpinResult;
        error?: string;
      };

      if (!response.ok) {
        nextError = payload.error ?? "Spin gagal dijalankan.";
      } else {
        nextResult = payload.data ?? null;
      }
    } catch {
      nextError = "Tidak bisa menjangkau API spin.";
    } finally {
      await minSpinDelay;
      setError(nextError);
      setResult(nextResult);
      setIsSpinning(false);
    }
  };

  return (
    <main
      className="min-h-screen text-slate-950"
      style={{
        backgroundImage:
          "radial-gradient(circle at top, #fff1f2 0%, #fff7ed 32%, #f8fafc 100%)",
      }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-107.5 flex-col px-3 py-4 sm:px-4 sm:py-5">
        <header className="flex flex-col gap-3 rounded-4xl border border-white/70 bg-white/80 px-4 py-4 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-500">
              Spin
            </p>
            <h1 className="mt-1 text-xl font-black tracking-tight sm:text-3xl">
              Gacha Makan yang benar-benar pakai backend.
            </h1>
          </div>
          <Link
            href="/"
            className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Back home
          </Link>
        </header>

        <section className="mt-4 grid flex-1 gap-4 sm:gap-6 lg:mt-6 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-5 rounded-4xl border border-slate-200 bg-white/85 p-5 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="rounded-3xl bg-slate-950 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Filter aktif
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                    Budget
                  </p>
                  <p className="mt-2 text-2xl font-black">Rp {budget.toLocaleString('id-ID')}</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                    Radius
                  </p>
                  <p className="mt-2 text-2xl font-black">{radius} m</p>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                    Lokasi
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6">
                    {lat.toFixed(4)}, {lng.toFixed(4)}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div>
                <label className="flex items-center justify-between text-sm font-semibold text-slate-800">
                  <span>Budget maksimal</span>
                  <span className="text-rose-500">Rp {budget.toLocaleString('id-ID')}</span>
                </label>
                <input
                  type="range"
                  min="10000"
                  max="50000"
                  step="1000"
                  value={budget}
                  onChange={(event) => setBudget(Number(event.target.value))}
                  className="mt-3 w-full accent-rose-500"
                />
              </div>

              <div>
                <label className="flex items-center justify-between text-sm font-semibold text-slate-800">
                  <span>Radius pencarian</span>
                  <span className="text-sky-600">{radius} m</span>
                </label>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="250"
                  value={radius}
                  onChange={(event) => setRadius(Number(event.target.value))}
                  className="mt-3 w-full accent-sky-500"
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-800">Latitude</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={lat}
                    onChange={(event) => setLat(Number(event.target.value))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-rose-300"
                  />
                </label>
                <label className="space-y-2">
                  <span className="text-sm font-semibold text-slate-800">Longitude</span>
                  <input
                    type="number"
                    step="0.0001"
                    value={lng}
                    onChange={(event) => setLng(Number(event.target.value))}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none ring-0 transition focus:border-rose-300"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={useCurrentLocation}
                disabled={isLocating}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-800 transition hover:border-rose-200 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLocating ? "Mencari lokasi..." : "Gunakan lokasi saya"}
              </button>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-slate-950 via-slate-900 to-slate-800 p-5 text-white shadow-[0_20px_80px_rgba(15,23,42,0.18)]">
              <p className="text-xs uppercase tracking-[0.3em] text-rose-50/80">
                Cara kerja
              </p>
              <p className="mt-2 text-lg font-black">Klik spin, backend yang pilih.</p>
              <p className="mt-2 text-sm leading-6 text-rose-50/90">
                Hasil sudah melewati filter hygiene score, budget, radius, lalu
                dipilih dengan bobot murah-terdekat.
              </p>
            </div>
          </div>

          <div className="space-y-5 rounded-4xl border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_24px_100px_rgba(15,23,42,0.24)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                  Spin center
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-tight">
                  Siap diputer.
                </h2>
              </div>
              <div className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                    Live seed
              </div>
            </div>

            <div
              className="relative flex items-center justify-center rounded-4xl border border-white/10 py-10"
              style={{
                backgroundImage:
                  "radial-gradient(circle, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.04) 45%, transparent 72%)",
              }}
            >
              <div className="absolute h-64 w-64 rounded-full border border-dashed border-white/15 sm:h-80 sm:w-80" />
              <div className="absolute h-48 w-48 rounded-full border border-white/10 sm:h-64 sm:w-64" />
              <motion.button
                type="button"
                animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
                transition={isSpinning ? { repeat: Infinity, duration: 0.75, ease: "linear" } : { duration: 0.25 }}
                onClick={handleSpin}
                disabled={isSpinning}
                className="relative z-10 flex h-36 w-36 items-center justify-center rounded-full border border-white/20 bg-linear-to-br from-rose-500 to-orange-400 text-lg font-black shadow-[0_24px_70px_rgba(244,63,94,0.4)] transition-transform disabled:cursor-not-allowed sm:h-44 sm:w-44 sm:text-2xl"
              >
                {isSpinning ? "SPINNING" : "SPIN NOW"}
              </motion.button>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-100">
              {error ? (
                <p className="rounded-2xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-rose-50">
                  {error}
                </p>
              ) : (
                <p className="leading-6">
                  Pilih budget dan radius, lalu tekan spin. Sistem akan ambil restoran yang paling cocok dari seed data.
                </p>
              )}
            </div>

            <AnimatePresence mode="wait">
              {result ? (
                <motion.div
                  key={result.id}
                  initial={{ opacity: 0, y: 20, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 20 }}
                  className="rounded-[1.75rem] border border-emerald-400/20 bg-emerald-400/10 p-5"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-200">
                    Hasil spin
                  </p>
                  <h3 className="mt-3 text-3xl font-black tracking-tight">
                    {result.name}
                  </h3>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-white/10 px-3 py-1">
                      Rp {result.price_tier.toLocaleString('id-ID')}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1">
                      {formatMeters(result.distance)}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1">
                      {result.category ?? "Kategori umum"}
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1">
                      {hygieneLabel(result.hygiene_score)} · {result.hygiene_score}
                    </span>
                  </div>
                  <div className="mt-5 grid gap-3 sm:grid-cols-2">
                    <Link
                      href="/map"
                      className="rounded-2xl border border-sky-400/30 bg-sky-400 px-4 py-3 text-center text-sm font-semibold text-slate-950 shadow-[0_12px_30px_rgba(56,189,248,0.18)] transition hover:bg-sky-300"
                    >
                      Cek di map
                    </Link>
                    <button
                      type="button"
                      onClick={handleSpin}
                      className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
                    >
                      Spin lagi
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="empty-state"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-[1.75rem] border border-white/10 bg-white/5 p-5 text-slate-300"
                >
                  <p className="text-sm leading-6">
                    Belum ada hasil. Jalankan spin untuk mendapatkan restoran dari data seed.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>
    </main>
  );
}
