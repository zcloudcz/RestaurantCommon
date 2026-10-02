export interface Point {
  x: number;
  z: number;
}
export interface NavigationMap {
  key: string;
  cellSize?: number;
  walkable: (point: Point, clearance?: number) => boolean;
}

const distance = (a: Point, b: Point) => Math.hypot(a.x - b.x, a.z - b.z);
const paths = new Map<string, Point[]>();
const plans = new WeakMap<Point, { key: string; end: string; path: Point[] }>();

/** Shared version of the fast-food grid routing and axis sliding algorithm. */
export function createNavigator(map: NavigationMap) {
  const cell = map.cellSize ?? 0.5;
  const clear = (a: Point, b: Point, margin = 0.035) => {
    const length = distance(a, b),
      n = Math.max(1, Math.ceil(length / 0.025));
    for (let i = 1; i <= n; i++)
      if (
        !map.walkable(
          { x: a.x + ((b.x - a.x) * i) / n, z: a.z + ((b.z - a.z) * i) / n },
          margin * Math.min(1, (length * i) / n / 0.1),
        )
      )
        return false;
    return true;
  };
  const destinations = new Map<string, Point>();
  function nearest(p: Point): Point {
    if (map.walkable(p, 0.06)) return { ...p };
    const id = `${p.x},${p.z}`;
    const cached = destinations.get(id);
    if (cached && map.walkable(cached, 0.06)) return { ...cached };
    for (let radius = 0.25; radius <= 64; radius += 0.25) {
      const count = Math.max(16, Math.ceil((2 * Math.PI * radius) / 0.25));
      for (let i = 0; i < count; i++) {
        const a = (i * Math.PI * 2) / count;
        const candidate = {
          x: p.x + Math.cos(a) * radius,
          z: p.z + Math.sin(a) * radius,
        };
        if (map.walkable(candidate, 0.06)) {
          if (destinations.size > 128) destinations.clear();
          destinations.set(id, candidate);
          return { ...candidate };
        }
      }
    }
    return { ...p };
  }
  function move(p: Point, v: Point, amount: number) {
    if (!Number.isFinite(amount) || amount <= 0) return;
    if (!map.walkable(p)) Object.assign(p, nearest(p));
    const length = Math.max(1, Math.hypot(v.x, v.z)),
      n = Math.max(1, Math.ceil(amount / 0.1));
    const dx = ((v.x / length) * amount) / n,
      dz = ((v.z / length) * amount) / n;
    for (let i = 0; i < n; i++) {
      if (map.walkable({ x: p.x + dx, z: p.z })) p.x += dx;
      if (map.walkable({ x: p.x, z: p.z + dz })) p.z += dz;
    }
  }
  function route(start: Point, end: Point): Point[] {
    const snap = (n: number) => Math.round(n / cell) * cell;
    const anchor = { x: snap(start.x), z: snap(start.z) };
    const key = `${map.key}:${cell}:${anchor.x},${anchor.z}:${end.x.toFixed(2)},${end.z.toFixed(2)}`;
    const cached = paths.get(key);
    if (cached && (!cached.length || clear(start, cached[0]))) return cached;
    const nodes: Point[] = [],
      parents: number[] = [],
      seen = new Set<string>();
    // Connect the continuous actor position to a collision-free grid node.
    for (let dx = -1; dx <= 1; dx += cell)
      for (let dz = -1; dz <= 1; dz += cell) {
        const p = { x: anchor.x + dx, z: anchor.z + dz };
        if (map.walkable(p, 0.06) && clear(start, p)) {
          nodes.push(p);
          parents.push(-1);
          seen.add(`${p.x},${p.z}`);
        }
      }
    // Start with the nearest valid connection, avoiding needless detours.
    nodes.sort((a, b) => distance(start, a) - distance(start, b));
    let found = -1;
    for (let i = 0; i < nodes.length && i < 12000; i++) {
      const p = nodes[i];
      if (distance(p, end) < 2 && clear(p, end)) {
        found = i;
        break;
      }
      for (const [dx, dz] of [
        [cell, 0],
        [-cell, 0],
        [0, cell],
        [0, -cell],
      ]) {
        const q = { x: p.x + dx, z: p.z + dz },
          id = `${q.x},${q.z}`;
        if (!seen.has(id) && map.walkable(q, 0.06) && clear(p, q, 0.03)) {
          seen.add(id);
          nodes.push(q);
          parents.push(i);
        }
      }
    }
    const path: Point[] = [];
    for (let i = found; i >= 0; i = parents[i]) path.unshift(nodes[i]);
    if (found >= 0) path.push(end);
    if (paths.size > 512) paths.clear();
    paths.set(key, path);
    return path;
  }
  function toward(p: Point, target: Point, speed: number, dt: number): boolean {
    if (!map.walkable(p)) Object.assign(p, nearest(p));
    const end = nearest(target);
    if (distance(p, end) < 0.08) return true;
    let goal = end;
    if (!clear(p, end)) {
      const endKey = `${end.x.toFixed(3)},${end.z.toFixed(3)}`;
      let plan = plans.get(p);
      if (!plan || plan.key !== map.key || plan.end !== endKey) {
        plan = { key: map.key, end: endKey, path: [...route(p, end)] };
        plans.set(p, plan);
      }
      while (plan.path.length && distance(p, plan.path[0]) < 0.005)
        plan.path.shift();
      if (plan.path.length && !clear(p, plan.path[0])) {
        plan.path = [...route(p, end)];
        while (plan.path.length && distance(p, plan.path[0]) < 0.005)
          plan.path.shift();
      }
      if (!plan.path.length) return false;
      // Only inspect a few upcoming waypoints; no BFS on every simulation tick.
      let index = 0;
      for (let i = 1; i < Math.min(6, plan.path.length); i++)
        if (clear(p, plan.path[i])) index = i;
        else break;
      if (index) plan.path.splice(0, index);
      goal = plan.path[0];
      if (!clear(p, goal)) return false;
    } else plans.delete(p);
    const d = distance(p, goal);
    move(
      p,
      { x: (goal.x - p.x) / (d || 1), z: (goal.z - p.z) / (d || 1) },
      Math.min(d, speed * dt),
    );
    return distance(p, end) < 0.08;
  }
  return { move, toward, nearest, walkable: map.walkable };
}
