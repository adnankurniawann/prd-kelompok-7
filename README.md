# Gacha Makannnn

Dibuat oleh Kelompok 7 PRD 
Anggota:

Rafi Pradipta Andira Sulistyo 13525051
M. Adnan Kurniawan 13525071
Kairenzo Vemil 13525063
Sulthan Dhiyazka 13525124
Muhammad Reffah 13525146



##  PANDUAN VIBECODING DENGAN AI (Cursor / ChatGPT / Claude / Gemini)

Kalau lu mau ngoding fitur lu pakai bantuan AI, lu tinggal nge-*copy* seluruh isi README ini dan jadikan prompt awal lu biar AI-nya paham konteks project kita. 

**Contoh Prompt Awal buat AI lu:**
> "Halo AI, saya mau mengerjakan project Next.js bernama 'Gacha Makan'. Silakan baca dokumen arsitektur dan pembagian tugas berikut ini:
> 
> [PASTE SELURUH ISI README INI DI SINI]
> 
> Tugas saya hari ini adalah sebagai [ISI ROLE LU: misal Front-End 1]. Saya mau membuat fitur [JELASKAN FITUR]. Tolong buatkan kodenya sesuai dengan folder structure dan tech stack yang ada di panduan."

---

## 🛠 Tech Stack Project
* **Framework:** Next.js (App Router)
* **Database & Auth:** Supabase (PostgreSQL dengan PostGIS untuk hitung radius jarak)
* **UI & Styling:** Tailwind CSS, Once UI, Framer Motion (untuk animasi gacha)
* **Arsitektur:** Monolith (Front-End dan Back-End digabung dalam satu repo Next.js)

---

##  Langkah Setup Lokal (WAJIB IKUTI URUTAN INI)

Biar lu ga pusing dan ga kena *dependency error*, ikutin langkah ini pelan-pelan di terminal lu:

**1. Tarik Kode dari GitHub**
```bash
git clone <isi-dengan-link-repo-adnan>
cd prd-kelompok-7

**2. Install Semua Library**
```bash
npm install

**2. Bikin File .env lokal lu. (nanti URL key dll nya gw kirim di WA Group)**
```bash
cp .env.local.example .env.local

**3. Nyalain Server**
```bash
npm run dev

## Connect Supabase (Akun Kamu Sendiri)

1. Buka Supabase Dashboard, pilih project kamu.
2. Masuk ke Settings -> API.
3. Copy 2 nilai ini:
    - Project URL
    - anon public key
4. Di root project, buat file env lokal:

```bash
cp .env.local.example .env.local
```

5. Isi `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-public-key>
```

6. Jalankan SQL schema dan seed di Supabase SQL Editor:
    - Jalankan `supabase/schema.sql`
    - Jalankan `supabase/seed.sql`
7. Restart dev server:

```bash
npm run dev
```

Catatan keamanan:
- Jangan commit `.env.local`.
- Jangan share service role key ke frontend.
- Yang dipakai aplikasi ini hanya `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

## Pembagian Tugas Dan Wilayah Kerja 
Biar ga bingung dan ga ngerusak flow kerja, tolong ngoding hanya di folder wilayah kerja masing-masing. 

1. Tim Frontend
    Area Kerja:  src/app/spin/, src/components/spin/, src/app/map/, src/app/page.tsx, src/components/map/ 
2. Tim Backend 
    Area kerja: 
        *src/app/api/: Membuat Route Handlers / endpoint.

        *src/utils/: Menyimpan logic murni (seperti fungsi algoritma weighted random gacha dan kalkulasi jarak kordinat lokasi).

        *src/lib/supabase/: Mengatur koneksi ke database dan nyiapin fungsi fetch / insert data.

## Ngingetin Git Best Practice 
    walaupun kaga dinilai, tapi terapin aja git best practice yang kayak di tubes alpro biar kaga puyeng. 
    aturan main nih: 
        1. JANGAN LANGSUNG NGODING DI BRANCH main!  

        2. Bikin Branch Baru: Sebelum mulai ngoding, bikin branch pakai konvensi tipe/nama-fitur (nama-kamu).

            Contoh: feat/spin-animation (dipta) atau fix/map-pin (adnan).

        3. Commit Message: Saat mau save kodingan ke Git, tulis message yang sama eksplisitnya dengan nama branch lu.

            Contoh: feat: implement framer motion on spin button.