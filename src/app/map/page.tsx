import Link from "next/link";

export default function MapPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Hygiene Radar Map</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Map page placeholder for hygiene score visualization.
        </p>
      </header>

      <section className="rounded-xl border p-5">
        <h2 className="text-lg font-semibold">Map Canvas (Placeholder)</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Interactive map and hygiene markers will be rendered here.
        </p>
      </section>

      <section className="rounded-xl border p-5">
        <h2 className="text-lg font-semibold">Area Insights</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Placeholder list for nearby eateries with latest hygiene statuses.
        </p>
      </section>

      <Link className="text-sm underline" href="/">
        Back to Dashboard
      </Link>
    </main>
  );
}
