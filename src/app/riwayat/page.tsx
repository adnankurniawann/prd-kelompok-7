import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Riwayat spin dan daftar simpanan.
 *
 * Dua dari tiga fitur retensi yang direncanakan; filter tersimpan sudah hidup
 * di halaman spin lewat localStorage. Jangan tambah yang keempat sebelum
 * ketiganya terbukti terpakai.
 *
 * Dirender di server dengan sesi pengguna, jadi RLS yang menentukan apa yang
 * terlihat — bukan filter di kueri ini. Filter di sini hanya membuat maksudnya
 * terbaca tanpa harus membuka file policy.
 */

export const metadata = {
  title: "Riwayat | Gacha Makan",
  description: "Spin yang pernah kamu jalankan dan tempat yang kamu simpan.",
};

// Riwayat berubah tiap spin; tidak ada yang layak di-cache di sini.
export const dynamic = "force-dynamic";

interface HistoryRow {
  id: string;
  shown_at: string;
  action: string | null;
  distance_km: number;
  restaurants: { id: string; name: string; category: string | null } | null;
}

interface FavoriteRow {
  created_at: string;
  restaurants: { id: string; name: string; category: string | null } | null;
}

const ACTION_LABEL: Record<string, string> = {
  accepted: "Jadi ke sini",
  saved: "Disimpan",
  respun: "Spin lagi",
  ignored: "Nggak direspons",
};

function formatWhen(iso: string): string {
  return new Date(iso).toLocaleString("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function RiwayatPage() {
  const supabase = await createSupabaseServerClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-16 font-sans text-slate-800">
        <div className="mx-auto max-w-md text-center">
          <h1 className="text-xl font-black tracking-tight">Riwayat</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Sesi kamu belum siap. Coba buka halaman spin dulu, lalu balik ke
            sini.
          </p>
          <Link
            href="/spin"
            className="mt-6 inline-block rounded-xl bg-rose-500 px-5 py-3 text-sm font-bold text-white"
          >
            Ke halaman spin
          </Link>
        </div>
      </main>
    );
  }

  const [historyResult, favoriteResult] = await Promise.all([
    supabase
      .from("spin_events")
      .select("id, shown_at, action, distance_km, restaurants(id, name, category)")
      .order("shown_at", { ascending: false })
      .limit(30),
    supabase
      .from("favorites")
      .select("created_at, restaurants(id, name, category)")
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const history = (historyResult.data ?? []) as unknown as HistoryRow[];
  const favorites = (favoriteResult.data ?? []) as unknown as FavoriteRow[];

  return (
    <main className="min-h-screen bg-slate-50 px-5 py-8 font-sans text-slate-800">
      <div className="mx-auto max-w-md">
        <header className="flex items-center justify-between">
          <h1 className="text-xl font-black tracking-tight text-slate-900">
            Riwayat
          </h1>
          <Link
            href="/spin"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600"
          >
            Spin lagi
          </Link>
        </header>

        <section className="mt-7">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Tersimpan
          </h2>

          {favorites.length === 0 ? (
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Belum ada yang disimpan. Tekan &ldquo;Simpan buat nanti&rdquo; di
              hasil spin.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {favorites.map((row) => (
                <li
                  key={row.restaurants?.id ?? row.created_at}
                  className="rounded-xl border border-slate-100 bg-white px-4 py-3"
                >
                  <p className="text-sm font-semibold text-slate-800">
                    ⭐ {row.restaurants?.name ?? "Tempat tidak dikenal"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {row.restaurants?.category ?? "Umum"}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-9">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
            Spin terakhir
          </h2>

          {history.length === 0 ? (
            <p className="mt-3 text-sm leading-relaxed text-slate-400">
              Belum ada spin yang tercatat.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {history.map((row) => (
                <li
                  key={row.id}
                  className="rounded-xl border border-slate-100 bg-white px-4 py-3"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-semibold text-slate-800">
                      {row.restaurants?.name ?? "Tempat tidak dikenal"}
                    </p>
                    <span className="shrink-0 text-[11px] text-slate-400">
                      {formatWhen(row.shown_at)}
                    </span>
                  </div>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    {/* action null berarti jendela responsnya belum habis —
                        beda dari sudah diabaikan. */}
                    {row.action
                      ? (ACTION_LABEL[row.action] ?? row.action)
                      : "Menunggu"}{" "}
                    · {Number(row.distance_km).toFixed(1)} km
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
