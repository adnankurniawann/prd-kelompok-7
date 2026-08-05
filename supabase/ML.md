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

## Berikutnya

**Fase 1 — fungsi fitur.** Satu fungsi murni `(user, restaurant, context) →
R^26`, dengan tes ditulis sebelum logika bandit.

Jebakan utamanya *target leakage*: fitur "accept rate historis user" harus
dihitung **hanya dari baris dengan `shown_at` lebih awal** dari baris yang
sedang dihitung. Kalau dihitung dari seluruh dataset, masa depan bocor ke masa
lalu dan hasil evaluasinya akan terlihat spektakuler sekaligus tidak berarti.

**Fase 2 — simulator dan baseline.** Ini inti ML-nya, dan bisa dikerjakan
tanpa menunggu data nyata. Baseline yang wajib ada: uniform random, jarak
terdekat, ε-greedy, LinUCB, Thompson Sampling, dan oracle untuk menghitung
regret.

**Jangan mulai Fase 4 (replay/A-B) sebelum ada ~500 spin.** Sebelum itu tidak
ada yang bisa dipelajari, dan angka apa pun yang keluar akan punya interval
kepercayaan yang melewati nol.

## Yang belum: deploy

Aplikasinya belum di-deploy. Untuk Vercel yang dibutuhkan hanya dua environment
variable — `NEXT_PUBLIC_SUPABASE_URL` dan `NEXT_PUBLIC_SUPABASE_ANON_KEY` —
plus `ENABLE_WEATHER_CONTEXT` kalau konteks cuaca mau dipakai.

Jangan pernah menaruh `service_role` key di sana. Aplikasi ini tidak
memakainya, dan sebaiknya tetap begitu.
