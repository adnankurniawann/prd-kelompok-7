import { getRestaurantStats } from "@/lib/supabase/queries";

function StatValue({ value }: { value: number | string }) {
  return (
    <p className="text-2xl md:text-3xl font-bold mt-0.5 text-white/95">{value}</p>
  );
}

export function RestaurantStatsSkeleton() {
  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4">
      {[
        "from-indigo-500 to-blue-600",
        "from-emerald-400 to-emerald-500",
        "from-rose-400 to-rose-500",
      ].map((gradient) => (
        <div
          key={gradient}
          className={`animate-pulse rounded-2xl bg-gradient-to-br ${gradient} p-4 text-white shadow-sm`}
        >
          <div className="mb-3 h-7 w-7 rounded-lg bg-white/20" />
          <div className="h-2 w-16 rounded bg-white/25" />
          <div className="mt-3 h-8 w-10 rounded bg-white/30" />
        </div>
      ))}
    </div>
  );
}

export async function RestaurantStatsCards() {
  const stats = await getRestaurantStats();

  return (
    <div className="grid grid-cols-3 gap-3 md:gap-4">
      <div className="group bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl p-4 text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
        <span className="text-2xl mb-1 block opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all origin-left">
          🏪
        </span>
        <p className="text-[10px] uppercase font-medium tracking-widest text-indigo-100 mt-2">
          Restoran
        </p>
        <StatValue value={stats.total} />
      </div>

      <div className="group bg-gradient-to-br from-emerald-400 to-emerald-500 rounded-2xl p-4 text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
        <span className="text-2xl mb-1 block opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all origin-left">
          🛡️
        </span>
        <p className="text-[10px] uppercase font-medium tracking-widest text-emerald-100 mt-2">
          Aman
        </p>
        <StatValue value={stats.safe} />
      </div>

      <div className="group bg-gradient-to-br from-rose-400 to-rose-500 rounded-2xl p-4 text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
        <span className="text-2xl mb-1 block opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all origin-left">
          ⚠️
        </span>
        <p className="text-[10px] uppercase font-medium tracking-widest text-rose-100 mt-2">
          Red Flag
        </p>
        <StatValue value={stats.redFlag} />
      </div>
    </div>
  );
}
