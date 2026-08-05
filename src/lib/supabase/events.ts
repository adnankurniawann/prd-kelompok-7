import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Pencatatan spin_events. Hanya dipakai dari route handler.
 *
 * Dipakai dari server, bukan dari klien, karena dua alasan. Pertama, klien
 * `supabase-js` tidak boleh masuk bundle halaman spin — Fase C sengaja
 * mengeluarkannya. Kedua, nilai seperti jarak dan jumlah kandidat berasal dari
 * hasil query PostGIS; mengirimkannya ke browser lalu menerimanya kembali
 * hanya membuka jalan bagi angka yang tidak sesuai kenyataan.
 */

export interface SpinEventContext {
  sessionId: string;
  restaurantId: string;
  userLat: number;
  userLng: number;
  /** Meter, seperti yang ditampilkan ke pengguna. */
  distanceMeters: number;
  /** Berapa kandidat yang lolos filter saat penayangan ini. */
  candidateCount: number;
  policy: string;
}

const JAKARTA_TIME_ZONE = "Asia/Jakarta";

/**
 * Konteks waktu lokal saat penayangan, dibekukan sebagai angka.
 *
 * Dihitung di sini, bukan diturunkan dari `shown_at` saat analisis. Menghitung
 * ulang belakangan berarti memakai aturan zona waktu yang berlaku hari itu
 * atas peristiwa yang sudah lewat, dan membuat fitur model berbeda dari yang
 * berlaku saat keputusannya diambil.
 */
export function localTimeContext(at: Date): {
  hourLocal: number;
  dayOfWeek: number;
  isWeekend: boolean;
} {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: JAKARTA_TIME_ZONE,
    hour: "numeric",
    hour12: false,
    weekday: "short",
  }).formatToParts(at);

  const hourPart = parts.find((part) => part.type === "hour")?.value ?? "0";
  const weekdayPart = parts.find((part) => part.type === "weekday")?.value ?? "Sun";

  // 0 = Minggu, sama dengan extract(dow) di Postgres dan Date.getDay().
  const weekdayIndex: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  // Intl memakai 24 untuk tengah malam di sebagian runtime.
  const hourLocal = Number(hourPart) % 24;
  const dayOfWeek = weekdayIndex[weekdayPart] ?? 0;

  return {
    hourLocal,
    dayOfWeek,
    isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
  };
}

/**
 * Mencatat satu penayangan hasil spin.
 *
 * Mengembalikan id barisnya, atau `null` kalau tidak tercatat. SETIAP
 * kegagalan di sini diserap: spin yang berhasil tidak boleh berubah jadi error
 * hanya karena logging-nya gagal. Yang hilang cuma satu baris data.
 *
 * Kasus `null` yang paling sering: pengunjung belum punya sesi karena
 * Anonymous sign-ins belum dinyalakan di Supabase Dashboard.
 */
export async function recordSpinEvent(
  context: SpinEventContext,
): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Tanpa user_id, barisnya tidak bisa dikaitkan ke siapa pun dan RLS
      // memang akan menolaknya.
      return null;
    }

    const shownAt = new Date();
    const { hourLocal, dayOfWeek, isWeekend } = localTimeContext(shownAt);

    const { data, error } = await supabase
      .from("spin_events")
      .insert({
        user_id: user.id,
        session_id: context.sessionId,
        restaurant_id: context.restaurantId,
        shown_at: shownAt.toISOString(),
        user_lat: context.userLat,
        user_lng: context.userLng,
        distance_km: Number((context.distanceMeters / 1000).toFixed(3)),
        hour_local: hourLocal,
        day_of_week: dayOfWeek,
        is_weekend: isWeekend,
        policy: context.policy,
        candidate_n: context.candidateCount,
      })
      .select("id")
      .single();

    if (error) {
      console.warn("[recordSpinEvent] Gagal mencatat penayangan:", error.message);
      return null;
    }

    return (data as { id: string }).id;
  } catch (error) {
    console.warn("[recordSpinEvent] Gagal mencatat penayangan:", error);
    return null;
  }
}

export type SpinAction = "accepted" | "respun" | "saved";

/**
 * Mencatat respons pengguna atas satu penayangan.
 *
 * Lewat fungsi database `record_spin_action`, bukan UPDATE langsung: klien
 * memang tidak punya hak update ke tabel ini, dan aturan "respons pertama yang
 * menang" dipaksakan di sisi database supaya tidak bisa dilewati.
 *
 * `false` berarti tidak ada yang berubah — biasanya karena baris itu sudah
 * punya respons. Itu bukan error.
 */
export async function recordSpinAction(
  eventId: string,
  action: SpinAction,
): Promise<boolean> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase.rpc("record_spin_action", {
    p_event_id: eventId,
    p_action: action,
  });

  if (error) {
    console.warn("[recordSpinAction] Gagal mencatat respons:", error.message);
    return false;
  }

  return data === true;
}
