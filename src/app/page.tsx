import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Gacha Makan</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-300">
          Dashboard placeholder for budget tracking and hygiene warnings.
        </p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <article className="rounded-xl border p-5">
          <h2 className="text-lg font-semibold">Budget Tracking</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Placeholder card for weekly spending summary, remaining budget, and
            recommended meal options.
          </p>
        </article>
        <article className="rounded-xl border p-5">
          <h2 className="text-lg font-semibold">Hygiene Warnings</h2>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
            Placeholder card for latest food hygiene alerts around campus.
          </p>
        </article>
      </section>

      <nav className="mt-2 flex flex-wrap gap-3">
        <Link
          className="rounded-lg border px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
          href="/spin"
        >
          Go to Gacha Spin
        </Link>
        <Link
          className="rounded-lg border px-4 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
          href="/map"
        >
          Open Hygiene Map
        </Link>
      </nav>
    </main>
  );
}
