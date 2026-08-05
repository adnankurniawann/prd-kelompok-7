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

## Berikutnya

**Fase 2 — simulator dan baseline.** Ini inti ML-nya, dan bisa dikerjakan
tanpa menunggu data nyata. Baseline yang wajib ada: uniform random, jarak
terdekat, ε-greedy, LinUCB, Thompson Sampling, dan oracle untuk menghitung
regret.

Ablasi memakai `ablateBlock(x, "masakan")` dan seterusnya — dinolkan, bukan
dibuang, supaya panjang vektornya tetap dan hasilnya bisa dibandingkan langsung
dengan model penuh.

**Jangan mulai Fase 4 (replay/A-B) sebelum ada ~500 spin.** Sebelum itu tidak
ada yang bisa dipelajari, dan angka apa pun yang keluar akan punya interval
kepercayaan yang melewati nol.

## Yang belum: deploy

Aplikasinya belum di-deploy. Untuk Vercel yang dibutuhkan hanya dua environment
variable — `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` —
plus `ENABLE_WEATHER_CONTEXT` kalau konteks cuaca mau dipakai.

Jangan pernah menaruh `service_role` key di sana. Aplikasi ini tidak
memakainya, dan sebaiknya tetap begitu.
