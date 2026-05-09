/**
 * POST /api/spin
 *
 * Spin the gacha: filter eligible restaurants by hygiene, budget, and radius,
 * then perform weighted random selection and return the chosen restaurant.
 *
 * Requirements: 1.1, 1.2, 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5,
 *               10.1, 10.2, 10.3, 10.6, 10.7
 */

import { getEligibleRestaurants } from "@/lib/supabase/queries";
import { weightedRandom } from "@/utils/gacha";

// ---------------------------------------------------------------------------
// Input validation helpers
// ---------------------------------------------------------------------------

/**
 * Returns true if `value` is a finite integer within [min, max] (inclusive).
 */
function isValidInteger(value: unknown, min: number, max: number): boolean {
  if (typeof value !== "number") return false;
  if (!Number.isFinite(value)) return false;
  if (!Number.isInteger(value)) return false;
  return value >= min && value <= max;
}

/**
 * Returns true if `value` is a finite float within [min, max] (inclusive).
 */
function isValidFloat(value: unknown, min: number, max: number): boolean {
  if (typeof value !== "number") return false;
  if (!Number.isFinite(value)) return false;
  return value >= min && value <= max;
}

// ---------------------------------------------------------------------------
// Route Handler
// ---------------------------------------------------------------------------

export async function POST(request: Request): Promise<Response> {
  try {
    // ------------------------------------------------------------------
    // 1. Parse JSON body
    // ------------------------------------------------------------------
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return Response.json(
        { error: "Request body must be valid JSON.", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    if (body === null || typeof body !== "object" || Array.isArray(body)) {
      return Response.json(
        { error: "Request body must be a JSON object.", code: "INVALID_INPUT" },
        { status: 400 }
      );
    }

    const params = body as Record<string, unknown>;

    // ------------------------------------------------------------------
    // 2. Check required fields are present
    // ------------------------------------------------------------------
    const requiredFields = ["budget", "radius", "user_lat", "user_lng"] as const;
    for (const field of requiredFields) {
      if (!(field in params) || params[field] === undefined || params[field] === null) {
        return Response.json(
          {
            error: `Missing required parameter: "${field}".`,
            code: "INVALID_INPUT",
          },
          { status: 400 }
        );
      }
    }

    const { budget, radius, user_lat, user_lng } = params;

    // ------------------------------------------------------------------
    // 3. Validate ranges
    //    budget:   integer, 1 – 100_000_000
    //    radius:   integer, 1 – 50_000
    //    user_lat: float,   -90 – 90
    //    user_lng: float,   -180 – 180
    // ------------------------------------------------------------------
    if (!isValidInteger(budget, 1, 100_000_000)) {
      return Response.json(
        {
          error:
            'Parameter "budget" must be an integer between 1 and 100,000,000.',
          code: "INVALID_INPUT",
        },
        { status: 400 }
      );
    }

    if (!isValidInteger(radius, 1, 50_000)) {
      return Response.json(
        {
          error:
            'Parameter "radius" must be an integer between 1 and 50,000.',
          code: "INVALID_INPUT",
        },
        { status: 400 }
      );
    }

    if (!isValidFloat(user_lat, -90, 90)) {
      return Response.json(
        {
          error: 'Parameter "user_lat" must be a float between -90 and 90.',
          code: "INVALID_INPUT",
        },
        { status: 400 }
      );
    }

    if (!isValidFloat(user_lng, -180, 180)) {
      return Response.json(
        {
          error: 'Parameter "user_lng" must be a float between -180 and 180.',
          code: "INVALID_INPUT",
        },
        { status: 400 }
      );
    }

    // All params are now validated — cast to their concrete types.
    const budgetNum = budget as number;
    const radiusNum = radius as number;
    const userLat = user_lat as number;
    const userLng = user_lng as number;

    // ------------------------------------------------------------------
    // 4. Fetch eligible restaurants (hygiene >= 50, price_tier <= budget,
    //    distance <= radius)
    // ------------------------------------------------------------------
    let candidates;
    try {
      candidates = await getEligibleRestaurants(
        budgetNum,
        radiusNum,
        userLat,
        userLng
      );
    } catch (dbError) {
      // Errors thrown by getEligibleRestaurants are DB errors.
      const message =
        dbError instanceof Error ? dbError.message : String(dbError);
      console.error("[POST /api/spin] Database error:", message);
      return Response.json(
        {
          error: `Database error while fetching restaurants: ${message}`,
          code: "DATABASE_ERROR",
        },
        { status: 500 }
      );
    }

    // ------------------------------------------------------------------
    // 5. Return 404 if no eligible restaurants found
    // ------------------------------------------------------------------
    if (candidates.length === 0) {
      return Response.json(
        {
          error:
            "No eligible restaurants found for the given budget and radius.",
          code: "NO_ELIGIBLE_RESTAURANTS",
        },
        { status: 404 }
      );
    }

    // ------------------------------------------------------------------
    // 6. Calculate weights: max(1, budget - price_tier)
    // ------------------------------------------------------------------
    const weights = candidates.map((r) =>
      Math.max(1, budgetNum - r.price_tier)
    );

    // ------------------------------------------------------------------
    // 7. Weighted random selection
    // ------------------------------------------------------------------
    const selected = weightedRandom(candidates, weights);

    // ------------------------------------------------------------------
    // 8. Return success response with the 6 required fields
    // ------------------------------------------------------------------
    return Response.json(
      {
        data: {
          id: selected.id,
          name: selected.name,
          category: selected.category,
          price_tier: selected.price_tier,
          distance: selected.distance,
          hygiene_score: selected.hygiene_score,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    // ------------------------------------------------------------------
    // 9. Catch-all: unexpected errors → INTERNAL_ERROR
    // ------------------------------------------------------------------
    const message = error instanceof Error ? error.message : String(error);
    console.error("[POST /api/spin] Unexpected error:", message);
    return Response.json(
      {
        error: `Internal server error: ${message}`,
        code: "INTERNAL_ERROR",
      },
      { status: 500 }
    );
  }
}
