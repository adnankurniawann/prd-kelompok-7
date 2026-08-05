# Gacha Makan

Aplikasi web untuk mahasiswa yang lapar tapi tidak bisa memutuskan mau makan
apa. Atur budget dan radius, tekan satu tombol, dapat satu warung — bukan
daftar dua puluh pilihan yang justru membuat keputusannya makin berat.

Fokusnya sempit dengan sengaja: **Jatinangor.** Kami tidak akan menang dalam
soal cakupan melawan Google Maps. Yang bisa dimenangkan adalah kurasi lokal di
wilayah dua kilometer — jam buka yang benar, harga yang benar, dan warung yang
memang dipakai mahasiswa.

## Cara pakai

1. Buka aplikasinya — **tidak perlu daftar.** Sesi dibuat otomatis
2. Izinkan lokasi, atau pilih area sendiri kalau tidak mau
3. Atur budget dan radius, tekan SPIN
4. "Jadi ke sini", "Simpan buat nanti", atau spin lagi

Filter yang dipakai diingat untuk kunjungan berikutnya. Bisa dipasang ke home
screen sebagai PWA.

## Tech stack

- **Next.js 16** (App Router) — monolith, front-end dan back-end satu repo
- **Supabase Postgres + PostGIS** — pencarian radius dijalankan di database
- **Tailwind CSS**, **Framer Motion** (dimuat setelah halaman siap)
- **Vitest** — 137 tes

## Arsitektur

```
src/app/api/       Route handler: spin, report, favorites, wallet
src/lib/           Klien Supabase, rate limit, lokasi, sesi
src/utils/         Logika murni: seleksi gacha, geo
supabase/          Skema, migrasi, dan catatan keputusan
scripts/           Ingest OSM, verifikasi RLS, ukur bundle
```

Beberapa keputusan yang menentukan bentuk kodenya:

**Klien tidak punya hak tulis ke tabel mana pun yang penting.** Anon key ada di
bundle JavaScript yang dikirim ke browser, jadi apa pun yang bisa dilakukan
pemegangnya harus dianggap sudah dilakukan orang asing. Perubahan skor
kebersihan lewat fungsi `security definer`, bukan UPDATE langsung.

**Jam buka punya tiga keadaan, bukan dua.** `true`, `false`, dan `null` untuk
belum terdata. Menganggap "belum tahu" sebagai tutup akan mengosongkan katalog;
menganggapnya buka akan mengirim orang ke warung yang sudah tutup.

**Ingest OSM menghasilkan SQL untuk direview, bukan menulis langsung.**
Deduplikasi berbasis kemiripan nama tidak pernah 100% benar, dan menggabungkan
dua warung berbeda jadi satu baris jauh lebih sulit dibereskan daripada membaca
daftarnya dulu.

**Setiap penayangan hasil spin dicatat beserta konteks yang dibekukan saat itu,**
termasuk peluang kebijakan memilihnya. Bukan analytics — ini fondasi data untuk
model rekomendasi nanti.

Catatan lengkap ada di `supabase/`: [KEAMANAN.md](supabase/KEAMANAN.md),
[DATA.md](supabase/DATA.md), [AUTH.md](supabase/AUTH.md),
[LOOP.md](supabase/LOOP.md), [METRIK.md](supabase/METRIK.md).

## Menjalankan secara lokal

Butuh Node 20+ dan satu project Supabase.

```bash
git clone https://github.com/adnankurniawann/prd-kelompok-7.git
cd prd-kelompok-7
npm install
```

Buat `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
```

Di Supabase SQL Editor, jalankan **berurutan**:

```
supabase/schema.sql
supabase/seed.sql
supabase/migrations/20260804000001_rls_hardening.sql
supabase/migrations/20260804000002_jam_buka_dan_kualitas_data.sql
supabase/migrations/20260804000003_spin_events_dan_favorit.sql
supabase/migrations/20260804000004_propensity_dan_metrik.sql
```

Lalu di Dashboard:

- **Authentication → Providers → Anonymous sign-ins: aktif.** Tanpa ini tidak
  ada riwayat yang tercatat sama sekali
- **Database → Extensions → `pg_cron`**, lalu jadwalkan `mark_ignored_spins()`
  (lihat [LOOP.md](supabase/LOOP.md))

Buktikan kebijakan RLS-nya benar-benar berlaku:

```bash
node scripts/verify-rls.mjs
```

Skrip itu memakai anon key yang sama dengan frontend lalu **mencoba** operasi
terlarang. Percobaan tulisnya dirancang tidak merusak. Jangan percaya bahwa
policy sudah benar hanya karena aplikasinya masih jalan.

```bash
npm run dev
```

## Perintah lain

```bash
npm test                                        # 137 tes
npm run build && node scripts/bundle-size.mjs   # ukuran bundle per halaman
node scripts/ingest-osm.mjs --area=jatinangor   # tarik data dari OpenStreetMap
```

## Status dan keterbatasan

Yang sudah jalan: pencarian radius dengan filter jam buka, laporan kebersihan
dengan cooldown, sesi anonim, PWA, pencatatan umpan balik, kartu hasil yang
bisa dibagikan, riwayat dan favorit.

Yang jujur perlu disebut:

- **Cakupan data masih tipis.** Baris hasil ingest OSM masuk tanpa harga, dan
  tanpa harga ia tidak muncul di hasil spin. Kurasi manual belum selesai
- **Jam buka belum terisi untuk sebagian besar tempat.** Yang belum terdata
  tetap ditampilkan dengan label, bukan disembunyikan
- **Rate limit disimpan di memori proses**, jadi di serverless hitungannya per
  instance. Cukup untuk menahan skrip iseng, bukan penyerang serius
- **Performa diukur lewat ukuran bundle**, belum lewat Lighthouse di perangkat
  sungguhan
- **Belum ada model rekomendasi.** Pemilihannya berbobot terhadap selisih
  budget, dan bobot itu dicatat apa adanya di setiap baris log

## Kelompok 7 PRD

Rafi Pradipta Andira Sulistyo (13525051) · M. Adnan Kurniawan (13525071) ·
Kairenzo Vemil (13525063) · Sulthan Dhiyazka (13525124) ·
Muhammad Reffah (13525146)

## Berkontribusi

Kerjakan di branch, buka PR ke `main`. Konvensi commit: `tipe: deskripsi`
(`feat`, `fix`, `perf`, `docs`).

Jangan commit `.env.local`. Jangan pernah menaruh `service_role` key di mana
pun — aplikasi ini tidak memakainya, dan sebaiknya tetap begitu.
