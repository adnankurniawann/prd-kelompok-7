import Link from "next/link";

export default function SpinPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Gacha Spin</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Core mechanic placeholder with budget and distance filters.
        </p>
      </header>

      <section className="rounded-xl border p-5">
        <h2 className="text-lg font-semibold">Filters (Placeholder)</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Budget range, maximum walking distance, and cuisine preference inputs
          will live here.
        </p>
      </section>

      <section className="rounded-xl border p-5">
        <h2 className="text-lg font-semibold">Spin Result</h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Result card placeholder for randomized food recommendation.
        </p>
      </section>

      <Link className="text-sm underline" href="/">
        Back to Dashboard
      </Link>
    </main>
  );
}
