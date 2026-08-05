"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Header dengan navigasi yang sama di seluruh halaman.
 *
 * Sebelumnya tiap halaman punya header sendiri dan tidak ada satu pun jalan ke
 * `/riwayat` — halaman itu hanya bisa dibuka dengan mengetik alamatnya. Fitur
 * yang tidak bisa ditemukan sama saja dengan fitur yang tidak ada.
 */

const LINKS = [
  { href: "/spin", label: "Spin", icon: "🎰" },
  { href: "/map", label: "Peta", icon: "📍" },
  { href: "/riwayat", label: "Riwayat", icon: "🕒" },
];

export function AppHeader({
  displayName,
  isAnonymous,
  /**
   * Halaman klien memanggilnya tanpa data sesi.
   *
   * Membaca sesi dari sana berarti menarik klien Supabase ke bundle awal
   * halaman spin — persis yang dikeluarkan di Fase C, dan halaman itu yang
   * paling sering dibuka di 4G goyah. Slot akunnya jadi tautan netral.
   */
  session = true,
}: {
  displayName?: string | null;
  isAnonymous?: boolean;
  session?: boolean;
}) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/60 bg-white/85 shadow-sm backdrop-blur-lg">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-8">
        <Link href="/" className="shrink-0">
          <span className="text-xl font-black tracking-tight text-slate-900 md:text-2xl">
            Gacha<span className="text-rose-500">Makan</span>
          </span>
        </Link>

        {/* Navigasi utama. Di layar sempit ikonnya saja, supaya tetap muat
            tanpa menyembunyikan menu di balik hamburger. */}
        <nav className="flex items-center gap-1">
          {LINKS.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`rounded-lg px-2.5 py-1.5 text-sm font-semibold transition-colors sm:px-3 ${
                  active
                    ? "bg-rose-50 text-rose-600"
                    : "text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                }`}
              >
                <span aria-hidden="true">{link.icon}</span>
                <span className="ml-1.5 hidden sm:inline">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Sesi anonim TIDAK ditampilkan seolah sudah punya akun. Sebelumnya
            pengunjung baru melihat "Selamat datang kembali" dengan nama
            kosong, karena sesi anonim memang tidak punya nama. */}
        {!session ? (
          <Link
            href="/account"
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-rose-200 hover:text-rose-600"
          >
            Akun
          </Link>
        ) : isAnonymous || !displayName ? (
          <Link
            href="/login"
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors hover:border-rose-200 hover:text-rose-600"
          >
            Simpan akun
          </Link>
        ) : (
          <Link
            href="/account"
            className="flex shrink-0 items-center gap-2 transition-transform active:scale-95"
          >
            <span className="hidden max-w-[10ch] truncate text-sm font-semibold text-slate-700 sm:inline">
              {displayName}
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-sm font-bold text-rose-600">
              {displayName.slice(0, 1).toUpperCase()}
            </span>
          </Link>
        )}
      </div>
    </header>
  );
}
