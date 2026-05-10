import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  fromMock,
  saveHygieneReportMock,
  updateHygieneScoreMock,
} = vi.hoisted(() => ({
  fromMock: vi.fn(),
  saveHygieneReportMock: vi.fn(),
  updateHygieneScoreMock: vi.fn(),
}));

vi.mock("@/lib/supabase/queries", () => ({
  supabase: {
    from: fromMock,
  },
  saveHygieneReport: saveHygieneReportMock,
  updateHygieneScore: updateHygieneScoreMock,
}));

import { POST } from "@/app/api/report/route";

describe("POST /api/report", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("rejects invalid report types", async () => {
    const response = await POST(
      new Request("http://localhost/api/report", {
        method: "POST",
        body: JSON.stringify({
          restaurant_id: "11111111-1111-1111-1111-111111111111",
          report_type: "DIRTY",
        }),
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "INVALID_REPORT_TYPE",
    });
  });

  it("returns 404 when the restaurant is missing", async () => {
    const singleMock = vi.fn().mockResolvedValue({
      data: null,
      error: { code: "PGRST116", message: "No rows found" },
    });
    const eqMock = vi.fn().mockReturnValue({ single: singleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ select: selectMock });

    const response = await POST(
      new Request("http://localhost/api/report", {
        method: "POST",
        body: JSON.stringify({
          restaurant_id: "11111111-1111-1111-1111-111111111111",
          report_type: "RED_FLAG",
        }),
      })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      code: "RESTAURANT_NOT_FOUND",
    });
  });

  it("saves the report and returns updated restaurant data", async () => {
    const restaurantRecord = {
      id: "11111111-1111-1111-1111-111111111111",
      hygiene_score: 90,
      is_verified_safe: true,
      name: "Ayam Geprek",
      category: "Ayam",
      price_tier: 15000,
      location: "POINT(107.77 -6.92)",
      created_at: "2026-05-10T00:00:00Z",
    };

    const singleMock = vi.fn().mockResolvedValue({
      data: restaurantRecord,
      error: null,
    });
    const eqMock = vi.fn().mockReturnValue({ single: singleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ select: selectMock });

    saveHygieneReportMock.mockResolvedValue(undefined);
    updateHygieneScoreMock.mockResolvedValue({
      ...restaurantRecord,
      hygiene_score: 40,
      is_verified_safe: false,
    });

    const response = await POST(
      new Request("http://localhost/api/report", {
        method: "POST",
        body: JSON.stringify({
          restaurant_id: "11111111-1111-1111-1111-111111111111",
          report_type: "RED_FLAG",
          description: "Banyak lalat",
        }),
      })
    );

    expect(response.status).toBe(200);
    expect(saveHygieneReportMock).toHaveBeenCalledWith(
      "11111111-1111-1111-1111-111111111111",
      "RED_FLAG",
      "Banyak lalat"
    );
    await expect(response.json()).resolves.toEqual({
      data: {
        ...restaurantRecord,
        hygiene_score: 40,
        is_verified_safe: false,
      },
    });
  });

  it("returns the pre-update restaurant when score update fails", async () => {
    const restaurantRecord = {
      id: "11111111-1111-1111-1111-111111111111",
      hygiene_score: 90,
      is_verified_safe: true,
      name: "Ayam Geprek",
      category: "Ayam",
      price_tier: 15000,
      location: "POINT(107.77 -6.92)",
      created_at: "2026-05-10T00:00:00Z",
    };

    const singleMock = vi.fn().mockResolvedValue({
      data: restaurantRecord,
      error: null,
    });
    const eqMock = vi.fn().mockReturnValue({ single: singleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: eqMock });
    fromMock.mockReturnValue({ select: selectMock });

    saveHygieneReportMock.mockResolvedValue(undefined);
    updateHygieneScoreMock.mockRejectedValue(new Error("update failed"));

    const response = await POST(
      new Request("http://localhost/api/report", {
        method: "POST",
        body: JSON.stringify({
          restaurant_id: "11111111-1111-1111-1111-111111111111",
          report_type: "RED_FLAG",
        }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: restaurantRecord,
    });
  });
});