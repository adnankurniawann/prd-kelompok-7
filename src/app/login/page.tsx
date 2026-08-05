import Link from "next/link";
import { Bookmark, History, Smartphone } from "lucide-react";

import { AuthPanel } from "@/components/auth/auth-panel";
import { AppHeader } from "@/components/home/app-header";

export const metadata = {
  title: "Masuk | Gacha Makan",
  description: "Simpan riwayat dan favoritmu dengan satu link ke email.",
};

type LoginPageProps = {
  searchParams: Promise<{ error?: string; message?: string }>;
};

/**
 * Halaman masuk.
 *
 * Dua hal yang diperbaiki dari versi sebelumnya:
 *
 * 1. Ia berdiri sendiri di tengah layar tanpa header, tanpa jalan kembali
 *    selain satu tautan kecil di dasar kartu. Halaman yang memutus navigasi
 *    seperti itu terasa seperti jalan buntu.
 * 2. Judulnya "Login" tanpa menjelaskan apa pun. Padahal di aplikasi ini
 *    masuk itu OPSIONAL — orang sudah bisa spin tanpa akun. Kalau tidak
 *    dijelaskan apa untungnya, tidak ada alasan mengisi email.
 */
const BENEFITS = [
  { icon: History, text: "Riwayat spin tetap ada" },
  { icon: Bookmark, text: "Daftar simpanan ikut terbawa" },
  { icon: Smartphone, text: "Bisa dibuka dari HP lain" },
] as const;

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const authCallbackFailed = params.error === "auth_callback_failed";
  const callbackMessage = params.message;

  return (
    <main className="min-h-screen bg-slate-100 pb-16 font-sans text-slate-800">
      <AppHeader session={false} />

      <div className="mx-auto w-full max-w-md px-4 pt-8 md:px-6">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          Simpan punyamu
        </h1>
        <p className="mt-1.5 text-[15px] leading-relaxed text-slate-500">
          Kamu sudah bisa spin tanpa akun. Email cuma dipakai supaya yang sudah
          terkumpul tidak hilang.
        </p>

        <ul className="mt-5 space-y-2.5">
          {BENEFITS.map((benefit) => (
            <li
              key={benefit.text}
              className="flex items-center gap-2.5 text-sm text-slate-600"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-rose-50">
                <benefit.icon className="h-3.5 w-3.5 text-rose-500" aria-hidden="true" />
              </span>
              {benefit.text}
            </li>
          ))}
        </ul>

        {authCallbackFailed ? (
          <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {callbackMessage ??
              "Link dari email gagal dipakai. Coba kirim ulang."}
          </div>
        ) : null}

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-5">
          <AuthPanel className="border-0 bg-transparent p-0 shadow-none" />
          <p className="mt-4 text-xs leading-relaxed text-slate-400">
            Tanpa password. Kami kirim satu link ke emailmu, tinggal dibuka.
          </p>
        </div>

        <Link
          href="/spin"
          className="mt-5 block text-center text-sm font-medium text-slate-500 transition-colors hover:text-slate-800"
        >
          Nanti aja, mau spin dulu
        </Link>
      </div>
    </main>
  );
}
