import { beforeEach, describe, expect, it, vi } from "vitest";

const { rpcMock, fromMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
  fromMock: vi.fn(),
}));

vi.mock("@/lib/supabase/client", () => ({
  supabase: {
    rpc: rpcMock,
    from: fromMock,
  },
}));

import {
  formatToPostGISPoint,
  getAllRestaurants,
  getEligibleRestaurants,
  parsePostGISPoint,
  saveHygieneReport,
  updateHygieneScore,
} from "@/lib/supabase/queries";

describe("PostGIS helpers", () => {
  it("formats a WKT point using longitude-first order", () => {
    expect(formatToPostGISPoint(-6.92, 107.77)).toBe("POINT(107.77 -6.92)");
  });

  it("rejects coordinates outside valid ranges", () => {
    expect(() => formatToPostGISPoint(91, 107.77)).toThrow(RangeError);
    expect(() => formatToPostGISPoint(-6.92, 181)).toThrow(RangeError);
  });

  it("parses GeoJSON and WKT geography values", () => {
    expect(
      parsePostGISPoint({ type: "Point", coordinates: [107.77, -6.92] })
    ).toEqual({ lat: -6.92, lng: 107.77 });
    expect(parsePostGISPoint("POINT(107.77 -6.92)")).toEqual({
      lat: -6.92,
      lng: 107.77,
    });
  });

  it("parses EWKB hex geography values returned by Supabase", () => {
    expect(
      parsePostGISPoint("0101000020E61000002D78D15790F15A409566F3380CB61BC0")
    ).toEqual({ lat: -6.927781, lng: 107.774435 });
  });
});

describe("getEligibleRestaurants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls the PostGIS RPC with the expected parameters and rounds distance", async () => {
    rpcMock.mockResolvedValue({
      data: [
        {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Ayam Geprek",
          category: "Ayam",
          price_tier: 15000,
          hygiene_score: 90,
          distance: 123.6,
        },
        {
          id: "22222222-2222-2222-2222-222222222222",
          name: "Warteg Bahari",
          category: null,
          price_tier: 12000,
          hygiene_score: 80,
          distance: 987.2,
        },
      ],
      error: null,
    });

    const result = await getEligibleRestaurants(20000, 1000, -6.92, 107.77);

    expect(rpcMock).toHaveBeenCalledWith("get_eligible_restaurants", {
      budget: 20000,
      radius_meters: 1000,
      user_lat: -6.92,
      user_lng: 107.77,
    });
    expect(result).toEqual([
      {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Ayam Geprek",
        category: "Ayam",
        price_tier: 15000,
        hygiene_score: 90,
        distance: 124,
      },
      {
        id: "22222222-2222-2222-2222-222222222222",
        name: "Warteg Bahari",
        category: null,
        price_tier: 12000,
        hygiene_score: 80,
        distance: 987,
      },
    ]);
  });

  it("returns an empty array when the RPC returns no candidates", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null });

    await expect(
      getEligibleRestaurants(20000, 1000, -6.92, 107.77)
    ).resolves.toEqual([]);
  });

  it("throws a descriptive error when the RPC fails", async () => {
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: "boom", code: "PGRST500" },
    });

    await expect(
      getEligibleRestaurants(20000, 1000, -6.92, 107.77)
    ).rejects.toThrow(
      "getEligibleRestaurants: Supabase query failed — boom (code: PGRST500)"
    );
  });
});

describe("getAllRestaurants", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("parses coordinates and derives hygiene status", async () => {
    const selectMock = vi.fn().mockResolvedValue({
      data: [
        {
          id: "11111111-1111-1111-1111-111111111111",
          name: "Ayam Geprek",
          category: "Ayam",
          price_tier: 15000,
          location: "POINT(107.77 -6.92)",
          hygiene_score: 90,
          is_verified_safe: true,
          created_at: "2026-05-10T00:00:00Z",
        },
      ],
      error: null,
    });

    fromMock.mockReturnValue({ select: selectMock });

    await expect(getAllRestaurants()).resolves.toEqual([
      {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Ayam Geprek",
        category: "Ayam",
        price_tier: 15000,
        hygiene_score: 90,
        is_verified_safe: true,
        lat: -6.92,
        lng: 107.77,
        hygiene_status: "GREEN",
      },
    ]);
  });
});

describe("saveHygieneReport", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("inserts a guest report with a null user id", async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    fromMock.mockReturnValue({ insert: insertMock });

    await expect(
      saveHygieneReport(
        "11111111-1111-1111-1111-111111111111",
        "RED_FLAG",
        "Banyak lalat"
      )
    ).resolves.toBeUndefined();

    expect(insertMock).toHaveBeenCalledWith({
      user_id: null,
      restaurant_id: "11111111-1111-1111-1111-111111111111",
      report_type: "RED_FLAG",
      description: "Banyak lalat",
    });
  });
});

describe("updateHygieneScore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reduces score and marks the restaurant unsafe for red flags", async () => {
    const selectSingleMock = vi.fn().mockResolvedValue({
      data: { hygiene_score: 90 },
      error: null,
    });
    const selectEqMock = vi.fn().mockReturnValue({ single: selectSingleMock });
    const selectMock = vi.fn().mockReturnValue({ eq: selectEqMock });

    const updateSingleMock = vi.fn().mockResolvedValue({
      data: {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Ayam Geprek",
        category: "Ayam",
        price_tier: 15000,
        location: "POINT(107.77 -6.92)",
        hygiene_score: 40,
        is_verified_safe: false,
        created_at: "2026-05-10T00:00:00Z",
      },
      error: null,
    });
    const updateSelectMock = vi.fn().mockReturnValue({ single: updateSingleMock });
    const updateEqMock = vi.fn().mockReturnValue({ select: updateSelectMock });
    const updateMock = vi.fn().mockReturnValue({ eq: updateEqMock });

    fromMock.mockReturnValue({ select: selectMock, update: updateMock });

    await expect(
      updateHygieneScore("11111111-1111-1111-1111-111111111111", "RED_FLAG")
    ).resolves.toMatchObject({ hygiene_score: 40, is_verified_safe: false });
  });
});
