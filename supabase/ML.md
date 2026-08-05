# Roadmap ML — status

Rencananya mengubah seleksi acak berbobot jadi contextual bandit dengan
Thompson Sampling. Berkas ini mencatat apa yang sudah siap dan apa yang belum,
supaya tidak ada yang mengerjakan ulang instrumentasi yang sebenarnya sudah
ada.

## Fase 0 — instrumentasi: **selesai**

Sebagian besar sudah terpenuhi lebih dulu oleh Fase D dan E spec produksi.

| Kolom di roadmap | Status |
|---|---|
| `user_id`, `session_id`, `restaurant_id` | ✅ Fase D |
| `shown_at`, `user_lat`, `user_lng`, `distance_km` | ✅ Fase D |
| `hour_local`, `day_of_week`, `is_weekend` | ✅ Fase D |
| `policy` | ✅ Fase D — diisi `weighted_budget_v1` |
| `candidate_n` | ✅ Fase D |
| `action`, `acted_at` | ✅ Fase D |
| `policy_score` | ✅ Fase E |
| `is_raining` | ✅ ML Fase 0 |

Ditambah yang tidak ada di roadmap tapi ternyata perlu: `latency_ms` untuk
metrik p95, dan tabel `spin_misses` untuk spin yang berakhir tanpa kandidat —
kegagalan yang sebelumnya tidak meninggalkan jejak apa pun.

Keempat aturan Fase 0 juga sudah dipaksakan, bukan sekadar disarankan:
konteks dibekukan saat penayangan, `policy` wajib di tiap baris, `candidate_n`
tercatat, dan `ignored` ditulis sebagai label lewat `mark_ignored_spins()`.

README publik dan deploy: README sudah diganti di Fase E. Deploy ke Vercel
belum — lihat bagian terakhir.

## Koreksi penting terhadap roadmap

Roadmap menulis, sebagai keunggulan utamanya:

> Aplikasi kamu sekarang memilih secara acak seragam. Itu kebetulan adalah
> kebijakan pengumpulan data yang ideal.

**Itu tidak berlaku untuk kode ini.** `calculateSpinWeights` memberi bobot
`max(1, budget - price_tier)`, jadi dengan budget Rp20.000 sebuah tempat
Rp5.000 punya peluang 75% dan tempat Rp15.000 punya 25%.

Konsekuensinya: replay evaluation polos — "kalau pilihan kebijakan baru sama
dengan yang tercatat, terima barisnya" — **tidak tak bias di sini.** Ia
mewarisi bias harga dari kebijakan lama.

Yang harus dipakai nanti adalah inverse propensity scoring, membagi tiap
reward dengan `policy_score` baris tersebut:

```
estimasi = (1/n) * Σ  [ 1{π_baru(x) = a_tercatat} * r / policy_score ]
```

Karena itu `policy_score` ada, dan karena itu ia ditambahkan **sebelum**
trafik datang di Fase E, bukan saat model dikerjakan. Konteks yang tidak
dicatat saat penayangan tidak bisa ditambahkan belakangan.

## Konteks cuaca

**Mati secara default.** Nyalakan dengan `ENABLE_WEATHER_CONTEXT=true`.

Fitur ini memanggil Open-Meteo, layanan pihak ketiga, jadi keputusannya ada di
tangan yang men-deploy — bukan menyala diam-diam saat merge.

Aturan pentingnya: **jalur spin tidak pernah menunggu jaringan.** Nilainya
dibaca dari cache dalam memori (TTL 10 menit); kalau dingin, tercatat `null`
dan penyegaran dilepas di latar untuk spin berikutnya. Beberapa spin pertama
pada instance baru akan `null`, dan itu jauh lebih baik daripada menaikkan p95
demi satu kolom.

Koordinat dibulatkan ke ~11 km sebelum dikirim keluar. Dua alasan: lokasi
persis pengguna tidak pernah sampai ke pihak ketiga, dan seluruh Jatinangor
jatuh ke kunci cache yang sama sehingga hampir semua permintaan mengenai cache
hangat.

`null` berarti **tidak tahu**, bukan "tidak hujan". Bedanya harus dipertahankan
sampai ke database — mengisi `false` saat sebenarnya tidak tahu berarti menanam
fitur palsu ke dalam data latih.

## Fase 1 — fungsi fitur: **selesai**

`src/lib/ml/features.ts` — `buildFeatureVector(input) → number[26]`. Murni:
tidak menyentuh jaringan, tidak membaca jam, tidak membaca database. Semua
yang berubah masuk lewat parameter.

| Blok | Dim | Indeks |
|---|---|---|
| Jarak | 2 | 0–1 |
| Harga | 2 | 2–3 |
| Masakan (one-hot) | 12 | 4–15 |
| Waktu | 4 | 16–19 |
| Cuaca | 1 | 20 |
| Afinitas user | 2 | 21–22 |
| Popularitas | 2 | 23–24 |
| Bias | 1 | 25 |

`FEATURE_BLOCKS` dan `ablateBlock()` disiapkan untuk ablasi di Fase 2.

### Kebocoran dicegah secara struktural

`buildTrainingSet()` di `src/lib/ml/training.ts` memproses baris berurutan
menurut `shown_at`, menghitung fitur dari pencacah yang isinya **hanya baris
sebelumnya**, lalu memperbarui pencacah **sesudah** fiturnya dibuat. Tidak ada
jalan bagi hasil sebuah baris untuk memengaruhi fiturnya sendiri.

Itu ditulis di TypeScript, bukan sebagai SQL window function, dengan sengaja:
fitur masakan bergantung pada `toCuisineSlot`, dan menulis ulang pemetaan itu
di SQL berarti cepat atau lambat versi SQL dan versi TypeScript berbeda. Vektor
saat pelatihan tidak akan sama dengan vektor saat penyajian untuk peristiwa
yang sama, dan bug seperti itu tidak muncul di test mana pun sampai modelnya
sudah dipakai orang.

### Keputusan yang perlu diketahui sebelum menyentuh berkas ini

**Dua kosakata kategori disatukan.** Data seed memakai istilah Google Maps
berbahasa Inggris ("Chicken restaurant"), ingest OSM menghasilkan istilah
Indonesia ("Ayam"). Keduanya jatuh ke slot yang sama. Daftar slotnya tetap dan
pendek — one-hot yang tumbuh mengikuti isi database akan mengubah panjang
vektor setiap ada kategori baru, dan model yang sudah dilatih langsung tidak
cocok lagi.

**"Restaurant" polos adalah nilai paling umum di data seed, dan ia jatuh ke
`lainnya`.** Selama itu belum dikurasi, blok masakan praktis tidak membawa
informasi untuk sebagian besar tempat. Itu masalah kualitas data (Fase B),
bukan masalah model — dan ablasi di Fase 2 akan menunjukkannya.

**Afinitas dan popularitas dihaluskan lalu dipusatkan pada nol.** Rasio 1/1
dan 40/50 bukan bukti yang sama kuatnya; tanpa penghalusan, restoran yang baru
sekali tayang dan kebetulan diterima akan terlihat sempurna dan langsung
mendominasi. Dipusatkan supaya "belum ada riwayat" berarti nol — tidak
mendorong ke arah mana pun.

**Nilai yang tidak diketahui tetap netral, bukan ditebak.** Harga yang belum
dikurasi memberi 0, bukan tingkat 2. Cuaca memakai +1/−1/0 supaya "tidak tahu"
tidak bisa tertukar dengan "tidak hujan".

## Fase 2 — simulator dan baseline: **selesai**

`src/lib/ml/linalg.ts`, `bandit.ts`, `simulator.ts`. Model: Thompson Sampling
di atas regresi linear Bayesian, `A ← A + xxᵀ`, `b ← b + rx`, memilih
`argmax θ̃ᵀxᵢ` dengan `θ̃ ~ N(θ̂, σ²A⁻¹)`.

A⁻¹ disimpan langsung dan diperbarui lewat Sherman–Morrison — O(d²) per ronde
alih-alih O(d³) kalau A dibalik ulang tiap kali.

### Hasil

1.500 ronde, 40 pengguna, 60 restoran, benih 20260804. Jalankan ulang dengan
`npm test`; angkanya dicetak dari test supaya tidak pernah basi.

| Kebijakan | Accept | Regret | Coverage |
|---|---|---|---|
| *oracle (batas atas)* | *72,1%* | *0* | — |
| LinUCB (α=0,5) | 65,7% | **70,6** | 57% |
| Thompson Sampling | 65,0% | 89,6 | **77%** |
| ε-greedy (ε=0,1) | 64,7% | 111,3 | 100% |
| Jarak terdekat | 55,9% | 266,1 | 37% |
| Uniform random | 44,9% | 428,5 | 100% |

Thompson menurunkan cumulative regret **79% dibanding acak seragam** — yaitu
kebijakan yang sekarang benar-benar dipakai aplikasi.

### Yang tidak sesuai dugaan, dan tidak disembunyikan

**LinUCB mengalahkan Thompson pada regret** (70,6 vs 89,6). Thompson unggul di
cakupan katalog (77% vs 57%), dan untuk produk ini cakupan bukan hiasan:
sistem yang cuma merekomendasikan segelintir tempat teratas gagal sebagai
produk walau accept rate-nya tinggi.

Jadi pilihannya bukan "yang skornya paling bagus" melainkan trade-off yang
harus disebut apa adanya. Kalau nanti hanya regret yang dikejar, LinUCB
kandidat yang lebih baik.

**Jarak terdekat menutup katalog paling sempit** (37%) — baseline non-ML yang
lumayan kuat pada accept rate, tapi menampilkan tempat yang itu-itu saja.

### Ablasi

Ablasi membutakan **kebijakannya saja**; hadiah tetap dihitung dari fitur
penuh. Kalau lingkungannya ikut dibutakan, oracle-nya ikut bergeser dan angka
regret dari dua ablasi tidak lagi sebanding — pada percobaan pertama, membuang
satu blok bahkan terlihat *menguntungkan*, yang jelas tidak masuk akal.

`ablateBlock(x, "jarak")` dan seterusnya.

### Keputusan yang menentukan seluruh hasilnya

**`θ*_u = θ_bersama + deviasi kecil`, bukan θ* acak bebas per pengguna.**

Model ini belajar SATU θ yang dibagi ke semua pengguna, dan konteksnya cuma
punya dua dimensi afinitas pengguna. Kalau tiap pengguna diberi θ* yang
sepenuhnya bebas, tidak ada θ tunggal yang bisa mewakili mereka — dan pada
percobaan pertama memang begitu: Thompson kalah dari "ambil yang terdekat".
Yang terukur di situ bukan mutu modelnya, melainkan ketidakcocokan antara
model dan lingkungan karangan kita sendiri.

**σ = 0,3, bukan 1.** Dengan 26 dimensi dan hadiah biner, posterior yang lebar
membuat θ̃ melompat terlalu jauh tiap ronde dan Thompson berubah jadi
hampir-acak — kalah bahkan dari ε-greedy. Ini parameter pertama yang harus
dicurigai kalau hasilnya mengecewakan.

**Sepertiga katalog sintetis sengaja tanpa kategori berarti,** meniru data seed
di mana "Restaurant" polos adalah nilai paling umum. Simulasi dengan katalog
yang lebih rapi dari kenyataan akan melebih-lebihkan manfaat modelnya.

### Batasan — baca sebelum mengutip angka mana pun

Hasil simulasi **bukan bukti sistem bekerja pada manusia.**

- Pengguna sintetis di sini **linear dan stasioner**. Preferensinya tidak
  berubah, tidak bosan, dan tidak dipengaruhi teman di grup chat
- `P(accept) = sigmoid(θ*ᵀx)` mengasumsikan hadiahnya benar-benar fungsi dari
  fitur yang kita punya. Kalau yang menentukan sebenarnya sesuatu di luar
  vektor — warungnya sedang ramai, temannya mengajak ke tempat lain — model
  tidak akan pernah menemukannya, dan simulasi ini tidak akan menunjukkannya
- Batas atas oracle bergeser ~3 poin persen antar kebijakan, karena fitur
  popularitas bergantung pada apa yang pernah ditayangkan. Kecil, tapi bukan nol

Angka di atas hanya bukti bahwa modelnya belajar **kalau dunianya seperti yang
diasumsikan**. Buktinya pada manusia baru datang di Fase 4.

## Berikutnya

**Fase 3 — serving tanpa layanan Python.** Model linear berarti inferensi cuma
satu perkalian matriks-vektor 26×26: tidak butuh Python, tidak butuh layanan
terpisah, tidak butuh cold start serverless kedua. Latihan offline
menghasilkan JSON berisi `θ̂` dan Cholesky dari `σ²A⁻¹`; route handler
memuatnya, menarik `θ̃ = θ̂ + Lz`, lalu memilih argmax.

Seluruh aljabar yang dibutuhkan sudah ada di `linalg.ts` dan sudah teruji.

**Shadow mode dulu.** Sebelum bandit benar-benar memilih: jalankan diam-diam,
catat apa yang *akan* ia pilih, tapi tetap tampilkan hasil kebijakan sekarang.
Setelah beberapa ratus baris, jalankan evaluasi replay. Kalau estimasinya tidak
lebih baik dari yang sekarang, jangan deploy.

**Jangan mulai Fase 4 (replay/A-B) sebelum ada ~500 spin.** Sebelum itu tidak
ada yang bisa dipelajari, dan angka apa pun yang keluar akan punya interval
kepercayaan yang melewati nol.

## Yang belum: deploy

Aplikasinya belum di-deploy. Untuk Vercel yang dibutuhkan hanya dua environment
variable — `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` —
plus `ENABLE_WEATHER_CONTEXT` kalau konteks cuaca mau dipakai.

Jangan pernah menaruh `service_role` key di sana. Aplikasi ini tidak
memakainya, dan sebaiknya tetap begitu.
