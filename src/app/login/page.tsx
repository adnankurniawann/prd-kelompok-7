import Link from "next/link";
import { AuthPanel } from "@/components/auth/auth-panel";

export const metadata = {
  title: "Login | Gacha Makan",
  description: "Masuk ke Gacha Makan dengan magic link email.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#0e1b28] px-4 py-6 text-white sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[1080px] items-center justify-center rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(34,211,238,0.12),transparent_35%),linear-gradient(180deg,#0f2232_0%,#0b1620_100%)] p-4 shadow-[0_30px_120px_rgba(2,8,23,0.45)] sm:p-8">
        <div className="w-full max-w-md">
          <div className="rounded-[2rem] border border-white/10 bg-[#17283a]/95 p-6 shadow-[0_24px_90px_rgba(2,8,23,0.4)] sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-[0.7rem] font-bold uppercase tracking-[0.4em] text-cyan-400">
                  Email login
                </p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-white sm:text-4xl">
                  Magic link ke inbox kamu.
                </h1>
                <p className="mt-3 max-w-sm text-sm leading-6 text-slate-400 sm:text-base">
                  Masukkan email, kami kirim link. Klik link itu langsung login tanpa password.
                </p>
              </div>
              <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-full bg-cyan-400 text-lg font-black text-slate-950 sm:flex">
                GM
              </div>
            </div>

            <div className="mt-8">
              <AuthPanel variant="full" className="border-0 bg-transparent p-0 shadow-none" />
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/"
                className="text-xs font-semibold text-slate-400 transition hover:text-cyan-300"
              >
                Kembali ke homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
