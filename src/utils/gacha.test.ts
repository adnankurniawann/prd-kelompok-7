import { describe, expect, it, vi } from "vitest";

import { calculateSpinWeights, weightedRandom } from "@/utils/gacha";

describe("calculateSpinWeights", () => {
  it("assigns a minimum weight of 1 to every candidate", () => {
    const weights = calculateSpinWeights(
      [
        { price_tier: 20000 },
        { price_tier: 25000 },
      ],
      20000
    );

    expect(weights).toEqual([1, 1]);
  });

  it("gives cheaper candidates a larger weight", () => {
    const weights = calculateSpinWeights(
      [
        { price_tier: 5000 },
        { price_tier: 15000 },
      ],
      20000
    );

    expect(weights).toEqual([15000, 5000]);
  });
});

describe("weightedRandom", () => {
  it("returns one of the input items using the provided weights", () => {
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.01);

    const result = weightedRandom(["a", "b", "c"], [1, 2, 3]);

    expect(result).toBe("a");
    randomSpy.mockRestore();
  });
});