import Link from "next/link";
import { notFound } from "next/navigation";

import { getRestaurantById } from "@/lib/supabase/queries";

/**
 * Halaman hasil yang bisa dibagikan.
 *
 * Isinya dibaca dari database berdasarkan id, bukan dari query string. Itu yang
 * membuat kartunya tidak bisa dipalsukan: tidak ada yang bisa menyebarkan
 * tautan yang menampilkan teks karangan di atas merek kita.
 */

type Params = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Params) {
  const { id } = await params;

  try {
    const restaurant = await getRestaurantById(id);
    if (!restaurant) return { title: "Hasil tidak ditemukan | Gacha Makan" };

    return {
      title: `${restaurant.name} | Gacha Makan`,
      description: `Hasil gacha hari ini: ${restaurant.name}. Coba punyamu.`,
    };
  } catch {
    // Metadata tidak boleh menjatuhkan halaman.
    return { title: "Gacha Makan" };
  }
}

export default async function HasilPage({ params }: Params) {
  const { id } = await params;
  const restaurant = await getRestaurantById(id);

  if (!restaurant) notFound();

  return (
    <main className="min-h-screen bg-slate-50 font-sans text-slate-800 flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">
          Gacha Makan hari ini
        </p>

        <div className="mt-4 rounded-2xl border-2 border-rose-100 bg-white p-6 shadow-sm">
          <div className="text-4xl" aria-hidden="true">
            🎲
          </div>
          <h1 className="mt-3 text-2xl font-bold leading-tight tracking-tight text-slate-900">
            {restaurant.name}
          </h1>

          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
              Rp {restaurant.price_tier?.toLocaleString("id-ID") ?? "—"}
            </span>
            <span className="rounded-lg border border-slate-100 bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">
              🍴 {restaurant.category ?? "Umum"}
            </span>
            <span className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700">
              🛡️ {restaurant.hygiene_score}
            </span>
          </div>
        </div>

        <Link
          href="/spin"
          className="mt-5 block w-full rounded-xl bg-rose-500 px-5 py-3.5 text-center text-sm font-bold text-white shadow-md shadow-rose-500/30 transition-transform active:scale-[0.98] hover:bg-rose-600"
        >
          Coba punyamu →
        </Link>

        <Link
          href={`/map?restaurant_id=${encodeURIComponent(restaurant.id)}`}
          className="mt-2.5 block w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-center text-sm font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          📍 Lihat di peta
        </Link>
      </div>
    </main>
  );
}
