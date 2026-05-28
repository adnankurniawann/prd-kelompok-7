/**
 * Query Layer — all Supabase read/write operations for Gacha Makan.
 * Imports the shared supabase singleton; never creates a new instance.
 */

import { supabase } from "@/lib/supabase/client";

// Re-export supabase so other modules in this layer can use it without
// importing client.ts directly (keeps the import graph clean).
export { supabase };

// ---------------------------------------------------------------------------
// TypeScript interfaces
// ---------------------------------------------------------------------------

/** Raw restaurant row as returned by the database. */
export interface Restaurant {
  id: string;
  name: string;
  category: string | null;
  price_tier: number;
  location: unknown; // PostGIS geography — parsed by the Query Layer
  hygiene_score: number;
  is_verified_safe: boolean;
  created_at: string;
}

/** Restaurant enriched with a pre-calculated distance field (for /api/spin). */
export interface RestaurantWithDistance {
  id: string;
  name: string;
  category: string | null;
  price_tier: number;
  hygiene_score: number;
  distance: number; // integer meters, rounded
}

interface EligibleRestaurantRecord {
  id: string;
  name: string;
  category: string | null;
  price_tier: number;
  hygiene_score: number;
  distance: number;
}

/** Aggregated counts for dashboard statistics (matches map hygiene_status rules). */
export interface RestaurantStats {
  total: number;
  safe: number;
  redFlag: number;
}

/** Recent hygiene report for homepage feed. */
export interface RecentHygieneReport {
  id: string;
  report_type: "RED_FLAG" | "CLEAN";
  description: string | null;
  created_at: string;
  restaurant_id: string;
  restaurant_name: string;
  is_verified_safe: boolean;
}

interface HygieneReportRow {
  id: string;
  report_type: string;
  description: string | null;
  created_at: string;
  restaurant_id: string;
  restaurants:
    | {
        id: string;
        name: string;
        is_verified_safe: boolean;
      }
    | {
        id: string;
        name: string;
        is_verified_safe: boolean;
      }[]
    | null;
}

/** Restaurant with parsed coordinates and hygiene status (for /api/restaurants map). */
export interface RestaurantWithCoords {
  id: string;
  name: string;
  category: string | null;
  price_tier: number;
  hygiene_score: number;
  is_verified_safe: boolean;
  lat: number;
  lng: number;
  hygiene_status: "RED" | "GREEN";
}

// ---------------------------------------------------------------------------
// PostGIS coordinate helpers
// ---------------------------------------------------------------------------

/**
 * Converts a lat/lng pair into a PostGIS WKT point string.
 *
 * @param lat - Latitude in degrees, must be in [-90, 90]
 * @param lng - Longitude in degrees, must be in [-180, 180]
 * @returns WKT string `POINT(lng lat)` suitable for Supabase geography columns
 * @throws {RangeError} If lat or lng is outside its valid range
 *
 * Requirements: 11.3, 11.4
 */
export function formatToPostGISPoint(lat: number, lng: number): string {
  if (lat < -90 || lat > 90) {
    throw new RangeError(
      `formatToPostGISPoint: "lat" value ${lat} is out of range [-90, 90]`
    );
  }
  if (lng < -180 || lng > 180) {
    throw new RangeError(
      `formatToPostGISPoint: "lng" value ${lng} is out of range [-180, 180]`
    );
  }
  // WKT uses (longitude latitude) order — opposite of the common (lat, lng) convention.
  return `POINT(${lng} ${lat})`;
}

/**
 * Parses a PostGIS geography value into a plain `{ lat, lng }` object.
 *
 * Supabase can return geography columns in two formats depending on the query:
 *   - GeoJSON Geometry object: `{ type: "Point", coordinates: [lng, lat] }`
 *   - WKT string:              `"POINT(lng lat)"`
 *
 * @param geographyValue - The raw value from the Supabase response
 * @returns `{ lat: number; lng: number }`
 * @throws {Error} If the value cannot be parsed (unknown format, wrong type, invalid coords)
 *
 * Requirements: 11.1, 11.2
 */
export function parsePostGISPoint(
  geographyValue: unknown
): { lat: number; lng: number } {
  // --- GeoJSON Geometry object ---
  if (
    geographyValue !== null &&
    typeof geographyValue === "object" &&
    !Array.isArray(geographyValue)
  ) {
    const obj = geographyValue as Record<string, unknown>;

    if (obj["type"] !== "Point") {
      throw new Error(
        `parsePostGISPoint: expected GeoJSON type "Point" but received type ` +
          `"${String(obj["type"])}" in value: ${JSON.stringify(geographyValue)}`
      );
    }

    const coords = obj["coordinates"];
    if (
      !Array.isArray(coords) ||
      coords.length < 2 ||
      typeof coords[0] !== "number" ||
      typeof coords[1] !== "number"
    ) {
      throw new Error(
        `parsePostGISPoint: GeoJSON "coordinates" must be [lng, lat] numbers, ` +
          `but received: ${JSON.stringify(coords)}`
      );
    }

    const lng = coords[0] as number;
    const lat = coords[1] as number;
    return { lat, lng };
  }

  // --- WKT string: POINT(lng lat) ---
  if (typeof geographyValue === "string") {
    if (/^[0-9a-f]+$/i.test(geographyValue.trim()) && geographyValue.length >= 42) {
      const hex = geographyValue.trim();

      if (hex.length % 2 !== 0) {
        throw new Error(
          `parsePostGISPoint: invalid EWKB hex string length. Received: "${geographyValue}"`
        );
      }

      const bytes = new Uint8Array(hex.length / 2);
      for (let index = 0; index < hex.length; index += 2) {
        bytes[index / 2] = Number.parseInt(hex.slice(index, index + 2), 16);
      }

      const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
      const littleEndian = view.getUint8(0) === 1;
      if (!littleEndian) {
        throw new Error(
          `parsePostGISPoint: unsupported EWKB byte order. Received: "${geographyValue}"`
        );
      }

      const geometryType = view.getUint32(1, true);
      const pointType = geometryType & 0xFF;
      if (pointType !== 1) {
        throw new Error(
          `parsePostGISPoint: expected EWKB Point but received geometry type ${pointType}. Value: "${geographyValue}"`
        );
      }

      const hasSrid = (geometryType & 0x20000000) !== 0;
      const coordinateOffset = hasSrid ? 9 : 5;
      const lng = view.getFloat64(coordinateOffset, true);
      const lat = view.getFloat64(coordinateOffset + 8, true);

      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        throw new Error(
          `parsePostGISPoint: invalid EWKB coordinate values. Received: "${geographyValue}"`
        );
      }

      return { lat, lng };
    }

    const match = geographyValue
      .trim()
      .match(/^POINT\(\s*(-?\d+(?:\.\d+)?)\s+(-?\d+(?:\.\d+)?)\s*\)$/i);

    if (!match) {
      throw new Error(
        `parsePostGISPoint: cannot parse WKT string. ` +
          `Expected format "POINT(lng lat)" but received: "${geographyValue}"`
      );
    }

    const lng = parseFloat(match[1]);
    const lat = parseFloat(match[2]);
    return { lat, lng };
  }

  // --- Unknown format ---
  throw new Error(
    `parsePostGISPoint: unsupported value type "${typeof geographyValue}". ` +
      `Expected a GeoJSON Point object or a WKT "POINT(lng lat)" string. ` +
      `Received: ${JSON.stringify(geographyValue)}`
  );
}

// ---------------------------------------------------------------------------
// Query functions
// ---------------------------------------------------------------------------

/**
 * Returns restaurant counts for the home dashboard.
 * Safe / Red Flag use the same rule as map API: GREEN if hygiene_score >= 50.
 */
export async function getRestaurantStats(): Promise<RestaurantStats> {
  const [totalResult, safeResult, redFlagResult] = await Promise.all([
    supabase.from("restaurants").select("*", { count: "exact", head: true }),
    supabase
      .from("restaurants")
      .select("*", { count: "exact", head: true })
      .gte("hygiene_score", 50),
    supabase
      .from("restaurants")
      .select("*", { count: "exact", head: true })
      .lt("hygiene_score", 50),
  ]);

  if (totalResult.error) {
    throw new Error(
      `getRestaurantStats: failed to count restaurants. ` +
        `Supabase error: ${totalResult.error.message} (code: ${totalResult.error.code})`,
    );
  }

  if (safeResult.error) {
    throw new Error(
      `getRestaurantStats: failed to count safe restaurants. ` +
        `Supabase error: ${safeResult.error.message} (code: ${safeResult.error.code})`,
    );
  }

  if (redFlagResult.error) {
    throw new Error(
      `getRestaurantStats: failed to count red-flag restaurants. ` +
        `Supabase error: ${redFlagResult.error.message} (code: ${redFlagResult.error.code})`,
    );
  }

  return {
    total: totalResult.count ?? 0,
    safe: safeResult.count ?? 0,
    redFlag: redFlagResult.count ?? 0,
  };
}

/**
 * Fetches the most recent hygiene reports with restaurant names for the homepage.
 */
export async function getRecentHygieneReports(
  limit = 5,
): Promise<RecentHygieneReport[]> {
  const { data, error } = await supabase
    .from("hygiene_reports")
    .select(
      `
      id,
      report_type,
      description,
      created_at,
      restaurant_id,
      restaurants (
        id,
        name,
        is_verified_safe
      )
    `,
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(
      `getRecentHygieneReports: failed to fetch reports. ` +
        `Supabase error: ${error.message} (code: ${error.code})`,
    );
  }

  const rows = (data ?? []) as HygieneReportRow[];

  return rows
    .map((row) => {
      const restaurant = Array.isArray(row.restaurants)
        ? row.restaurants[0]
        : row.restaurants;

      if (!restaurant) {
        return null;
      }

      const reportType =
        row.report_type === "RED_FLAG" || row.report_type === "CLEAN"
          ? row.report_type
          : null;

      if (!reportType) {
        return null;
      }

      return {
        id: row.id,
        report_type: reportType,
        description: row.description,
        created_at: row.created_at,
        restaurant_id: row.restaurant_id,
        restaurant_name: restaurant.name,
        is_verified_safe: restaurant.is_verified_safe,
      };
    })
    .filter((row): row is RecentHygieneReport => row !== null);
}

/**
 * Fetches all restaurants from the database and enriches each row with
 * parsed coordinates and a derived hygiene status.
 *
 * @returns Array of `RestaurantWithCoords` — one entry per restaurant row.
 * @throws {Error} If the Supabase query fails for any reason.
 *
 * Requirements: 9.2, 4.1, 4.2, 4.3
 */
export async function getAllRestaurants(): Promise<RestaurantWithCoords[]> {
  const { data, error } = await supabase.from("restaurants").select("*");

  if (error) {
    throw new Error(
      `getAllRestaurants: failed to fetch restaurants from database. ` +
        `Supabase error: ${error.message} (code: ${error.code})`
    );
  }

  const rows = (data ?? []) as Restaurant[];

  return rows.map((row) => {
    const { lat, lng } = parsePostGISPoint(row.location);
    const hygiene_status: "RED" | "GREEN" =
      row.hygiene_score >= 50 ? "GREEN" : "RED";

    return {
      id: row.id,
      name: row.name,
      category: row.category,
      price_tier: row.price_tier,
      hygiene_score: row.hygiene_score,
      is_verified_safe: row.is_verified_safe,
      lat,
      lng,
      hygiene_status,
    };
  });
}

/**
 * Returns restaurants eligible for the gacha spin, filtered by:
 *   - hygiene_score >= 50 (absolute safety filter)
 *   - price_tier <= budget
 *   - distance from user location <= radiusMeters (computed in PostGIS)
 *
 * The query is delegated to a Supabase SQL function so the distance filter is
 * executed with `ST_DistanceSphere` inside PostgreSQL.
 *
 * @param budget       - Maximum price tier in Rupiah (inclusive)
 * @param radiusMeters - Maximum distance from user in meters (inclusive)
 * @param userLat      - User latitude in degrees [-90, 90]
 * @param userLng      - User longitude in degrees [-180, 180]
 * @returns Array of restaurants with a rounded integer `distance` field
 * @throws {Error} If the Supabase query fails
 *
 * Requirements: 9.1, 1.1, 2.1
 */
export async function getEligibleRestaurants(
  budget: number,
  radiusMeters: number,
  userLat: number,
  userLng: number
): Promise<RestaurantWithDistance[]> {
  const { data, error } = await supabase.rpc("get_eligible_restaurants", {
    budget,
    radius_meters: radiusMeters,
    user_lat: userLat,
    user_lng: userLng,
  });

  if (error) {
    throw new Error(
      `getEligibleRestaurants: Supabase query failed — ${error.message} (code: ${error.code})`
    );
  }

  const rows = (data ?? []) as EligibleRestaurantRecord[];

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    category: row.category,
    price_tier: row.price_tier,
    hygiene_score: row.hygiene_score,
    distance: Math.round(row.distance),
  }));
}

/**
 * Saves a hygiene report for a restaurant.
 *
 * Inserts a new row into the `hygiene_reports` table with `user_id` set to
 * `null` to support Guest Mode (no authentication required).
 *
 * @param restaurantId - UUID of the restaurant being reported
 * @param reportType   - Either `"RED_FLAG"` (dirty) or `"CLEAN"` (clean)
 * @param description  - Optional free-text description (max 1000 chars)
 * @throws {Error} If the Supabase insert fails for any reason
 *
 * Requirements: 9.3, 5.6
 */
export async function saveHygieneReport(
  restaurantId: string,
  reportType: "RED_FLAG" | "CLEAN",
  description?: string,
  reporterIp?: string
): Promise<void> {
  console.log(`[saveHygieneReport] Saving report for restaurant ${restaurantId}, type: ${reportType}`);
  
  const { error } = await supabase.from("hygiene_reports").insert({
    user_id: null,
    restaurant_id: restaurantId,
    report_type: reportType,
    description: description ?? null,
    reporter_ip: reporterIp ?? null,
  });

  if (error) {
    console.error(`[saveHygieneReport] Supabase error:`, error);
    throw new Error(
      `saveHygieneReport: failed to insert hygiene report for restaurant ` +
        `"${restaurantId}". Supabase error: ${error.message} (code: ${error.code})`
    );
  }
  
  console.log(`[saveHygieneReport] Successfully saved report`);
}

/**
 * Fetches the current hygiene score for a restaurant, computes the new score
 * based on the report type, updates the database, and returns the updated row.
 *
 * Score rules:
 *   - RED_FLAG: new_score = max(0, current_score - 50)
 *   - CLEAN:    new_score = min(100, current_score + 20)
 *
 * If the new score is < 50, `is_verified_safe` is set to `false`.
 * If the new score is >= 50 (only possible via CLEAN), `is_verified_safe` is
 * left unchanged (not automatically set to true — Requirement 6.4).
 *
 * @param restaurantId - UUID of the restaurant to update
 * @param reportType   - `'RED_FLAG'` or `'CLEAN'`
 * @returns The updated `Restaurant` row
 * @throws {Error} If the SELECT or UPDATE query fails
 *
 * Requirements: 9.4, 6.1, 6.2, 6.3, 6.4
 */
export async function updateHygieneScore(
  restaurantId: string,
  reportType: "RED_FLAG" | "CLEAN"
): Promise<Restaurant> {
  // Step 1: Fetch current hygiene_score
  console.log(`[updateHygieneScore] Fetching current score for restaurant ${restaurantId}`);
  
  const { data: selectData, error: selectError } = await supabase
    .from("restaurants")
    .select("hygiene_score")
    .eq("id", restaurantId)
    .single();

  if (selectError) {
    console.error(`[updateHygieneScore] Select error:`, selectError);
    throw new Error(
      `updateHygieneScore: failed to fetch current hygiene_score for restaurant "${restaurantId}". ` +
        `Supabase error: ${selectError.message} (code: ${selectError.code})`
    );
  }

  const currentScore: number = (selectData as { hygiene_score: number })
    .hygiene_score;

  // Step 2: Calculate new score
  const newScore =
    reportType === "RED_FLAG"
      ? Math.max(0, currentScore - 50)
      : Math.min(100, currentScore + 20);

  console.log(`[updateHygieneScore] Current score: ${currentScore}, New score: ${newScore}`);

  // Step 3: Build update payload — only set is_verified_safe when score drops below 50
  const updatePayload: { hygiene_score: number; is_verified_safe?: boolean } = {
    hygiene_score: newScore,
    ...(newScore < 50 ? { is_verified_safe: false } : {}),
  };

  // Step 4: Update the row and return the updated data
  console.log(`[updateHygieneScore] Updating restaurant with payload:`, updatePayload);
  
  const { data: updateData, error: updateError } = await supabase
    .from("restaurants")
    .update(updatePayload)
    .eq("id", restaurantId)
    .select()
    .single();

  if (updateError) {
    console.error(`[updateHygieneScore] Update error:`, updateError);
    throw new Error(
      `updateHygieneScore: failed to update hygiene_score for restaurant "${restaurantId}". ` +
        `Supabase error: ${updateError.message} (code: ${updateError.code})`
    );
  }

  console.log(`[updateHygieneScore] Successfully updated score`);
  return updateData as Restaurant;
}
