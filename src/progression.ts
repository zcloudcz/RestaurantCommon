/** Deterministic, shared choice policy. Expansion IDs are one-based. */
export function offeredIds(
  total: number,
  owned: number[],
  dependencies: Record<number, number[]> = {},
): number[] {
  const purchased = new Set(owned);
  return Array.from({ length: total }, (_, i) => i + 1)
    .filter(
      (id) =>
        !purchased.has(id) &&
        (dependencies[id] ?? []).every((required) => purchased.has(required)),
    )
    .slice(0, 2);
}
