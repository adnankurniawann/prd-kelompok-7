import Link from "next/link";

export default function Home() {
  return (
    <main
      className="relative min-h-screen overflow-hidden text-slate-950"
      style={{
        backgroundImage:
          "linear-gradient(to bottom, #ffffff 0%, #f8fafc 50%, #f1f5f9 100%)",
      }}
    >
      <div className="absolute inset-x-0 top-0 h-96 bg-[linear-gradient(135deg,rgba(244,63,94,0.08),rgba(14,165,233,0.06))]" />
      <div className="absolute left-0 top-12 h-32 w-32 rounded-full bg-rose-200/20 blur-3xl" />
      <div className="absolute right-0 top-1/4 h-40 w-40 rounded-full bg-sky-200/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col px-3 py-4 sm:px-6 lg:px-8">
        {/* Compact Header */}
        <header className="flex flex-col gap-4 rounded-3xl border border-white/50 bg-white/50 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.4em] text-rose-600">
              Gacha
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight leading-tight sm:text-4xl">
              Pilih Makan Siang
            </h1>
            <p className="mt-1 text-xs text-slate-600">Spin restoran. Cek higienitas. Lapor status.</p>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-900 px-4 py-3 text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-rose-500 to-orange-400 text-xs font-black">
              A
            </div>
            <div className="hidden sm:block text-sm">
              <p className="text-slate-400 text-xs">Jatinangor</p>
              <p className="font-bold">Adnan</p>
            </div>
          </div>
        </header>

        <section className="mt-4 flex flex-1 flex-col gap-4">
          {/* Status Cards - Compact */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-white/60 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                Restoran
              </p>
              <p className="mt-2 text-2xl font-black text-slate-900">21</p>
              <p className="text-xs text-slate-500 mt-1">Jatinangor & Bandung</p>
            </div>
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700">
                Aman
              </p>
              <p className="mt-2 text-2xl font-black text-emerald-900">14</p>
              <p className="text-xs text-emerald-600 mt-1">Green status</p>
            </div>
            <div className="rounded-2xl border border-rose-200 bg-rose-50/60 p-4 backdrop-blur">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-rose-700">
                Hati-hati
              </p>
              <p className="mt-2 text-2xl font-black text-rose-900">7</p>
              <p className="text-xs text-rose-600 mt-1">Red flag</p>
            </div>
          </div>

          {/* Mode Gallery - Prototype Inspired */}
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
                  Mode Aplikasi
                </p>
                <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950 sm:text-xl">
                  Pilih gaya main dulu.
                </h2>
              </div>
              <span className="rounded-full border border-slate-200 bg-slate-950 px-3 py-1 text-xs font-semibold text-white">
                3 mode
              </span>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Link
                href="/spin"
                className="group min-h-44 rounded-[1.6rem] border border-rose-200 bg-linear-to-br from-rose-500 to-orange-400 p-5 text-white shadow-[0_18px_50px_rgba(244,63,94,0.22)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(244,63,94,0.28)]"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-rose-100/90">
                  Mode Aman & Higienis
                </p>
                <h3 className="mt-3 text-2xl font-black leading-tight">
                  Spin restoran yang lolos filter.
                </h3>
                <p className="mt-3 max-w-xs text-sm leading-6 text-rose-50/90">
                  Cocok kalau kamu mau makan cepat, budget aman, dan hasil yang paling relevan.
                </p>
                <div className="mt-5 inline-flex rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  🎰 Mulai sekarang
                </div>
              </Link>

              <Link
                href="/map"
                className="group min-h-44 rounded-[1.6rem] border border-sky-200 bg-linear-to-br from-slate-950 via-sky-800 to-sky-600 p-5 text-white shadow-[0_18px_50px_rgba(2,132,199,0.18)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(2,132,199,0.24)]"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-sky-100/90">
                  Mode Eksplorasi
                </p>
                <h3 className="mt-3 text-2xl font-black leading-tight">
                  Lihat radar, status, dan laporan.
                </h3>
                <p className="mt-3 max-w-xs text-sm leading-6 text-slate-200">
                  Buat kamu yang suka browsing dulu, bandingin opsi, lalu cek mana yang paling oke.
                </p>
                <div className="mt-5 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                  📍 Buka radar
                </div>
              </Link>

              <Link
                href="/blind"
                className="group min-h-44 rounded-[1.6rem] border border-slate-200 bg-linear-to-br from-slate-900 to-slate-800 p-5 text-white shadow-[0_18px_50px_rgba(15,23,42,0.16)] transition hover:-translate-y-1 hover:shadow-[0_24px_60px_rgba(15,23,42,0.22)]"
              >
                <p className="text-[11px] font-bold uppercase tracking-[0.32em] text-slate-400">
                  Blind Gacha Mode
                </p>
                <h3 className="mt-3 text-2xl font-black leading-tight">
                  Biar sistem yang pilih kejutan.
                </h3>
                <p className="mt-3 max-w-xs text-sm leading-6 text-slate-300">
                  Buat saat kamu cuma pengin klik sekali dan langsung dapat rekomendasi acak yang masih masuk akal.
                </p>
                <div className="mt-5 inline-flex rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                  🎲 Coba blind mode
                </div>
              </Link>
            </div>
          </div>

          {/* Phone Mockups - Prototype Reference */}
          <div className="space-y-3 rounded-3xl border border-slate-200 bg-white/70 p-4 shadow-sm backdrop-blur">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-slate-500">
                Sketsa Mode
              </p>
              <h2 className="mt-1 text-lg font-black tracking-tight text-slate-950 sm:text-xl">
                Preview konsep per mode.
              </h2>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-100 p-2">
                <div className="rounded-[1.35rem] border border-sky-200 bg-linear-to-b from-sky-500 to-sky-700 p-3 text-white">
                  <p className="text-[10px] uppercase tracking-[0.26em] text-sky-100">Aman</p>
                  <h3 className="mt-2 text-lg font-black leading-tight">Mode Higienis</h3>
                  <div className="mt-3 rounded-2xl bg-white/15 p-3 text-center">
                    <p className="text-xs">Spin cepat</p>
                    <p className="text-xl font-black">🎯</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-100 p-2">
                <div className="rounded-[1.35rem] border border-amber-200 bg-linear-to-b from-amber-400 to-orange-500 p-3 text-white">
                  <p className="text-[10px] uppercase tracking-[0.26em] text-amber-50">Eksplorasi</p>
                  <h3 className="mt-2 text-lg font-black leading-tight">Mode Jelajah</h3>
                  <div className="mt-3 rounded-2xl bg-white/15 p-3 text-center">
                    <p className="text-xs">Lihat map</p>
                    <p className="text-xl font-black">🧭</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-slate-200 bg-slate-100 p-2">
                <div className="rounded-[1.35rem] border border-slate-700 bg-linear-to-b from-slate-900 to-indigo-950 p-3 text-white">
                  <p className="text-[10px] uppercase tracking-[0.26em] text-slate-300">Blind</p>
                  <h3 className="mt-2 text-lg font-black leading-tight">Mode Kejutan</h3>
                  <div className="mt-3 rounded-2xl bg-white/10 p-3 text-center">
                    <p className="text-xs">Sistem pilih</p>
                    <p className="text-xl font-black">🎲</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Action Buttons - Big & Obvious */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/spin"
              className="flex-1 flex items-center justify-between gap-4 rounded-2xl border-2 border-rose-500 bg-linear-to-br from-rose-500 to-orange-500 p-5 text-white font-bold shadow-lg transition hover:shadow-xl hover:scale-105 active:scale-95"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-rose-100">Mulai</p>
                <p className="text-xl font-black mt-1">Spin Gacha</p>
              </div>
              <span className="text-3xl">🎰</span>
            </Link>

            <Link
              href="/map"
              className="flex-1 flex items-center justify-between gap-4 rounded-2xl border-2 border-sky-500 bg-linear-to-br from-slate-900 to-sky-600 p-5 text-white font-bold shadow-lg transition hover:shadow-xl hover:scale-105 active:scale-95"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-sky-100">Lihat</p>
                <p className="text-xl font-black mt-1">Radar Map</p>
              </div>
              <span className="text-3xl">📍</span>
            </Link>
          </div>

          {/* Info Section - Minimal */}
          <div className="space-y-2 rounded-2xl border border-slate-200 bg-white/60 p-4 backdrop-blur">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                Cara Pakai
              </p>
              <ol className="mt-3 space-y-2 text-sm text-slate-700">
                <li><strong>1. Spin:</strong> Pilih budget & radius, dapatkan restoran random</li>
                <li><strong>2. Lihat:</strong> Cek status higienitas di radar map</li>
                <li><strong>3. Lapor:</strong> Kirim report RED_FLAG atau CLEAN</li>
              </ol>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}