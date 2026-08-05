import Link from "next/link";
import { Clock, MapPin, ShieldCheck } from "lucide-react";

import { BorderBeam } from "@/components/ui/border-beam";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/**
 * Hero untuk pengunjung yang belum pernah spin.
 *
 * CATATAN SOAL ASALNYA: kode `Hero195` yang dirujuk tidak ikut terkirim —
 * berkas yang diberi label `hero-195-1.tsx` isinya primitif Card shadcn, dan
 * `demo.tsx` mengimpor dari `@/components/ui/hero-195` yang tidak ada di mana
 * pun. Jadi ini bukan salinan Hero195; ini hero yang disusun dari bagian-
 * bagian yang memang dikirim (Card, Button, BorderBeam) untuk aplikasi ini.
 *
 * Kalau kode Hero195 yang asli menyusul, komponen ini tinggal diganti.
 *
 * Palet dan bahasanya mengikuti aplikasi: rose sebagai aksi, slate untuk
 * netral, kalimat pendek. Tidak ada foto stok — memasang gambar restoran
 * generik dari Unsplash di aplikasi yang justru menjanjikan warung nyata di
 * Jatinangor akan terasa seperti janji yang tidak ditepati begitu orang
 * menggulir ke bawah.
 */

const POINTS = [
  { icon: MapPin, label: "Cuma yang deket", hint: "Radius diatur sendiri" },
  { icon: Clock, label: "Yang lagi buka", hint: "Jam buka ikut dicek" },
  { icon: ShieldCheck, label: "Yang bersih", hint: "Laporan dari sesama" },
] as const;

export function Hero() {
  return (
    <Card className="relative overflow-hidden border-slate-200 p-6 md:p-8">
      {/* Sinar tepi yang berjalan pelan. Satu-satunya elemen dekoratif di
          halaman ini, dan hanya muncul untuk pengunjung baru. */}
      <BorderBeam size={220} duration={12} />

      <p className="text-xs font-bold uppercase tracking-widest text-rose-500">
        Jatinangor
      </p>

      <h1 className="mt-2 text-2xl font-black leading-tight tracking-tight text-slate-900 md:text-3xl">
        Bingung mau makan apa?
        <br />
        Biar kami yang pilih.
      </h1>

      <p className="mt-3 max-w-md text-sm leading-relaxed text-slate-500">
        Satu tombol, satu warung. Bukan daftar dua puluh pilihan yang bikin
        keputusannya makin berat.
      </p>

      <div className="mt-5 flex flex-wrap items-center gap-2.5">
        <Button asChild size="lg" className="rounded-lg px-6">
          <Link href="/spin">Spin sekarang</Link>
        </Button>
        <Button asChild variant="outline" size="lg" className="rounded-lg">
          <Link href="/map">Lihat peta dulu</Link>
        </Button>
      </div>

      <p className="mt-3 text-xs text-slate-400">
        Nggak perlu daftar. Langsung bisa dipakai.
      </p>

      <ul className="mt-6 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-3">
        {POINTS.map((point) => (
          <li key={point.label} className="flex items-start gap-2.5">
            <point.icon
              className="mt-0.5 h-4 w-4 shrink-0 text-rose-500"
              aria-hidden="true"
            />
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-slate-800">
                {point.label}
              </span>
              <span className="mt-0.5 block text-xs text-slate-500">
                {point.hint}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
