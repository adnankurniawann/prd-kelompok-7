/**
 * Weighted random selection utility.
 * Pure function — no side effects, no database or I/O operations.
 */

/**
 * Calculates spin weights from candidate items and the user's budget.
 *
 * The weight is `max(1, budget - price_tier)` so every candidate keeps a
 * minimum chance while cheaper items still get a larger share.
 */
export function calculateSpinWeights<T extends { price_tier: number }>(
  items: T[],
  budget: number
): number[] {
  return items.map((item) => Math.max(1, budget - item.price_tier));
}

/**
 * Selects one item from `items` using weighted random selection.
 *
 * @param items   Non-empty array of items to select from.
 * @param weights Parallel array of numeric weights (must have at least one positive value).
 * @returns       One element from `items`, chosen proportionally to its weight.
 *
 * @throws Error if `items` or `weights` is empty.
 * @throws Error if `items.length !== weights.length`.
 * @throws Error if all weights are ≤ 0.
 */
export function weightedRandom<T>(items: T[], weights: number[]): T {
  if (items.length === 0) {
    throw new Error(
      "weightedRandom: 'items' array must not be empty."
    );
  }

  if (weights.length === 0) {
    throw new Error(
      "weightedRandom: 'weights' array must not be empty."
    );
  }

  if (items.length !== weights.length) {
    throw new Error(
      `weightedRandom: 'items' and 'weights' must have the same length, ` +
        `but got items.length=${items.length} and weights.length=${weights.length}.`
    );
  }

  const totalWeight = weights.reduce((sum, w) => sum + w, 0);
  if (totalWeight <= 0) {
    throw new Error(
      "weightedRandom: all weights are ≤ 0; at least one weight must be positive."
    );
  }

  // Cumulative weight selection
  let random = Math.random() * totalWeight;

  for (let i = 0; i < items.length; i++) {
    random -= weights[i];
    if (random <= 0) {
      return items[i];
    }
  }

  // Fallback: return the last item (handles floating-point edge cases)
  return items[items.length - 1];
}
