import { hasExpansion, ownedIds, type Progress } from "./types";
import {
  TABLES,
  tableCount,
  floorAreas,
  type Vec,
  type GameDefinition,
} from "./types";
export const distance = (a: Vec, b: Vec) => Math.hypot(a.x - b.x, a.z - b.z);
export function walkable(
  p: Vec,
  d: GameDefinition,
  clearance = 0,
  level: Progress = 0,
): boolean {
  const areas = floorAreas(level);
  const inside = (x: number, z: number) =>
    areas.some((a) => x >= a.minX && x <= a.maxX && z >= a.minZ && z <= a.maxZ);
  // Keep routes away from external and concave edges, while allowing movement
  // across the shared edges between purchased floor rectangles.
  if (
    ![
      [-clearance, -clearance],
      [clearance, -clearance],
      [-clearance, clearance],
      [clearance, clearance],
    ].every(([x, z]) => inside(p.x + x, p.z + z))
  )
    return false;
  if (
    d.stations.some(
      (s) =>
        hasExpansion(level, s.unlock) &&
        Math.abs(p.x - s.x) < 1.5 + clearance &&
        Math.abs(p.z - s.z) < 0.96 + clearance,
    )
  )
    return false;
  if (Math.abs(p.x) < 1.4 + clearance && Math.abs(p.z - 2) < 0.95 + clearance)
    return false;
  return !TABLES.slice(0, tableCount(level)).some(
    (t) => distance(p, t) < 1.05 + clearance,
  );
}
export function move(
  p: Vec,
  v: Vec,
  amount: number,
  d: GameDefinition,
  level: Progress = 0,
): void {
  const length = Math.hypot(v.x, v.z);
  if (!length) return;
  const x = p.x + (v.x / Math.max(1, length)) * amount,
    z = p.z + (v.z / Math.max(1, length)) * amount;
  if (walkable({ x, z: p.z }, d, 0, level)) p.x = x;
  if (walkable({ x: p.x, z }, d, 0, level)) p.z = z;
}
const routes = new Map<string, Vec[]>();
export function route(
  start: Vec,
  end: Vec,
  d: GameDefinition,
  level: Progress = 0,
): Vec[] {
  const snap = (v: number) => Math.round(v * 2) / 2;
  const a = { x: snap(start.x), z: snap(start.z) },
    b = { x: snap(end.x), z: snap(end.z) };
  const key = `${d.id}:${ownedIds(level).join(",")}:${a.x},${a.z}:${b.x},${b.z}`;
  const cached = routes.get(key);
  if (cached) return cached;
  const nodes = [a],
    parents = [-1],
    seen = new Set([`${a.x},${a.z}`]);
  let found = -1;
  for (let i = 0; i < nodes.length && i < 6000; i++) {
    const n = nodes[i];
    if (distance(n, b) < 0.4) {
      found = i;
      break;
    }
    for (const [dx, dz] of [
      [0.5, 0],
      [-0.5, 0],
      [0, 0.5],
      [0, -0.5],
    ]) {
      const p = { x: n.x + dx, z: n.z + dz },
        k = `${p.x},${p.z}`;
      if (!seen.has(k) && walkable(p, d, 0.16, level)) {
        seen.add(k);
        nodes.push(p);
        parents.push(i);
      }
    }
  }
  const path: Vec[] = [];
  for (let i = found; i > 0; i = parents[i]) path.unshift(nodes[i]);
  if (found >= 0) path.push(end);
  if (routes.size > 512) routes.clear();
  routes.set(key, path);
  return path;
}
export function toward(
  p: Vec,
  target: Vec,
  speed: number,
  dt: number,
  d?: GameDefinition,
  level: Progress = 0,
): void {
  let goal = target;
  if (d) {
    let blocked = false;
    const length = distance(p, target);
    for (let i = 0.2; i < length; i += 0.2)
      if (
        !walkable(
          {
            x: p.x + ((target.x - p.x) * i) / length,
            z: p.z + ((target.z - p.z) * i) / length,
          },
          d,
          0.08,
          level,
        )
      ) {
        blocked = true;
        break;
      }
    if (blocked)
      goal =
        route(p, target, d, level).find((v) => distance(p, v) > 0.1) ?? target;
  }
  const dist = distance(p, goal);
  if (dist < 0.01) return;
  const amount = Math.min(dist, speed * dt),
    vector = { x: (goal.x - p.x) / dist, z: (goal.z - p.z) / dist };
  if (d) move(p, vector, amount, d, level);
  else {
    p.x += vector.x * amount;
    p.z += vector.z * amount;
  }
}
