/**
 * Menyusun data latih dari log spin, tanpa kebocoran masa depan.
 *
 * Kenapa di TypeScript dan bukan SQL window function: fitur masakan bergantung
 * pada `toCuisineSlot`, yang menyatukan dua kosakata kategori. Kalau pemetaan
 * itu ditulis ulang di SQL, ia akan berbeda dari versi TypeScript cepat atau
 * lambat — dan bedanya berarti vektor saat pelatihan tidak sama dengan vektor
 * saat penyajian untuk peristiwa yang sama. Bug seperti itu tidak muncul di
 * test mana pun sampai modelnya sudah dipakai orang.
 *
 * Satu sumber, satu perilaku.
 *
 * KEBOCORAN DICEGAH SECARA STRUKTURAL, bukan lewat filter yang bisa lupa
 * ditulis: baris diproses berurutan menurut `shown_at`, fitur dihitung dari
 * pencacah yang isinya HANYA baris-baris sebelumnya, dan pencacah baru
 * diperbarui SESUDAH fiturnya dibuat. Tidak ada jalan bagi hasil sebuah baris
 * untuk memengaruhi fiturnya sendiri.
 */

import {
  buildFeatureVector,
  type FeatureInput,
  type PriorStats,
} from "@/lib/ml/features";
import { toCuisineSlot, toPriceLevel } from "@/lib/ml/taxonomy";

/** Satu baris log seperti yang dibaca dari `spin_events_labeled`. */
export interface RawSpinRow {
  id: string;
  user_id: string;
  restaurant_id: string;
  /** ISO 8601. Menentukan urutan pemrosesan. */
  shown_at: string;
  category: string | null;
  price_tier: number | null;
  distance_km: number;
  hour_local: number;
  day_of_week: number;
  is_raining: boolean | null;
  /**
   * Label yang sudah selesai. `null` berarti jendela responsnya belum habis —
   * baris seperti itu dibuang, tidak dihitung sebagai penolakan.
   */
  effective_action: string | null;
  /** Peluang kebijakan lama memilih baris ini. Dibawa untuk evaluasi Fase 4. */
  policy_score: number | null;
  policy: string;
}

export interface TrainingExample {
  eventId: string;
  x: number[];
  /** 1 kalau diterima, 0 kalau tidak. */
  reward: number;
  shownAt: string;
  restaurantId: string;
  userId: string;
  /** Dibawa apa adanya untuk inverse propensity scoring di Fase 4. */
  policyScore: number | null;
  policy: string;
}

interface Counter {
  impressions: number;
  accepts: number;
}

const EMPTY: PriorStats = { impressions: 0, accepts: 0 };

function bump(map: Map<string, Counter>, key: string, accepted: boolean): void {
  const entry = map.get(key) ?? { impressions: 0, accepts: 0 };
  entry.impressions += 1;
  if (accepted) entry.accepts += 1;
  map.set(key, entry);
}

function read(map: Map<string, Counter>, key: string): PriorStats {
  return map.get(key) ?? EMPTY;
}

/**
 * Mengubah log mentah jadi contoh latih.
 *
 * @param rows - Baris log; urutannya tidak perlu rapi, akan diurutkan di sini
 * @returns Contoh latih menurut urutan waktu penayangan
 */
export function buildTrainingSet(rows: RawSpinRow[]): TrainingExample[] {
  // Diurutkan menurut waktu, dengan id sebagai pemecah seri supaya hasilnya
  // deterministik walau dua penayangan punya timestamp yang sama persis.
  const ordered = [...rows].sort((a, b) => {
    const byTime = Date.parse(a.shown_at) - Date.parse(b.shown_at);
    return byTime !== 0 ? byTime : a.id.localeCompare(b.id);
  });

  const userCategory = new Map<string, Counter>();
  const userPrice = new Map<string, Counter>();
  const restaurant = new Map<string, Counter>();

  let globalImpressions = 0;
  let globalAccepts = 0;

  // Total harga yang diterima per user, untuk rata-rata berjalan.
  const acceptedPriceSum = new Map<string, number>();
  const acceptedPriceCount = new Map<string, number>();

  const examples: TrainingExample[] = [];

  for (const row of ordered) {
    // Baris yang belum punya label bukan penolakan — ia belum menjawab apa
    // pun. Dibuang, dan tidak boleh ikut memperbarui pencacah.
    if (row.effective_action === null || row.effective_action === undefined) {
      continue;
    }

    const accepted = row.effective_action === "accepted";
    const slot = toCuisineSlot(row.category);
    const priceLevel = toPriceLevel(row.price_tier);

    const categoryKey = `${row.user_id}|${slot}`;
    const priceKey = `${row.user_id}|${priceLevel ?? "unknown"}`;

    // Tanpa riwayat sama sekali, rata-rata global belum terdefinisi. Nol
    // adalah titik jangkar yang jujur: belum ada bukti apa pun.
    const globalAcceptRate =
      globalImpressions > 0 ? globalAccepts / globalImpressions : 0;

    const count = acceptedPriceCount.get(row.user_id) ?? 0;
    const userMeanAcceptedPrice =
      count > 0 ? (acceptedPriceSum.get(row.user_id) ?? 0) / count : null;

    const input: FeatureInput = {
      distanceKm: row.distance_km,
      priceTier: row.price_tier,
      category: row.category,
      hourLocal: row.hour_local,
      dayOfWeek: row.day_of_week,
      isRaining: row.is_raining,
      userCategoryStats: read(userCategory, categoryKey),
      userPriceStats: read(userPrice, priceKey),
      restaurantStats: read(restaurant, row.restaurant_id),
      userMeanAcceptedPrice,
      globalAcceptRate,
    };

    examples.push({
      eventId: row.id,
      x: buildFeatureVector(input),
      reward: accepted ? 1 : 0,
      shownAt: row.shown_at,
      restaurantId: row.restaurant_id,
      userId: row.user_id,
      policyScore: row.policy_score,
      policy: row.policy,
    });

    // --- Pembaruan pencacah HARUS setelah fitur dibuat -----------------------
    bump(userCategory, categoryKey, accepted);
    bump(userPrice, priceKey, accepted);
    bump(restaurant, row.restaurant_id, accepted);

    globalImpressions += 1;
    if (accepted) globalAccepts += 1;

    if (accepted && typeof row.price_tier === "number" && row.price_tier > 0) {
      acceptedPriceSum.set(
        row.user_id,
        (acceptedPriceSum.get(row.user_id) ?? 0) + row.price_tier,
      );
      acceptedPriceCount.set(row.user_id, count + 1);
    }
  }

  return examples;
}
