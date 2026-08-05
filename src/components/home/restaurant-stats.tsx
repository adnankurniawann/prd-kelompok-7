import { getRestaurantStats } from "@/lib/supabase/queries";

/**
 * Ringkasan isi katalog.
 *
 * Sebelumnya tiga kartu gradien penuh warna — indigo-biru, emerald, dan rose —
 * dengan emoji besar dan efek melayang saat disentuh. Dua masalahnya:
 *
 *   1. Indigo dan biru tidak ada di palet aplikasi ini sama sekali. Keduanya
 *      datang entah dari mana dan langsung jadi hal paling mencolok di
 *      halaman.
 *   2. Angka-angka ini yang paling keras berteriak, padahal ia yang paling
 *      tidak menolong. Tidak ada yang memutuskan mau makan di mana karena
 *      tahu katalognya berisi 30 restoran.
 *
 * Sekarang satu baris tenang berisi tiga angka. Informasinya utuh, tapi ia
 * berhenti bersaing dengan hal-hal yang benar-benar dipakai orang.
 */

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="flex-1 px-3 py-3.5 text-center">
      <p className={`text-xl font-semibold tabular-nums ${tone}`}>{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

export function RestaurantStatsSkeleton() {
  return (
    <div className="flex animate-pulse divide-x divide-slate-100 rounded-xl border border-slate-200 bg-white">
      {[0, 1, 2].map((index) => (
        <div key={index} className="flex-1 px-3 py-3.5">
          <div className="mx-auto h-6 w-8 rounded bg-slate-200" />
          <div className="mx-auto mt-1.5 h-2.5 w-12 rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

export async function RestaurantStatsCards() {
  const stats = await getRestaurantStats();

  return (
    <div className="flex divide-x divide-slate-100 rounded-xl border border-slate-200 bg-white">
      <Stat label="Terdata" value={stats.total} tone="text-slate-800" />
      <Stat label="Aman" value={stats.safe} tone="text-emerald-600" />
      <Stat label="Perlu dicek" value={stats.redFlag} tone="text-rose-500" />
    </div>
  );
}
