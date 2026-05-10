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

  const sortedRestaurants = useMemo(
    () => [...filteredRestaurants].sort((left, right) => right.hygiene_score - left.hygiene_score),
    [filteredRestaurants]
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
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between gap-4 rounded-4xl border border-white/70 bg-white/80 px-5 py-4 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-600">
              Map
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
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
              className="rounded-full border border-slate-200 bg-slate-950 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Back home
            </Link>
          </div>
        </header>

        <section className="mt-6 grid flex-1 gap-6 xl:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-5 rounded-4xl border border-slate-200 bg-white/85 p-5 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
              <label className="space-y-2">
                <span className="text-sm font-semibold text-slate-800">Cari restoran</span>
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Ayam, warteg, sayang..."
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none transition focus:border-sky-300"
                />
              </label>
              <div className="space-y-2">
                <span className="text-sm font-semibold text-slate-800">Filter status</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["ALL", "All"],
                    ["GREEN", "Green"],
                    ["RED", "Red"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setStatusFilter(value as typeof statusFilter)}
                      className={`rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                        statusFilter === value
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-sky-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div
              className="relative overflow-hidden rounded-4xl border border-slate-200 p-5"
              style={{
                backgroundImage:
                  "radial-gradient(circle at center, rgba(14,165,233,0.15) 0%, rgba(255,255,255,0.65) 34%, rgba(255,255,255,0.92) 72%)",
              }}
            >
              <div
                className="absolute inset-0 opacity-35"
                style={{
                  backgroundImage:
                    "linear-gradient(transparent 49%, rgba(148,163,184,0.15) 50%, transparent 51%), linear-gradient(90deg, transparent 49%, rgba(148,163,184,0.15) 50%, transparent 51%)",
                  backgroundSize: "48px 48px",
                }}
              />
              <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300/50" />
              <div className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300/40" />
              <div className="absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full border border-sky-300/30" />

              <div className="relative min-h-112 overflow-hidden rounded-[1.6rem]">
                <div
                  className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-950 shadow-[0_0_0_12px_rgba(15,23,42,0.12)]"
                  title="Lokasi kamu"
                />

                {sortedRestaurants.map((restaurant) => (
                  <button
                    key={restaurant.id}
                    type="button"
                    onClick={() => setSelectedRestaurant(restaurant)}
                    className={`absolute flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold shadow-lg transition hover:scale-105 ${
                      restaurant.hygiene_status === "GREEN"
                        ? "border-emerald-400/30 bg-emerald-500 text-white"
                        : "border-rose-400/30 bg-rose-500 text-white"
                    } ${selectedRestaurant?.id === restaurant.id ? "ring-4 ring-sky-300/40" : ""}`}
                    style={plotPosition(userLat, userLng, restaurant.lat, restaurant.lng)}
                  >
                    <span className="inline-flex h-2.5 w-2.5 rounded-full bg-white/90" />
                    <span className="max-w-40 truncate">{restaurant.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {sortedRestaurants.slice(0, 3).map((restaurant) => (
                <button
                  key={restaurant.id}
                  type="button"
                  onClick={() => setSelectedRestaurant(restaurant)}
                  className={`rounded-3xl border p-4 text-left transition hover:-translate-y-0.5 ${
                    selectedRestaurant?.id === restaurant.id
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                    Top pick
                  </p>
                  <h3 className="mt-2 font-black">{restaurant.name}</h3>
                  <p className="mt-1 text-sm opacity-80">{restaurant.category ?? "Umum"}</p>
                </button>
              ))}
            </div>
          </div>

          <aside className="space-y-5 rounded-4xl border border-slate-200 bg-slate-950 p-5 text-white shadow-[0_24px_100px_rgba(15,23,42,0.24)]">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Detail restoran
              </p>
              <h2 className="mt-1 text-2xl font-black tracking-tight">
                {selectedRestaurant?.name ?? "Pilih marker di map"}
              </h2>
            </div>

            {isLoading ? (
              <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                Memuat restoran dari /api/restaurants...
              </div>
            ) : error ? (
              <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
                {error}
              </div>
            ) : selectedRestaurant ? (
              <div className="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap gap-2 text-xs font-semibold">
                  <span className={`rounded-full border px-3 py-1 ${statusTone(selectedRestaurant.hygiene_status)}`}>
                    {statusLabel(selectedRestaurant.hygiene_status)}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-slate-200">
                    Rp {selectedRestaurant.price_tier.toLocaleString()}
                  </span>
                  <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-slate-200">
                    {selectedRestaurant.category ?? "Umum"}
                  </span>
                </div>

                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-2xl bg-white/5 p-3">
                    <dt className="text-slate-400">Skor higienitas</dt>
                    <dd className="mt-1 text-lg font-black">{selectedRestaurant.hygiene_score}</dd>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-3">
                    <dt className="text-slate-400">Latitude</dt>
                    <dd className="mt-1 text-lg font-black">
                      {selectedRestaurant.lat.toFixed(4)}
                    </dd>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-3">
                    <dt className="text-slate-400">Longitude</dt>
                    <dd className="mt-1 text-lg font-black">
                      {selectedRestaurant.lng.toFixed(4)}
                    </dd>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-3">
                    <dt className="text-slate-400">Verified safe</dt>
                    <dd className="mt-1 text-lg font-black">
                      {selectedRestaurant.is_verified_safe ? "Yes" : "No"}
                    </dd>
                  </div>
                </dl>

                <label className="block space-y-2">
                  <span className="text-sm font-semibold text-slate-300">Catatan report</span>
                  <textarea
                    value={reportDescription}
                    onChange={(event) => setReportDescription(event.target.value)}
                    placeholder="Contoh: ada lalat di etalase, meja kurang bersih, atau kondisi aman"
                    rows={4}
                    className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300"
                  />
                </label>

                <div className="grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void sendReport("RED_FLAG")}
                    disabled={isSendingReport}
                    className="rounded-2xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-400 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Laporkan RED_FLAG
                  </button>
                  <button
                    type="button"
                    onClick={() => void sendReport("CLEAN")}
                    disabled={isSendingReport}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Laporkan CLEAN
                  </button>
                </div>

                {reportMessage ? (
                  <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-200">
                    {reportMessage}
                  </p>
                ) : null}
              </div>
            ) : null}

            <div className="rounded-3xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
              Radar ini tidak pakai map library berat. Marker dipetakan langsung dari
              koordinat yang keluar dari API, jadi cepat dan tetap sinkron dengan data backend.
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
