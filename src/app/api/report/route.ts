/**
 * POST /api/report
 *
 * Submit a hygiene report for a restaurant. Validates input, checks restaurant
 * existence, saves the report, and updates the hygiene score.
 *
 * Partial failure handling: if saveHygieneReport succeeds but updateHygieneScore
 * fails, returns 200 with the pre-update restaurant data (not an error).
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 6.1, 6.2, 6.3, 6.4, 6.5, 6.6,
 *               6.7, 10.1, 10.2, 10.3, 10.4, 10.6, 10.7
 */

import {
  supabase,
  saveHygieneReport,
  updateHygieneScore,
} from "@/lib/supabase/queries";
import { headers } from "next/headers";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** UUID v4 format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const VALID_REPORT_TYPES = ["RED_FLAG", "CLEAN"] as const;
type ReportType = (typeof VALID_REPORT_TYPES)[number];
const REPORT_COOLDOWN_MS = 24 * 60 * 60 * 1000;

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
    // 2. Validate restaurant_id — required, must be a valid UUID string
    // ------------------------------------------------------------------
    const { restaurant_id, report_type, description } = params;

    if (
      restaurant_id === undefined ||
      restaurant_id === null ||
      typeof restaurant_id !== "string" ||
      !UUID_REGEX.test(restaurant_id)
    ) {
      return Response.json(
        {
          error:
            'Parameter "restaurant_id" is required and must be a valid UUID (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).',
          code: "INVALID_INPUT",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------
    // 3. Validate report_type — required, must be "RED_FLAG" or "CLEAN"
    // ------------------------------------------------------------------
    if (
      report_type === undefined ||
      report_type === null ||
      !VALID_REPORT_TYPES.includes(report_type as ReportType)
    ) {
      return Response.json(
        {
          error:
            'Parameter "report_type" is required and must be "RED_FLAG" or "CLEAN".',
          code: "INVALID_REPORT_TYPE",
        },
        { status: 400 }
      );
    }

    // ------------------------------------------------------------------
    // 4. Validate description — optional, max 1000 characters
    // ------------------------------------------------------------------
    if (
      description !== undefined &&
      description !== null &&
      (typeof description !== "string" || description.length > 1000)
    ) {
      return Response.json(
        {
          error:
            'Parameter "description" must be a string with at most 1000 characters.',
          code: "INVALID_INPUT",
        },
        { status: 400 }
      );
    }

    // Cast to concrete types after validation
    const restaurantId = restaurant_id;
    const reportType = report_type as ReportType;
    const descriptionValue =
      typeof description === "string" ? description : undefined;
    const headerList = await headers();
    const forwardedFor = headerList.get("x-forwarded-for");
    const reporterIp = forwardedFor?.split(",")[0]?.trim() || "unknown";

    // ------------------------------------------------------------------
    // 5. Check restaurant existence in DB
    // ------------------------------------------------------------------
    const { data: restaurantData, error: restaurantError } = await supabase
      .from("restaurants")
      .select(
        "id, hygiene_score, is_verified_safe, name, category, price_tier, location, created_at"
      )
      .eq("id", restaurantId)
      .single();

    if (restaurantError || !restaurantData) {
      // PostgREST returns PGRST116 when no rows found via .single()
      return Response.json(
        {
          error: `Restaurant with id "${restaurantId}" was not found.`,
          code: "RESTAURANT_NOT_FOUND",
        },
        { status: 404 }
      );
    }

    // Keep a snapshot of the restaurant before any updates (for partial failure)
    const preUpdateRestaurant = restaurantData;

    // ------------------------------------------------------------------
    // 6. Rate limit: 1 report per IP per restaurant per 24 hours
    // ------------------------------------------------------------------
    const cooldownThresholdIso = new Date(
      Date.now() - REPORT_COOLDOWN_MS,
    ).toISOString();
    const { data: existingReports, error: rateLimitError } = await supabase
      .from("hygiene_reports")
      .select("id")
      .eq("restaurant_id", restaurantId)
      .eq("reporter_ip", reporterIp)
      .gt("created_at", cooldownThresholdIso)
      .limit(1);

    if (rateLimitError) {
      return Response.json(
        {
          error: `Failed to validate report cooldown: ${rateLimitError.message}`,
          code: "DATABASE_ERROR",
        },
        { status: 500 },
      );
    }

    if (existingReports && existingReports.length > 0) {
      return Response.json(
        {
          error: "COOLDOWN_ACTIVE",
          message:
            "Kamu sudah melaporkan warung ini hari ini. Coba lagi besok ya.",
        },
        { status: 429 },
      );
    }

    // ------------------------------------------------------------------
    // 7. Save the hygiene report
    // ------------------------------------------------------------------
    await saveHygieneReport(
      restaurantId,
      reportType,
      descriptionValue,
      reporterIp,
    );

    // ------------------------------------------------------------------
    // 8. Update hygiene score — partial failure: if this fails, return 200
    //    with the pre-update restaurant data
    // ------------------------------------------------------------------
    let updatedRestaurant;
    try {
      updatedRestaurant = await updateHygieneScore(restaurantId, reportType);
    } catch (updateError) {
      // Report was saved successfully; score update failed.
      // Per design: return 200 with pre-update data (not an error).
      const message =
        updateError instanceof Error ? updateError.message : String(updateError);
      console.warn(
        `[POST /api/report] Score update failed for restaurant "${restaurantId}" ` +
          `(report saved successfully). Returning pre-update data. Error: ${message}`
      );
      return Response.json(
        { data: preUpdateRestaurant },
        { status: 200 }
      );
    }

    // ------------------------------------------------------------------
    // 9. Return success response with updated restaurant data
    // ------------------------------------------------------------------
    return Response.json({ data: updatedRestaurant }, { status: 200 });
  } catch (error) {
    // ------------------------------------------------------------------
    // 10. Catch-all: unexpected errors → INTERNAL_ERROR
    // ------------------------------------------------------------------
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : "";
    console.error("[POST /api/report] Unexpected error:", { message, stack });
    return Response.json(
      {
        error: `Internal server error: ${message}`,
        code: "INTERNAL_ERROR",
        details: process.env.NODE_ENV === "development" ? stack : undefined,
      },
      { status: 500 }
    );
  }
}
