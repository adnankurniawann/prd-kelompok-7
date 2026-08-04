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
import { __resetRateLimits } from "@/lib/rate-limit";

function spinRequest(body: unknown, ip = "203.0.113.10"): Request {
  return new Request("http://localhost/api/spin", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

const VALID_BODY = {
  budget: 20000,
  radius: 1000,
  user_lat: -6.92,
  user_lng: 107.77,
};

describe("POST /api/spin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    __resetRateLimits();
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

    const response = await POST(spinRequest(VALID_BODY));

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

  it("returns 404 with no suggestions when nothing is mapped nearby", async () => {
    getEligibleRestaurantsMock.mockResolvedValue([]);

    const response = await POST(spinRequest(VALID_BODY));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      code: "NO_ELIGIBLE_RESTAURANTS",
      suggestions: { radius: null, budget: null },
    });
  });

  it("suggests a wider radius only when a wider radius actually helps", async () => {
    const candidate = {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Ayam Geprek",
      category: "Ayam",
      price_tier: 15000,
      hygiene_score: 90,
      distance: 2400,
    };

    // Kandidat hanya muncul kalau radiusnya dilebarkan; menaikkan budget tidak
    // menolong, jadi hanya saran radius yang boleh keluar.
    getEligibleRestaurantsMock.mockImplementation(
      async (_budget: number, radiusMeters: number) =>
        radiusMeters > 1000 ? [candidate] : [],
    );

    const response = await POST(spinRequest(VALID_BODY));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      code: "NO_ELIGIBLE_RESTAURANTS",
      suggestions: { radius: 3000, budget: null },
    });
  });

  it("suggests a higher budget when price is what rules everything out", async () => {
    const candidate = {
      id: "22222222-2222-2222-2222-222222222222",
      name: "Nasi Padang",
      category: "Padang",
      price_tier: 30000,
      hygiene_score: 80,
      distance: 400,
    };

    getEligibleRestaurantsMock.mockImplementation(async (budget: number) =>
      budget > 20000 ? [candidate] : [],
    );

    const response = await POST(spinRequest(VALID_BODY));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      suggestions: { radius: null, budget: 40000 },
    });
  });

  it("still answers 404 when the diagnosis probes fail", async () => {
    getEligibleRestaurantsMock
      .mockResolvedValueOnce([])
      .mockRejectedValue(new Error("probe failed"));

    const response = await POST(spinRequest(VALID_BODY));

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      code: "NO_ELIGIBLE_RESTAURANTS",
      suggestions: { radius: null, budget: null },
    });
  });

  it("rejects invalid JSON bodies", async () => {
    const response = await POST(spinRequest("{"));

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: "INVALID_INPUT",
    });
  });

  it("throttles an IP that hammers the endpoint", async () => {
    getEligibleRestaurantsMock.mockResolvedValue([]);

    let lastStatus = 0;
    for (let attempt = 0; attempt < 31; attempt += 1) {
      const response = await POST(spinRequest(VALID_BODY));
      lastStatus = response.status;
    }

    expect(lastStatus).toBe(429);
    await expect(
      POST(spinRequest(VALID_BODY, "198.51.100.7")),
    ).resolves.toMatchObject({ status: 404 });
  });
});