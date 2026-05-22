import Link from "next/link";
import { AuthPanel } from "@/components/auth/auth-panel";

export const metadata = {
  title: "Login | Gacha Makan",
  description: "Masuk ke Gacha Makan dengan magic link email.",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const authCallbackFailed = params.error === "auth_callback_failed";
  const callbackMessage = params.message;

  return (
    <main className="min-h-screen bg-slate-50 font-sans flex flex-col items-center justify-center p-4 sm:p-6 selection:bg-rose-500 selection:text-white">
      {/* Brand Header */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
          <span className="text-slate-900">Gacha</span>
          <span className="text-rose-600">Makan</span>
        </h1>
      </div>

      {/* Login Card dengan sedikit warna latar (Soft Rose) */}
      <div className="w-full max-w-[400px] rounded-3xl border border-rose-100 bg-rose-50/30 p-6 sm:p-8 shadow-sm backdrop-blur-sm">
        {/* Judul ke tengah */}
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            Login
          </h2>
          <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
            Masukkan email kamu di bawah. Kami akan mengirimkan link khusus agar
            kamu bisa langsung masuk ke aplikasi.
          </p>
        </div>

        {authCallbackFailed ? (
          <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-center text-sm font-medium text-rose-600">
            {callbackMessage ??
              "Login dari email gagal. Coba kirim magic link lagi."}
          </div>
        ) : null}

        {/* Area Komponen AuthPanel */}
        <div>
          <AuthPanel
            variant="full"
            className="border-0 bg-transparent p-0 shadow-none"
          />
        </div>

        {/* Back to Home (Tanpa Logo Panah) */}
        <div className="mt-6 pt-6 border-t border-slate-200/60 text-center">
          <Link
            href="/"
            className="text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900 active:scale-95 inline-block"
          >
            Kembali ke Beranda
          </Link>
        </div>
      </div>
    </main>
  );
}
