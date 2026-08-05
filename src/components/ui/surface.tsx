import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Primitif tampilan bersama.
 *
 * Gayanya sengaja rata dan padat: kartu putih dengan garis tipis, sudut 12px,
 * tanpa gradien dan tanpa bayangan tebal. Sebelumnya tiap halaman memakai
 * `rounded-3xl`, gradien, dan lingkaran blur dekoratif yang berbeda-beda —
 * hasilnya terlihat ramai dan tiap halaman terasa seperti aplikasi yang lain.
 *
 * Warnanya tidak berubah: rose-500 tetap warna aksi, slate untuk netral.
 */

export function Card({
  children,
  className = "",
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white ${padded ? "p-4" : ""} ${className}`}
    >
      {children}
    </section>
  );
}

/**
 * Judul bagian dengan tautan aksi di kanan.
 *
 * Pola yang sama dipakai di seluruh halaman, jadi mata tahu di mana mencari
 * "lihat semua" tanpa harus membacanya tiap kali.
 */
export function SectionHeader({
  title,
  action,
  actionHref,
}: {
  title: string;
  action?: string;
  actionHref?: string;
}) {
  return (
    <div className="mb-3 flex items-baseline justify-between gap-3">
      <h2 className="text-[15px] font-bold tracking-tight text-slate-900">
        {title}
      </h2>
      {action && actionHref && (
        <Link
          href={actionHref}
          className="shrink-0 text-xs font-bold text-rose-500 transition-colors hover:text-rose-600"
        >
          {action}
        </Link>
      )}
    </div>
  );
}

/**
 * Petak ikon untuk aksi cepat.
 *
 * Empat kolom di layar sempit, seperti baris kategori yang sudah dikenal orang
 * dari aplikasi belanja. Ikon bundar, label pendek, tanpa deskripsi — kalau
 * butuh dijelaskan, ia bukan aksi cepat.
 */
export function IconTile({
  href,
  icon,
  label,
  tone = "rose",
}: {
  href: string;
  icon: string;
  label: string;
  tone?: "rose" | "sky" | "amber" | "slate" | "emerald";
}) {
  const tones: Record<string, string> = {
    rose: "bg-rose-50 text-rose-500",
    sky: "bg-sky-50 text-sky-500",
    amber: "bg-amber-50 text-amber-600",
    slate: "bg-slate-100 text-slate-600",
    emerald: "bg-emerald-50 text-emerald-600",
  };

  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-2 rounded-lg py-2 transition-colors hover:bg-slate-50 active:scale-95"
    >
      <span
        className={`flex h-12 w-12 items-center justify-center rounded-full text-xl ${tones[tone]}`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="text-center text-[11px] font-semibold leading-tight text-slate-700">
        {label}
      </span>
    </Link>
  );
}

/**
 * Satu baris menu: ikon, label, keterangan opsional, tanda panah.
 *
 * Bentuk daftar seperti ini jauh lebih mudah dipindai daripada kotak-kotak
 * berukuran sama — mata cukup menyusuri satu kolom.
 */
export function MenuRow({
  href,
  onClick,
  icon,
  label,
  hint,
  danger = false,
}: {
  href?: string;
  onClick?: () => void;
  icon: string;
  label: string;
  hint?: string;
  danger?: boolean;
}) {
  const content = (
    <>
      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-base ${
          danger ? "bg-rose-50" : "bg-slate-100"
        }`}
        aria-hidden="true"
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`block text-sm font-semibold ${danger ? "text-rose-600" : "text-slate-800"}`}
        >
          {label}
        </span>
        {hint && (
          <span className="mt-0.5 block truncate text-xs text-slate-400">
            {hint}
          </span>
        )}
      </span>
      <span className="shrink-0 text-slate-300" aria-hidden="true">
        ›
      </span>
    </>
  );

  const className =
    "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-slate-50 active:bg-slate-100";

  if (href) {
    return (
      <Link href={href} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
}

/** Pembungkus daftar `MenuRow` dengan garis pemisah antar baris. */
export function MenuList({ children }: { children: ReactNode }) {
  return (
    <div className="divide-y divide-slate-100 overflow-hidden rounded-xl border border-slate-200 bg-white">
      {children}
    </div>
  );
}
