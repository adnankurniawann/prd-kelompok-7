import Link from "next/link";

export default function Home() {
  return (
    <main
      className="relative min-h-screen overflow-hidden text-slate-950"
      style={{
        backgroundImage:
          "radial-gradient(circle at top, #fff7ed 0%, #f8fafc 34%, #eef2ff 100%)",
      }}
    >
      <div className="absolute inset-x-0 top-0 h-72 bg-[linear-gradient(135deg,rgba(244,63,94,0.16),rgba(14,165,233,0.08),transparent)]" />
      <div className="absolute left-8 top-24 h-44 w-44 rounded-full bg-rose-200/40 blur-3xl" />
      <div className="absolute right-0 top-40 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between rounded-4xl border border-white/70 bg-white/75 px-5 py-4 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-rose-500">
              Gacha Makan
            </p>
            <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
              Pilih makan siang tanpa mikir lama.
            </h1>
          </div>
          <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-slate-950 px-3 py-2 text-white shadow-lg shadow-slate-950/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/20 bg-gradient-to-br from-rose-400 to-orange-300 text-sm font-black text-white">
              A
            </div>
            <div className="hidden sm:block">
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300">
                Selamat datang
              </p>
              <p className="text-sm font-semibold">Adnan (IF25)</p>
            </div>
          </div>
        </header>

        <section className="grid flex-1 gap-6 py-6 lg:grid-cols-[1.3fr_0.9fr]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-4xl border border-slate-200 bg-slate-950 text-white shadow-[0_24px_100px_rgba(15,23,42,0.24)]">
              <div className="grid gap-6 p-6 sm:grid-cols-[1.2fr_0.8fr] sm:p-8">
                <div className="space-y-4">
                  <span className="inline-flex w-fit rounded-full border border-white/10 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.25em] text-rose-200">
                    Live backend ready
                  </span>
                  <h2 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                    Spin restoran dari data nyata, bukan dummy list.
                  </h2>
                  <p className="max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                    Filter budget, radius, dan skor higienitas langsung lewat
                    API. Hasil spin dan radar restoran dihubungkan ke seed data
                    yang sudah dipakai oleh backend.
                  </p>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-white/10 px-3 py-1 text-slate-100">
                      16 seed restoran
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-slate-100">
                      PostGIS radius filter
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-slate-100">
                      Hygiene score live
                    </span>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.28em] text-slate-400">
                    Hari ini
                  </p>
                  <div className="mt-4 space-y-3">
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
                        Budget aman
                      </p>
                      <p className="mt-2 text-3xl font-black">Rp 20.000</p>
                    </div>
                    <div className="rounded-2xl bg-white/10 p-4">
                      <p className="text-[11px] uppercase tracking-[0.25em] text-slate-400">
                        Zona aktif
                      </p>
                      <p className="mt-2 text-lg font-semibold">Jatinangor & sekitarnya</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Link
                href="/spin"
                className="group rounded-[1.75rem] border border-rose-200 bg-linear-to-br from-rose-500 to-orange-400 p-6 text-white shadow-[0_20px_80px_rgba(244,63,94,0.28)] transition-transform hover:-translate-y-1"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-rose-100">
                  Spin
                </p>
                <h3 className="mt-2 text-2xl font-black">Mulai gacha makan</h3>
                <p className="mt-2 text-sm text-rose-50/90">
                  Buka halaman spin untuk memilih budget, radius, dan lokasi lalu
                  kirim ke endpoint /api/spin.
                </p>
              </Link>

              <Link
                href="/map"
                className="group rounded-[1.75rem] border border-sky-200 bg-linear-to-br from-slate-950 to-sky-700 p-6 text-white shadow-[0_20px_80px_rgba(2,132,199,0.2)] transition-transform hover:-translate-y-1"
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-200">
                  Map
                </p>
                <h3 className="mt-2 text-2xl font-black">Lihat radar higienitas</h3>
                <p className="mt-2 text-sm text-slate-200">
                  Buka halaman map untuk melihat daftar restoran, status higienitas,
                  dan kirim report RED_FLAG atau CLEAN.
                </p>
              </Link>
            </div>
          </div>

          <aside className="space-y-4 rounded-4xl border border-slate-200 bg-white/80 p-5 shadow-[0_20px_80px_rgba(15,23,42,0.08)] backdrop-blur">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
                Alur kerja
              </p>
              <h3 className="mt-2 text-2xl font-black tracking-tight">
                Tiga langkah untuk beresin lapar.
              </h3>
            </div>

            <div className="space-y-3">
              {[
                ["01", "Pilih budget & radius", "Gunakan lokasi sekarang atau isi manual."],
                ["02", "Spin restoran", "Endpoint memilih kandidat yang lolos filter."],
                ["03", "Cek radar & laporkan", "Map menampilkan status higienitas terbaru."],
              ].map(([step, title, description]) => (
                <div key={step} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-rose-500">
                    {step}
                  </p>
                  <h4 className="mt-2 font-bold text-slate-900">{title}</h4>
                  <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
                </div>
              ))}
            </div>

            <div className="rounded-3xl bg-slate-950 p-5 text-white">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Catatan
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                UI ini sudah langsung menempel ke kontrak backend yang lolos
                test: /api/spin, /api/restaurants, dan /api/report.
              </p>
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}