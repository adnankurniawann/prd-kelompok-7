import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getEligibleRestaurantsMock,
  calculateSpinWeightsMock,
  weightedRandomMock,
} = vi.hoisted(() => ({
  getEligibleRestaurantsMock: vi.fn(),
  calculateSpinWeightsMock: vi.fn(),
  weightedRandomMock: vi.fn(),
}));

vi.mock("@/lib/supabase/queries", () => ({
  getEligibleRestaurants: getEligibleRestaurantsMock,
  supabase: {},
}));

vi.mock("@/utils/gacha", () => ({
  calculateSpinWeights: calculateSpinWeightsMock,
  weightedRandom: weightedRandomMock,
}));

import { POST } from "@/app/api/spin/route";

describe("POST /api/spin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the selected restaurant for a valid request", async () => {
    getEligibleRestaurantsMock.mockResolvedValue([
      {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Ayam Geprek",
        category: "Ayam",
        price_tier: 15000,
        hygiene_score: 90,
        distance: 123,
      },
    ]);
    calculateSpinWeightsMock.mockReturnValue([5000]);
    weightedRandomMock.mockReturnValue({
      id: "11111111-1111-1111-1111-111111111111",
      name: "Ayam Geprek",
      category: "Ayam",
      price_tier: 15000,
      hygiene_score: 90,
      distance: 123,
    });

    const response = await POST(
      new Request("http://localhost/api/spin", {
        method: "POST",
        body: JSON.stringify({
          budget: 20000,
          radius: 1000,
          user_lat: -6.92,
          user_lng: 107.77,
        }),
      })
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      data: {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Ayam Geprek",
        category: "Ayam",
        price_tier: 15000,
        distance: 123,
        hygiene_score: 90,
      },
    });
  });

  it("returns 404 when no restaurants match the filters", async () => {
    getEligibleRestaurantsMock.mockResolvedValue([]);

    const response = await POST(
      new Request("http://localhost/api/spin", {
        method: "POST",
        body: JSON.stringify({
          budget: 20000,
          radius: 1000,
          user_lat: -6.92,
          user_lng: 107.77,
        }),
      })
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      code: "NO_ELIGIBLE_RESTAURANTS",
    });
  });

  it("rejects invalid JSON bodies", async () => {
    const response = await POST(
      new Request("http://localhost/api/spin", {
        method: "POST",
        body: "{",
      })
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "INVALID_INPUT",
    });
  });
});