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

import { getEligibleRestaurants } from "@/lib/supabase/queries";

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