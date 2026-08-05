"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/**
 * Navigasi bawah untuk layar sempit.
 *
 * Konteks pemakaian nyata aplikasi ini adalah satu tangan sambil berdiri di
 * pinggir jalan. Menu di pojok atas layar 6 inci butuh jangkauan jempol yang
 * tidak semua orang punya; empat tujuan di dasar layar tidak.
 *
 * Disembunyikan di layar lebar, karena di sana navigasi header sudah cukup.
 */

const ITEMS = [
  { href: "/", label: "Beranda", icon: "🏠" },
  { href: "/spin", label: "Spin", icon: "🎰" },
  { href: "/map", label: "Peta", icon: "📍" },
  { href: "/riwayat", label: "Riwayat", icon: "🕒" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Navigasi utama"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 backdrop-blur-lg md:hidden"
    >
      <div className="mx-auto flex max-w-md items-stretch">
        {ITEMS.map((item) => {
          const active =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-semibold transition-colors ${
                active ? "text-rose-500" : "text-slate-400"
              }`}
            >
              <span className="text-lg" aria-hidden="true">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}
      </div>
      {/* Ruang aman untuk HP dengan indikator gestur di dasar layar. */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
