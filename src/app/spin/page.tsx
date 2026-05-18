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
  return value >= 1000
    ? `${(value / 1000).toFixed(1)} km`
    : `${Math.round(value)} m`;
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
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude);
        setLng(position.coords.longitude);
      },
      () => {
        setError(
          "Lokasi tidak tersedia, menggunakan koordinat default Jatinangor.",
        );
      },
      { enableHighAccuracy: true, timeout: 6000 },
    );
  }, []);

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError("Browser tidak mendukung geolocation.");
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
      { enableHighAccuracy: true, timeout: 6000 },
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
        body: JSON.stringify({ budget, radius, user_lat: lat, user_lng: lng }),
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

  // Logika kalkulasi panjang warna untuk slider (Progress bar warna)
  const budgetPercent = ((budget - 10000) / (50000 - 10000)) * 100;
  const radiusPercent = ((radius - 500) / (5000 - 500)) * 100;

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-50 font-sans text-slate-900 pb-16 selection:bg-rose-500 selection:text-white">
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-rose-100/50 via-slate-50 to-transparent z-0 pointer-events-none"></div>

      {/* STICKY HEADER - Bersih & Rapi tanpa label aneh */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-slate-200/60 px-4 md:px-8 py-3 shadow-sm flex items-center gap-3">
        <Link
          href="/"
          className="w-9 h-9 bg-slate-100 rounded-xl flex items-center justify-center text-slate-600 hover:bg-rose-50 hover:text-rose-500 transition-all active:scale-95 font-bold"
        >
          ←
        </Link>
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">
          Spin Gacha
        </h1>
      </header>

      <div className="relative z-10 mx-auto max-w-6xl w-full px-4 md:px-8 pt-6 flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8">
        {/* KOLOM KIRI: FILTERS */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Active Filter Summary */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-950 rounded-2xl p-6 text-white shadow-lg shadow-slate-900/10 relative overflow-hidden group">
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/5 rounded-full blur-xl"></div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-slate-400 mb-4">
              Parameter Aktif
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400">Budget</p>
                <p className="text-2xl font-bold tracking-tight text-white/95">
                  Rp {budget.toLocaleString("id-ID")}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] text-slate-400">Radius</p>
                <p className="text-2xl font-bold tracking-tight text-white/95">
                  {radius} m
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-white/10">
              <p className="text-[10px] text-slate-400 mb-1 tracking-wider uppercase font-medium">
                Kordinat GPS
              </p>
              <p className="text-xs font-medium text-slate-200">
                {lat.toFixed(5)}, {lng.toFixed(5)}
              </p>
            </div>
          </div>

          {/* Control Panel - Dengan Slider Custom Berwarna */}
          <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm space-y-6">
            {/* Slider Budget Custom */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-slate-700">
                  Budget Maksimal
                </span>
                <span className="text-sm font-bold text-rose-500">
                  Rp {budget.toLocaleString("id-ID")}
                </span>
              </div>
              <div className="relative w-full h-2.5 bg-slate-100 rounded-full mt-3">
                <div
                  className="absolute top-0 left-0 h-full bg-rose-500 rounded-full"
                  style={{ width: `${budgetPercent}%` }}
                ></div>
                <input
                  type="range"
                  min="10000"
                  max="50000"
                  step="1000"
                  value={budget}
                  onChange={(e) => setBudget(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-rose-500 rounded-full shadow-md border-[3px] border-white pointer-events-none transition-transform"
                  style={{ left: `calc(${budgetPercent}% - 10px)` }}
                ></div>
              </div>
            </div>

            {/* Slider Radius Custom */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-semibold text-slate-700">
                  Radius Pencarian
                </span>
                <span className="text-sm font-bold text-sky-500">
                  {radius} meter
                </span>
              </div>
              <div className="relative w-full h-2.5 bg-slate-100 rounded-full mt-3">
                <div
                  className="absolute top-0 left-0 h-full bg-sky-500 rounded-full"
                  style={{ width: `${radiusPercent}%` }}
                ></div>
                <input
                  type="range"
                  min="500"
                  max="5000"
                  step="250"
                  value={radius}
                  onChange={(e) => setRadius(Number(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div
                  className="absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-sky-500 rounded-full shadow-md border-[3px] border-white pointer-events-none transition-transform"
                  style={{ left: `calc(${radiusPercent}% - 10px)` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="space-y-1.5 group">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1 group-hover:text-rose-500 transition-colors">
                  Latitude
                </span>
                <input
                  type="number"
                  step="0.0001"
                  value={lat}
                  onChange={(e) => setLat(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:ring-1 focus:ring-rose-200 focus:border-rose-200 focus:bg-white outline-none transition-all"
                />
              </div>
              <div className="space-y-1.5 group">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide ml-1 group-hover:text-rose-500 transition-colors">
                  Longitude
                </span>
                <input
                  type="number"
                  step="0.0001"
                  value={lng}
                  onChange={(e) => setLng(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm font-semibold text-slate-800 focus:ring-1 focus:ring-rose-200 focus:border-rose-200 focus:bg-white outline-none transition-all"
                />
              </div>
            </div>

            <button
              onClick={useCurrentLocation}
              disabled={isLocating}
              className="w-full py-3.5 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 hover:border-rose-100 hover:text-rose-600 active:bg-rose-50"
            >
              <span className="text-base">{isLocating ? "🌀" : "📍"}</span>
              {isLocating ? "Mencari Lokasi..." : "Deteksi Lokasi Saya"}
            </button>
          </div>
        </div>

        {/* KOLOM KANAN: SPIN ACTION & RESULT */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-10 flex flex-col items-center justify-center relative overflow-hidden min-h-[360px]">
            {/* Animasi Ring Cincin Muter PERSIS HTML (Pakai Motion.div untuk Wobble) */}
            <motion.div
              key={isSpinning ? "spinning" : "idle"}
              className="absolute top-1/2 left-1/2 w-48 h-48 sm:w-56 sm:h-56 rounded-full border-4 border-dashed border-rose-200 pointer-events-none opacity-80"
              initial={{ x: "-50%", y: "-50%" }}
              animate={
                isSpinning
                  ? {
                      rotate: 1080, // Muter ngebut
                      x: ["-50%", "-51%", "-49%", "-50%"], // Efek wobble (oleng)
                      y: ["-50%", "-49%", "-51%", "-50%"],
                    }
                  : {
                      rotate: 0,
                      x: "-50%",
                      y: "-50%",
                    }
              }
              transition={
                isSpinning
                  ? {
                      rotate: { duration: 2, ease: "easeInOut" },
                      x: { duration: 0.1, repeat: 20 },
                      y: { duration: 0.1, repeat: 20 },
                    }
                  : { duration: 0 }
              }
            />

            {/* Tombol Spin PERSIS HTML */}
            <motion.button
              onClick={handleSpin}
              disabled={isSpinning}
              animate={isSpinning ? { scale: [0.95, 1, 0.95] } : { scale: 1 }}
              transition={
                isSpinning
                  ? { repeat: Infinity, duration: 1 }
                  : { duration: 0.2 }
              }
              className="relative z-10 w-40 h-40 sm:w-44 sm:h-44 rounded-full bg-gradient-to-b from-rose-400 to-rose-600 shadow-xl shadow-rose-500/40 text-white font-bold text-2xl flex flex-col items-center justify-center border-4 border-white active:scale-95 transition-all disabled:opacity-90"
            >
              {/* Ikon Alat Makan Muter saat Spin */}
              <motion.div
                animate={isSpinning ? { rotate: 1080 } : { rotate: 0 }}
                transition={
                  isSpinning
                    ? { duration: 2, ease: [0.25, 0.1, 0.25, 1] }
                    : { duration: 0 }
                }
                className="text-4xl mb-2"
              >
                🍽️
              </motion.div>
              SPIN!
            </motion.button>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 w-full max-w-sm p-4 bg-rose-50 border border-rose-100 rounded-xl text-center shadow-sm"
              >
                <p className="text-sm font-semibold text-rose-600 leading-snug">
                  ⚠️ {error}
                </p>
              </motion.div>
            )}
          </div>

          {/* RESULT AREA */}
          <AnimatePresence mode="wait">
            {result ? (
              <motion.div
                key={result.id}
                initial={{ opacity: 0, y: 15, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.98 }}
                className="bg-white rounded-2xl border-2 border-emerald-100 shadow-sm p-6 relative overflow-hidden group hover:border-emerald-200 transition-colors"
              >
                <div className="absolute top-0 right-0 p-5 opacity-10 text-6xl group-hover:rotate-12 group-hover:scale-110 group-hover:text-emerald-500 transition-all duration-500">
                  ✅
                </div>
                <div className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 rounded-md text-[10px] font-bold uppercase tracking-widest border border-emerald-200 mb-4 shadow-inner">
                  Hasil Gacha Terpilih
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mb-2">
                  {result.name}
                </h3>
                <div className="flex flex-wrap gap-2.5 mt-3">
                  <span className="px-3.5 py-1.5 bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 border border-slate-100">
                    Rp {result.price_tier.toLocaleString("id-ID")}
                  </span>
                  <span className="px-3.5 py-1.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 border border-slate-100">
                    📍 {formatMeters(result.distance)}
                  </span>
                  <span className="px-3.5 py-1.5 bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 border border-slate-100">
                    🍴 {result.category ?? "Umum"}
                  </span>
                  <span className="px-3.5 py-1.5 bg-slate-100 rounded-lg text-xs font-semibold text-slate-700 border border-slate-100">
                    🛡️ Score: {result.hygiene_score}
                  </span>
                </div>

                <div className="mt-7 flex flex-col sm:flex-row gap-4">
                  <Link
                    href="/map"
                    className="flex-1 bg-slate-800 text-white py-3.5 rounded-xl text-center text-sm font-semibold shadow-sm transition-all hover:bg-slate-900 active:scale-[0.98]"
                  >
                    📍 Lihat di Radar Map
                  </Link>
                  <button
                    onClick={handleSpin}
                    className="flex-1 border border-slate-200 py-3.5 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-50 active:scale-[0.98] hover:border-slate-300 hover:text-slate-700 transition-all"
                  >
                    🔄 Spin Ulang Takdir
                  </button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-10 text-center flex flex-col items-center justify-center min-h-[200px]"
              >
                <span className="text-4xl mb-4 opacity-50">🎲</span>
                <p className="text-sm font-medium text-slate-400 max-w-sm leading-relaxed">
                  Belum ada hasil spin takdir. Silakan atur budget dan radius
                  pencarian, lalu tekan tombol SPIN di atas!
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </main>
  );
}
