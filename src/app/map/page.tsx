"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type Restaurant = {
  id: string;
  name: string;
  category: string | null;
  price_tier: number;
  hygiene_score: number;
  is_verified_safe: boolean;
  lat: number;
  lng: number;
  hygiene_status: "RED" | "GREEN";
};

const DEFAULT_LOCATION = { lat: -6.9262, lng: 107.7717 };

function statusLabel(status: Restaurant["hygiene_status"]): string {
  return status === "GREEN" ? "AMAN" : "RED FLAG";
}

function statusTone(status: Restaurant["hygiene_status"]): string {
  return status === "GREEN"
    ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-100"
    : "border-rose-400/30 bg-rose-400/10 text-rose-100";
}

function plotPosition(userLat: number, userLng: number, lat: number, lng: number) {
  const x = Math.max(-42, Math.min(42, (lng - userLng) * 9000));
  const y = Math.max(-42, Math.min(42, (lat - userLat) * -9000));

  return {
    left: `calc(50% + ${x}%)`,
    top: `calc(50% + ${y}%)`,
  };
}

export default function MapPage() {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "GREEN" | "RED">("ALL");
  const [reportDescription, setReportDescription] = useState("");
  const [reportMessage, setReportMessage] = useState<string | null>(null);
  const [isSendingReport, setIsSendingReport] = useState(false);
  const [userLat, setUserLat] = useState(DEFAULT_LOCATION.lat);
  const [userLng, setUserLng] = useState(DEFAULT_LOCATION.lng);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState<number | null>(5000); // 5 seconds
  const [isPickerOpen, setIsPickerOpen] = useState(false);

  const loadRestaurants = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/restaurants", { cache: "no-store" });
      const payload = (await response.json()) as {
        data?: Restaurant[];
        error?: string;
      };

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to fetch restaurants");
      }

      const nextRestaurants = payload.data ?? [];
      setRestaurants(nextRestaurants);
      setSelectedRestaurant((current) => current ?? nextRestaurants[0] ?? null);
    } catch (fetchError) {
      setError(fetchError instanceof Error ? fetchError.message : "Failed to fetch restaurants");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!autoRefreshInterval) return;

    const timer = setInterval(() => {
      void loadRestaurants();
    }, autoRefreshInterval);

    return () => clearInterval(timer);
  }, [autoRefreshInterval]);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      void loadRestaurants();
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLat(position.coords.latitude);
        setUserLng(position.coords.longitude);
      },
      () => undefined,
      { enableHighAccuracy: true, timeout: 6000 }
    );
  }, []);

  const filteredRestaurants = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return restaurants.filter((restaurant) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        restaurant.name.toLowerCase().includes(normalizedQuery) ||
        (restaurant.category ?? "").toLowerCase().includes(normalizedQuery);
      const matchesStatus = statusFilter === "ALL" || restaurant.hygiene_status === statusFilter;

      return matchesQuery && matchesStatus;
    });
  }, [query, restaurants, statusFilter]);

  const uniqueRestaurants = useMemo(() => {
    const seen = new Set<string>();
    return filteredRestaurants.filter((restaurant) => {
      const key = `${restaurant.name}|${restaurant.category ?? ""}|${restaurant.price_tier}|${restaurant.hygiene_score}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }, [filteredRestaurants]);

  const sortedRestaurants = useMemo(
    () => [...uniqueRestaurants].sort((left, right) => right.hygiene_score - left.hygiene_score),
    [uniqueRestaurants]
  );

  const sendReport = async (reportType: "RED_FLAG" | "CLEAN") => {
    if (!selectedRestaurant) {
      return;
    }

    setIsSendingReport(true);
    setReportMessage(null);

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          restaurant_id: selectedRestaurant.id,
          report_type: reportType,
          description: reportDescription.trim() || undefined,
        }),
      });

      const payload = (await response.json()) as { data?: Restaurant; error?: string };

      if (!response.ok) {
        setReportMessage(payload.error ?? "Gagal mengirim report.");
        return;
      }

      setReportMessage(
        reportType === "RED_FLAG"
          ? "Report RED_FLAG terkirim dan skor higienitas diperbarui."
          : "Report CLEAN terkirim dan skor higienitas naik jika valid."
      );
      setReportDescription("");
      await loadRestaurants();
    } catch {
      setReportMessage("Tidak bisa menjangkau API report.");
    } finally {
      setIsSendingReport(false);
    }
  };

  return (
    <main
      className="min-h-screen text-slate-950"
      style={{
        backgroundImage:
          "radial-gradient(circle at top, #ecfeff 0%, #f8fafc 36%, #fff1f2 100%)",
      }}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-107.5 flex-col px-3 py-4 sm:px-4 sm:py-5">
        <header className="flex flex-col gap-3 rounded-4xl border border-white/70 bg-white/80 px-4 py-4 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
              Map
            </p>
            <h1 className="mt-1 text-xl font-black tracking-tight sm:text-3xl">
              Radar higienitas Jatinangor.
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void loadRestaurants()}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-sky-200 hover:text-sky-700"
            >
              Refresh
            </button>
            <Link
              href="/"
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Back home
            </Link>
          </div>
        </header>

        <section className="mt-4 grid flex-1 gap-4 sm:gap-6 lg:mt-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="flex flex-col gap-5 rounded-4xl border border-slate-200 bg-white/85 p-6 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            {/* Search & Filter Section */}
            <div className="space-y-3">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
                <label className="flex-1 space-y-2">
                  <span className="text-sm font-semibold text-slate-800">Cari restoran</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Ayam, warteg, sayang..."
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-300 focus:bg-white"
                  />
                </label>
                <div className="space-y-2">
                  <span className="block text-sm font-semibold text-slate-800">Auto-refresh</span>
                  <select
                    value={autoRefreshInterval ?? ""}
                    onChange={(e) => setAutoRefreshInterval(e.target.value ? parseInt(e.target.value) : null)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 outline-none transition focus:border-sky-300"
                  >
                    <option value="">Off</option>
                    <option value="2000">2s</option>
                    <option value="5000">5s</option>
                    <option value="10000">10s</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <span className="block text-sm font-semibold text-slate-800">Status</span>
                  <div className="flex gap-2">
                    {[
                      ["ALL", "Semua"],
                      ["GREEN", "✓ Aman"],
                      ["RED", "⚠ Hati-hati"],
                    ].map(([value, label]) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setStatusFilter(value as typeof statusFilter)}
                        className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                          statusFilter === value
                            ? "border-slate-950 bg-slate-950 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-sky-200 hover:bg-sky-50"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                {sortedRestaurants.length} restoran ditemukan
              </p>
            </div>

            {/* Radar Visualization - More Compact */}
            <div
              className="relative overflow-hidden rounded-3xl border border-slate-200 p-4"
              style={{
                backgroundImage:
                  "radial-gradient(circle at center, rgba(14,165,233,0.12) 0%, rgba(255,255,255,0.7) 40%, rgba(255,255,255,0.95) 75%)",
              }}
            >
              <div
                className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage:
                    "linear-gradient(transparent 49%, rgba(148,163,184,0.1) 50%, transparent 51%), linear-gradient(90deg, transparent 49%, rgba(148,163,184,0.1) 50%, transparent 51%)",
                  backgroundSize: "40px 40px",
                }}
              />
              <div className="absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300/40" />
              <div className="absolute left-1/2 top-1/2 h-36 w-36 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300/30" />

              <div className="relative min-h-80 overflow-hidden rounded-2xl">
                <div
                  className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-950 shadow-[0_0_0_10px_rgba(15,23,42,0.1)]"
                  title="Lokasi kamu"
                />

                {sortedRestaurants.map((restaurant) => (
                  <button
                    key={restaurant.id}
                    type="button"
                    onClick={() => setSelectedRestaurant(restaurant)}
                    className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border px-2.5 py-1.5 text-xs font-bold shadow-md transition hover:scale-110 ${
                      restaurant.hygiene_status === "GREEN"
                        ? "border-emerald-400/40 bg-emerald-500/90 text-white"
                        : "border-rose-400/40 bg-rose-500/90 text-white"
                    } ${selectedRestaurant?.id === restaurant.id ? "ring-4 ring-sky-400/50 scale-125" : ""}`}
                    style={plotPosition(userLat, userLng, restaurant.lat, restaurant.lng)}
                  >
                    <span className="inline-flex h-1.5 w-1.5 rounded-full bg-white/80 mr-1" />
                    <span className="max-w-32 truncate">{restaurant.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Restaurant Mobile Picker */}
            <div className="space-y-3 rounded-3xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="space-y-2">
                <span className="block text-sm font-semibold text-slate-800">
                  Pilih restoran (drop list)
                </span>
                <button
                  type="button"
                  onClick={() => setIsPickerOpen(true)}
                  disabled={isLoading || sortedRestaurants.length === 0}
                  className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-semibold text-slate-800 outline-none transition hover:border-sky-300 disabled:cursor-not-allowed disabled:bg-slate-100"
                >
                  <span className="truncate">
                    {selectedRestaurant
                      ? `${selectedRestaurant.name} - ${selectedRestaurant.hygiene_score}`
                      : "Pilih restoran"}
                  </span>
                  <span className="text-slate-500">▾</span>
                </button>
              </div>

              {isLoading ? (
                <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                  Memuat restoran...
                </p>
              ) : sortedRestaurants.length === 0 ? (
                <p className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-500">
                  Tidak ada restoran yang cocok.
                </p>
              ) : selectedRestaurant ? (
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <p className="text-sm font-black text-slate-900">{selectedRestaurant.name}</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold">
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                      {selectedRestaurant.category ?? "Umum"}
                    </span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                      Rp {selectedRestaurant.price_tier.toLocaleString('id-ID')}
                    </span>
                    <span className={`rounded-full px-2.5 py-1 ${
                      selectedRestaurant.hygiene_status === "GREEN"
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-rose-100 text-rose-800"
                    }`}>
                      {selectedRestaurant.hygiene_status === "GREEN" ? "✓" : "⚠"} {selectedRestaurant.hygiene_score}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          {isPickerOpen ? (
            <div className="fixed inset-0 z-50 flex items-end bg-slate-950/45">
              <div className="w-full rounded-t-3xl border border-slate-200 bg-white p-4 shadow-[0_-24px_70px_rgba(15,23,42,0.22)]">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-black text-slate-900">Pilih restoran</p>
                  <button
                    type="button"
                    onClick={() => setIsPickerOpen(false)}
                    className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700"
                  >
                    Tutup
                  </button>
                </div>
                <div className="max-h-80 space-y-2 overflow-y-auto pr-1">
                  {sortedRestaurants.map((restaurant) => (
                    <button
                      key={restaurant.id}
                      type="button"
                      onClick={() => {
                        setSelectedRestaurant(restaurant);
                        setIsPickerOpen(false);
                      }}
                      className={`w-full rounded-2xl border px-3 py-3 text-left transition ${
                        selectedRestaurant?.id === restaurant.id
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-900"
                      }`}
                    >
                      <p className="truncate text-sm font-bold">{restaurant.name}</p>
                      <div className="mt-1 flex items-center gap-2 text-xs opacity-80">
                        <span>{restaurant.category ?? "Umum"}</span>
                        <span>•</span>
                        <span>Rp {restaurant.price_tier.toLocaleString('id-ID')}</span>
                        <span>•</span>
                        <span>{restaurant.hygiene_status === "GREEN" ? "✓" : "⚠"} {restaurant.hygiene_score}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : null}

          <aside className="flex flex-col gap-5 rounded-4xl border border-slate-200 bg-linear-to-br from-slate-950 to-slate-900 p-6 text-white shadow-[0_24px_100px_rgba(15,23,42,0.24)]">
            {/* Header */}
            <div className="border-b border-white/10 pb-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Detail Restoran
              </p>
              <h2 className="mt-2 text-3xl font-black tracking-tight leading-tight">
                {selectedRestaurant?.name ?? "Pilih restoran"}
              </h2>
            </div>

            {isLoading ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                Memuat restoran dari API...
              </div>
            ) : error ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-200">
                <strong>Error:</strong> {error}
              </div>
            ) : selectedRestaurant ? (
              <div className="flex-1 space-y-5 overflow-y-auto">
                {/* Status & Info Badges */}
                <div className="flex flex-wrap gap-2">
                  <span className={`rounded-full border px-3 py-2 text-xs font-semibold ${statusTone(selectedRestaurant.hygiene_status)}`}>
                    {statusLabel(selectedRestaurant.hygiene_status)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-200">
                    Rp {selectedRestaurant.price_tier.toLocaleString('id-ID')}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-2 text-xs font-semibold text-slate-200">
                    {selectedRestaurant.category ?? "Umum"}
                  </span>
                </div>

                {/* Statistics Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <dt className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Skor Higienitas</dt>
                    <dd className="mt-2 text-3xl font-black text-sky-300">{selectedRestaurant.hygiene_score}</dd>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <dt className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Status Verified</dt>
                    <dd className="mt-2 text-2xl font-black">
                      {selectedRestaurant.is_verified_safe ? "✓" : "✗"}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <dt className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Latitude</dt>
                    <dd className="mt-2 text-sm font-mono text-slate-300">
                      {selectedRestaurant.lat.toFixed(4)}
                    </dd>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <dt className="text-xs uppercase tracking-widest text-slate-400 font-semibold">Longitude</dt>
                    <dd className="mt-2 text-sm font-mono text-slate-300">
                      {selectedRestaurant.lng.toFixed(4)}
                    </dd>
                  </div>
                </div>

                {/* Report Section */}
                <div className="border-t border-white/10 pt-4">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-white">Catatan Report</span>
                    <textarea
                      value={reportDescription}
                      onChange={(event) => setReportDescription(event.target.value)}
                      placeholder="Contoh: ada lalat di etalase, meja kurang bersih, atau kondisi aman"
                      rows={4}
                      className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300 focus:bg-white/10"
                    />
                  </label>

                  <div className="mt-3 grid gap-2">
                    <button
                      type="button"
                      onClick={() => void sendReport("RED_FLAG")}
                      disabled={isSendingReport}
                      className="rounded-xl border border-rose-500/50 bg-rose-500/20 px-4 py-3 text-sm font-bold text-rose-100 transition hover:bg-rose-500/30 hover:border-rose-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ⚠ Laporkan RED_FLAG
                    </button>
                    <button
                      type="button"
                      onClick={() => void sendReport("CLEAN")}
                      disabled={isSendingReport}
                      className="rounded-xl border border-emerald-500/50 bg-emerald-500/20 px-4 py-3 text-sm font-bold text-emerald-100 transition hover:bg-emerald-500/30 hover:border-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      ✓ Laporkan CLEAN
                    </button>
                  </div>

                  {reportMessage ? (
                    <p className="mt-3 rounded-xl border border-sky-400/30 bg-sky-400/10 px-4 py-3 text-xs text-sky-100">
                      {reportMessage}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-slate-400">
                <p className="text-sm">Pilih restoran dari radar atau daftar untuk melihat detail dan mengirim laporan.</p>
              </div>
            )}

            {/* Footer Info */}
            <div className="border-t border-white/10 pt-4">
              <p className="text-xs leading-relaxed text-slate-400">
                <span className="font-semibold text-slate-300">💡 Tip:</span> Radar ini menampilkan posisi geografis real-time dari koordinat database. Klik marker untuk detail, atau gunakan daftar restoran di sebelah kiri.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
