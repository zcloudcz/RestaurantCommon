/** Distance from an actor to the nearest edge of a rectangular station. */
export function distanceToFootprint(
  actor: { x: number; z: number },
  station: { x: number; z: number },
  halfWidth: number,
  halfDepth: number,
): number {
  return Math.hypot(
    Math.max(0, Math.abs(actor.x - station.x) - halfWidth),
    Math.max(0, Math.abs(actor.z - station.z) - halfDepth),
  );
}
