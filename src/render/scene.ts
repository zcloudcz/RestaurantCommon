import { expansionChoices, expansionPaid } from "../game/types";
import { hasExpansion } from "../game/types";
import * as T from "three";
import {
  box,
  ball,
  cylinder,
  plant,
  station,
  sign,
  person,
  food,
  diningTable,
  vehicle,
  material,
  bakeScenery,
  type PersonModel,
} from "./models";
import {
  TABLES,
  REGISTER,
  TRASH,
  PLOT,
  type GameDefinition,
  type GameState,
  type GameEvent,
  type Carrier,
  type Vec,
} from "../game/types";
import { seats, capacity } from "../game/production";
export interface WorldLabel {
  id: string;
  position: Vec;
  screen: { x: number; y: number };
  visible: boolean;
}
export function createScene(canvas: HTMLCanvasElement, d: GameDefinition) {
  const renderer = new T.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFSoftShadowMap;
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  const scene = new T.Scene();
  scene.background = new T.Color(d.background);
  scene.fog = new T.Fog(d.background, 55, 100);
  const camera = new T.OrthographicCamera(-15, 15, 15, -15, 0.1, 120);
  const focus = new T.Vector3(0, 0, 0);
  scene.add(new T.HemisphereLight("#fff9de", "#78918c", 2.4));
  const sun = new T.DirectionalLight("#fff0d3", 3.1);
  sun.position.set(-12, 24, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, {
    left: -22,
    right: 22,
    top: 22,
    bottom: -22,
    near: 0.1,
    far: 70,
  });
  sun.shadow.bias = -0.0005;
  scene.add(sun);
  const world = new T.Group();
  scene.add(world);
  const pizza = d.id === "pizza";
  box(world, 0, -0.5, 0, 19.2, 0.8, 21.2, pizza ? "#b99c73" : "#4f8885");
  box(world, 0, -0.09, 0, 18.7, 0.1, 20.7, "#dedbbd");
  for (let x = -8.5; x < 9; x++)
    for (let z = -9.5; z < 10; z++)
      box(
        world,
        x,
        0,
        z,
        0.97,
        0.035,
        0.97,
        pizza
          ? Math.floor(x + z) % 2 === 0
            ? "#e5d7b6"
            : "#e9dfc6"
          : Math.floor(x + z) % 2 === 0
            ? "#eff0db"
            : "#cedbd0",
      );
  // The kitchen has its own material and a low cutaway wall, keeping the floor readable.
  box(world, 0, 0.02, -5.5, 18, 0.035, 8, "#c1cfc0");
  for (let x = -8; x <= 8; x++)
    box(world, x, 0.045, -1.5, 0.56, 0.035, 0.1, d.accent);
  const facade = new T.Group();
  box(facade, 0, 1.2, -10, 19, 0.4, 0.3, d.dark);
  box(facade, 0, 0.55, -10, 19, 1.1, 0.3, pizza ? "#bd7e5c" : "#91bcb3");
  const eastWall = new T.Group();
  box(eastWall, 8.95, 0.65, -6.1, 0.22, 1.3, 7.8, d.dark);
  box(world, -8.95, 0.65, -7.1, 0.22, 1.3, 5.8, d.dark);
  const title = sign(d.title, pizza ? "#fff2c8" : "#f9d676", d.dark, 7.5, 1.85);
  title.position.set(0, 4.4, -9.7);
  facade.add(title);
  for (const x of [-4.5, 4.5]) {
    box(facade, x, 2.3, -9.8, 0.12, 3.7, 0.12, d.dark);
    ball(facade, x, 4.35, -9.8, 0.16, "#ffdf87");
  }
  for (let i = 0; i < 10; i++) {
    const awning = box(
      facade,
      -8.1 + i * 1.8,
      2.75,
      -9.5,
      1.8,
      0.12,
      1.35,
      i % 2 ? "#fff1d3" : d.accent,
    );
    awning.rotation.x = 0.15;
  }
  const road = box(
    world,
    -11,
    -0.14,
    0,
    3.5,
    0.09,
    32,
    pizza ? "#b9bba7" : "#688a8b",
  );
  road.receiveShadow = true;
  for (let z = -13; z < 14; z += 3)
    box(world, -11, 0.01, z, 0.11, 0.01, 1.3, "#e4e5c8");
  const sidewalk = new T.Group();
  box(sidewalk, 0, -0.12, 12, 20, 0.12, 3, "#c7c4a6");
  for (let x = -9; x < 10; x += 1.3)
    box(sidewalk, x, -0.045, 12, 0.04, 0.015, 3, "#b4b697");
  for (const [x, z] of [
    [-8.8, 8],
    [-8, -9],
    [8, -9],
  ])
    plant(world, x, z, true);
  for (const [x, z] of [
    [21, -11],
    [21, 2],
    [-15, -7],
    [-15, 8],
    [21, 16],
  ]) {
    cylinder(world, x, 1, z, 0.25, 2, "#aa7951");
    ball(world, x, 3, z, 1.4, "#679568");
    ball(world, x + 0.5, 3.5, z, 0.9, "#84ab68");
  }
  bakeScenery(world);
  world.add(facade, eastWall, sidewalk);
  const additions: Array<{ level: number; model: T.Group }> = [];
  function addition(level: number, build: (g: T.Group) => void) {
    const model = new T.Group();
    build(model);
    bakeScenery(model);
    model.visible = false;
    world.add(model);
    additions.push({ level, model });
  }
  function floor(
    g: T.Group,
    x1: number,
    x2: number,
    z1: number,
    z2: number,
    color: string,
  ) {
    box(
      g,
      (x1 + x2) / 2,
      -0.25,
      (z1 + z2) / 2,
      x2 - x1,
      0.5,
      z2 - z1,
      pizza ? "#b99c73" : "#4f8885",
    );
    box(g, (x1 + x2) / 2, 0.025, (z1 + z2) / 2, x2 - x1, 0.045, z2 - z1, color);
    for (let x = x1 + 1; x < x2; x += 1)
      box(g, x, 0.055, (z1 + z2) / 2, 0.025, 0.015, z2 - z1, "#b8bca3");
  }
  function rail(g: T.Group, x1: number, x2: number, z: number) {
    box(g, (x1 + x2) / 2, 0.65, z, x2 - x1, 0.12, 0.12, d.dark);
    for (let x = x1; x <= x2; x += 1.5)
      box(g, x, 0.35, z, 0.1, 0.7, 0.1, d.dark);
  }
  addition(3, (g) => {
    const source = d.stations.find((st) => st.id === "source")!;
    box(g, source.x, 0.76, source.z + 0.73, 2.55, 0.14, 0.09, "#e5bd64");
    if (pizza) {
      box(g, source.x - 0.6, 1.95, source.z - 0.35, 0.25, 1.15, 0.3, d.accent);
      box(g, source.x - 0.6, 2.45, source.z - 0.1, 0.65, 0.3, 0.85, d.accent);
      cylinder(g, source.x - 0.6, 2.1, source.z + 0.1, 0.06, 0.5, "#a9baba");
    }
    for (const x of [-0.8, 0, 0.8]) {
      cylinder(g, source.x + x, 1.42, source.z - 0.45, 0.12, 0.18, "#e5bd64");
      ball(g, source.x + x, 1.55, source.z - 0.45, 0.08, "#fff0b0");
    }
  });
  addition(4, (g) => {
    box(g, -7.3, 0.045, -8.55, 2.4, 0.05, 1.7, "#b6bda1");
    box(g, -7.3, 0.72, -8.8, 1.8, 0.13, 0.8, "#e6c28e");
    for (const x of [-8, -6.6]) box(g, x, 0.35, -8.8, 0.12, 0.7, 0.6, d.dark);
    box(g, -7.3, 1.03, -8.9, 0.65, 0.45, 0.08, d.dark);
    box(g, -7.3, 1.04, -8.84, 0.54, 0.3, 0.03, "#b2e9be");
    box(g, -7.3, 0.42, -8, 0.6, 0.15, 0.5, d.accent);
  });
  addition(10, (g) => {
    for (const st of d.stations.filter(
      (st) => st.unlock <= 10 && (st.kind === "convert" || st.kind === "oven"),
    )) {
      box(g, st.x, 0.65, st.z + 0.74, 2.45, 0.45, 0.08, "#a9c1ba");
      for (const x of [-0.8, 0, 0.8])
        box(g, st.x + x, 0.7, st.z + 0.8, 0.18, 0.12, 0.04, "#ffe094");
      box(g, st.x, 1.4, st.z - 0.72, 2.4, 0.18, 0.15, "#e5bd64");
    }
  });
  addition(12, (g) => {
    for (const x of [-8.6, 8.6]) plant(g, x, 5.3, true);
    for (const x of [-4, -2, 2]) {
      box(g, x, 0.45, 8.8, 1.4, 0.55, 0.3, "#e5bd64");
      box(g, x, 0.45, 8.97, 1.2, 0.38, 0.03, d.accent);
    }
  });
  addition(13, (g) => {
    floor(g, 8.3, 18, 0, 9, pizza ? "#e9dfc6" : "#e2e5ce");
    box(g, 17.9, 0.4, 4.5, 0.18, 0.8, 9, d.dark);

    for (const z of [1, 8]) plant(g, 17.1, z, true);
  });
  const diningBoundary = new T.Group();
  rail(diningBoundary, 9, 18, 0);
  world.add(diningBoundary);
  addition(14, (g) => {
    floor(g, -8.3, 18, 9, 17, "#cba97b");
    box(g, -8.15, 0.4, 13, 0.16, 0.8, 8, d.dark);
    box(g, 17.9, 0.4, 13, 0.16, 0.8, 8, d.dark);
    rail(g, -8.2, -1.8, 16.8);
    rail(g, 1.8, 18, 16.8);
    for (const x of [-7, 17]) plant(g, x, 15.7, true);
  });
  addition(15, (g) => {
    floor(g, -8.3, 8.3, -16, -8.5, "#c1cfc0");
    box(g, -8.2, 0.45, -12.2, 0.18, 0.9, 7.4, d.dark);
    box(g, 8.2, 0.45, -12.2, 0.18, 0.9, 7.4, d.dark);
    for (const x of [-6, 6]) {
      box(g, x, 0.7, -14, 2, 1.4, 1.2, "#a9baba");
      box(g, x, 1.43, -14, 2.1, 0.1, 1.3, "#eff0db");
      for (const z of [-14.3, -13.8])
        box(g, x, 0.95, z, 1.6, 0.08, 0.1, d.dark);
    }
  });
  addition(16, (g) => {
    floor(g, 8.3, 18, -8.5, 0, "#c7d5ca");
    box(g, 13.15, 0.45, -8.4, 9.7, 0.9, 0.18, d.dark);
    box(g, 17.9, 0.4, -4.2, 0.18, 0.8, 8.4, d.dark);
    for (const z of [-7, -6]) {
      box(g, 16.4, 0.5, z, 1.2, 1, 0.7, "#caa474");
      box(g, 16.4, 1.03, z, 1.25, 0.06, 0.75, "#f0c991");
    }
    plant(g, 17, -1, true);
  });
  addition(17, (g) => {
    box(g, -2, 0.085, 13, 7.8, 0.045, 4.7, "#71968b");
    box(g, -2, 0.12, 15.25, 7.5, 0.03, 0.09, "#e5bd64");
    for (const x of [-6.5, 2]) plant(g, x, 14.5, true);
  });
  addition(18, (g) => {
    floor(g, -8.3, 18, 17, 21, "#cfceb0");
    for (const x of [-5.8, 7, 14.5]) {
      box(g, x, 0.18, 19.5, 3, 0.3, 1.5, "#75966a");
      plant(g, x, 19.5, true);
    }
    for (const x of [-1.8, 1.8]) {
      cylinder(g, x, 1, 20.2, 0.15, 2, "#d7ad4b");
      ball(g, x, 2.15, 20.2, 0.3, "#ffe094");
    }
    rail(g, -8.2, -2, 20.9);
    rail(g, 2, 18, 20.9);
  });
  const fryerDef = d.stations.find((st) => st.id === "fryer");
  const fryerCrate = new T.Group();
  if (fryerDef) {
    box(fryerCrate, 0, 0.5, 0, 2.9, 1, 1.7, "#caa474");
    for (const x of [-1.15, 1.15])
      box(fryerCrate, x, 0.52, 0, 0.13, 1.05, 1.75, "#f0c991");
    const badge = sign("3", "#fff1d3", d.dark, 0.7, 0.5);
    badge.position.set(0, 1.3, 0);
    fryerCrate.add(badge);
    fryerCrate.position.set(fryerDef.x, 0, fryerDef.z);
    world.add(fryerCrate);
  }
  const stationModels = d.stations.map((def) => {
    const model = station(def, d);
    bakeScenery(model);
    model.position.set(def.x, 0, def.z);
    world.add(model);
    return model;
  });
  const tableModels = TABLES.map((pos) => {
    const m = diningTable(d);
    bakeScenery(m);
    m.position.set(pos.x, 0, pos.z);
    world.add(m);
    const dirt = new T.Group();
    for (let i = 0; i < 3; i++) {
      const f = food(d, "trash");
      f.position.set((i - 1) * 0.32, 1.43, 0.12);
      dirt.add(f);
    }
    m.add(dirt);
    return { model: m, dirt };
  });
  // Visible floor pads communicate future seating before it is bought.
  const tablePads = TABLES.map((pos) => {
    const ring = new T.Mesh(
      new T.RingGeometry(0.85, 0.91, 40),
      new T.MeshBasicMaterial({
        color: d.dark,
        transparent: true,
        opacity: 0.2,
        side: T.DoubleSide,
      }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.set(pos.x, 0.08, pos.z);
    world.add(ring);
    return ring;
  });
  box(world, 0, 0.64, 2, 2.4, 1.25, 1.4, d.accent);
  box(world, 0, 1.31, 2, 2.6, 0.16, 1.55, "#fff1d7");
  box(world, 0, 1.57, 2, 0.8, 0.35, 0.5, d.dark);
  const screen = box(world, 0, 1.82, 1.93, 0.67, 0.35, 0.1, "#b2e9be");
  screen.rotation.x = -0.2;
  cylinder(world, -7, 0.6, 8, 0.44, 1.2, "#617c72");
  cylinder(world, -7, 1.23, 8, 0.49, 0.08, "#405e54");
  box(world, -7, 1.25, 8, 0.4, 0.03, 0.16, "#283c37");
  const cash = new T.Group();
  for (let i = 0; i < 5; i++)
    box(cash, 0.7, 0.06 + i * 0.05, 0, 0.55, 0.045, 0.28, "#8bbe64");
  cash.position.set(0, 1.41, 2);
  world.add(cash);
  const plot = new T.Group();
  plot.position.set(PLOT.x, 0.065, PLOT.z);
  world.add(plot);
  const pad = box(plot, 0, 0, 0, 2.8, 0.08, 2.25, "#8cb77d");
  for (const x of [-1.37, 1.37])
    box(plot, x, 0.06, 0, 0.07, 0.05, 2.2, "#f3ffe0");
  for (const z of [-1.09, 1.09])
    box(plot, 0, 0.06, z, 2.8, 0.05, 0.07, "#f3ffe0");
  const plus = sign("+", "#eaf6d2", "#4c824c", 0.65, 0.6);
  plus.position.set(0, 0.25, 0);
  plot.add(plus);
  const prestige = new T.Group();
  for (const x of [-8.7, 8.7]) {
    cylinder(prestige, x, 1.1, -9, 0.24, 2.2, "#d7ad4b");
    ball(prestige, x, 2.35, -9, 0.4, "#ffe094");
  }
  for (const z of [-10, 9.8])
    box(prestige, 0, 0.15, z, 18, 0.16, 0.2, "#d7ad4b");
  const trophy = sign("★ ★ ★", "#fff2c8", "#b48625", 3, 0.7);
  trophy.position.set(0, 5.7, -9.7);
  prestige.add(trophy);
  world.add(prestige);
  const premium = new T.Group();
  for (const t of TABLES)
    cylinder(premium, t.x, 1.405, t.z, 0.81, 0.02, "#e5bd64");
  world.add(premium);
  const player = person(d.accent, true);
  world.add(player.group);
  const fullSign = sign("● ● ●", "#ffe49d", d.dark, 1.2, 0.45);
  fullSign.position.set(0, 2.6, 0);
  player.group.add(fullSign);
  fullSign.visible = false;
  const halo = new T.Mesh(
    new T.RingGeometry(0.49, 0.59, 36),
    new T.MeshBasicMaterial({ color: "#fff2ae", side: T.DoubleSide }),
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = 0.055;
  player.group.add(halo);
  const npcModels = new Map<number, PersonModel | T.Group>();
  const workerModels = new Map<string, PersonModel>();
  let renderedState: GameState | undefined;
  function removeModel(model: PersonModel | T.Group) {
    const group = model instanceof T.Group ? model : model.group;
    world.remove(group);
    group.traverse((o) => {
      if (o instanceof T.Mesh) o.geometry.dispose();
    });
  }
  const palette = [
    "#e38c57",
    "#689fa2",
    "#d3a655",
    "#946e9e",
    "#87a063",
    "#d57b83",
  ];
  const arrow = new T.Group();
  const tip = new T.Mesh(
    new T.ConeGeometry(0.27, 0.55, 4),
    material("#fff4a9"),
  );
  tip.rotation.z = Math.PI;
  arrow.add(tip);
  cylinder(arrow, 0, 0.42, 0, 0.09, 0.42, "#fff4a9");
  world.add(arrow);
  const fx: Array<{
    mesh: T.Mesh;
    life: number;
    vx: number;
    vz: number;
    vy: number;
  }> = [];
  const pool: T.Mesh[] = [];
  for (let i = 0; i < 80; i++) {
    const mesh = new T.Mesh(
      new T.BoxGeometry(0.1, 0.1, 0.1),
      material(palette[i % 6]),
    );
    mesh.visible = false;
    scene.add(mesh);
    pool.push(mesh);
  }
  let width = 1,
    height = 1,
    overview = false,
    quality = true,
    oldLevel = 0;
  const labels: WorldLabel[] = [
    ...d.stations.map((s) => ({
      id: s.id,
      position: { x: s.x, z: s.z + 1.5 },
    })),
    { id: "register", position: REGISTER },
    { id: "trash", position: TRASH },
    { id: "unlock", position: PLOT },
  ].map((x) => ({ ...x, screen: { x: 0, y: 0 }, visible: true }));
  function resize() {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    renderer.setSize(width, height, false);
  }
  function pose(
    model: PersonModel,
    c: Carrier,
    time: number,
    active: boolean,
    skin?: number,
    recipe = 0,
  ) {
    const moving = Math.hypot(c.x - model.lastX, c.z - model.lastZ) > 0.002;
    model.lastX = c.x;
    model.lastZ = c.z;
    model.group.position.set(
      c.x,
      moving ? Math.abs(Math.sin(time * 11)) * 0.04 : 0,
      c.z,
    );
    model.group.rotation.y = c.angle;
    model.left.rotation.x = moving ? Math.sin(time * 11) * 0.5 : 0;
    model.right.rotation.x = -model.left.rotation.x;
    model.arm.rotation.x = c.count ? -0.45 : 0;
    if (skin !== undefined)
      model.body.material = material([d.accent, "#668fa5", "#b58b44"][skin]);
    const key = `${c.item}:${c.count}:${c.fries}:${active}:${recipe}`;
    if (model.stack.userData.key !== key) {
      while (model.stack.children.length) {
        const child = model.stack.children[0];
        child.traverse((o) => {
          if (o instanceof T.Mesh) o.geometry.dispose();
        });
        model.stack.remove(child);
      }
      if (c.count) {
        box(model.stack, 0, -0.03, 0, 0.85, 0.06, 0.65, "#e8c28e");
        for (let i = 0; i < c.count; i++) {
          const mains = c.count - c.fries;
          const side = i >= mains && c.fries > 0;
          const mixed = mains > 0 && c.fries > 0;
          const f = food(d, side ? "fries" : (c.item ?? "meal"), recipe);
          f.position.x = mixed ? (side ? 0.24 : -0.23) : 0;
          f.position.y =
            (mixed && side ? i - mains : i) * (d.id === "pizza" ? 0.2 : 0.33);
          f.scale.setScalar(0.75);
          model.stack.add(f);
        }
      }
      model.stack.userData.key = key;
    }
    model.stack.rotation.z = moving ? Math.sin(time * 8) * 0.06 : 0;
  }
  function render(
    s: GameState,
    events: GameEvent[],
    dt: number,
    goal: Vec,
    lang: string,
    reduced = false,
  ) {
    // Import/reset replaces the state object; reused IDs can represent a
    // different guest type, and previously hired staff may no longer exist.
    if (renderedState !== s) {
      npcModels.forEach(removeModel);
      workerModels.forEach(removeModel);
      npcModels.clear();
      workerModels.clear();
      renderedState = s;
      oldLevel = s.level;
    }
    if (width !== canvas.clientWidth || height !== canvas.clientHeight)
      resize();
    const aspect = width / height,
      portrait = aspect < 0.85;
    const expanded = hasExpansion(s, 13);
    const minZ = hasExpansion(s, 15) ? -16 : -10;
    const maxZ = hasExpansion(s, 18) ? 21 : hasExpansion(s, 14) ? 17 : 10;
    const maxX = expanded ? 18 : 9;
    const centerX = expanded ? 3 : 0;
    const centerZ = (minZ + maxZ) / 2;
    const mapWidth = maxX + 13;
    const mapDepth = maxZ - minZ;
    const view = overview
      ? expanded
        ? Math.max(
            35,
            mapWidth * 0.55 + mapDepth * 0.75 + 7,
            (mapWidth * 0.85 + mapDepth * 0.55 + 7) / aspect,
          )
        : Math.max(26, 25 / aspect)
      : portrait
        ? 25
        : 27;
    camera.left = (-view * aspect) / 2;
    camera.right = (view * aspect) / 2;
    camera.top = view / 2;
    camera.bottom = -view / 2;
    camera.updateProjectionMatrix();
    const target = new T.Vector3(
      !overview && (portrait || expanded)
        ? s.player.x * (expanded ? 1 : 0.65)
        : centerX,
      0,
      !overview && (portrait || expanded)
        ? s.player.z * (expanded ? 1 : 0.55)
        : centerZ,
    );
    focus.lerp(target, reduced ? 1 : Math.min(1, dt * 4));
    camera.position.copy(focus).add(new T.Vector3(14, 23, 22));
    camera.lookAt(focus);
    pose(player, s.player, s.time, true, s.skin, s.recipe);
    fullSign.visible = s.player.count >= capacity(s);
    fullSign.position.y = Math.max(
      2.6,
      1.7 +
        Math.max(s.player.count - s.player.fries, s.player.fries) *
          (pizza ? 0.2 : 0.33),
    );
    stationModels.forEach((m, i) => {
      m.visible = hasExpansion(s, d.stations[i].unlock);
    });
    fryerCrate.visible = Boolean(fryerDef && !hasExpansion(s, fryerDef.unlock));
    tableModels.forEach((t, i) => {
      t.model.visible = i < seats(s);
      t.dirt.visible = s.tables[i]?.dirty ?? false;
    });
    additions.forEach((a) => {
      a.model.visible = hasExpansion(s, a.level);
    });
    facade.position.z = hasExpansion(s, 15) ? -6 : 0;
    eastWall.visible = !hasExpansion(s, 16);
    diningBoundary.visible = hasExpansion(s, 13) && !hasExpansion(s, 16);
    trophy.position.z = hasExpansion(s, 15) ? -15.7 : -9.7;
    sidewalk.visible = !hasExpansion(s, 14);
    tablePads.forEach((p, i) => {
      const pos = TABLES[i];
      p.visible =
        i >= seats(s) &&
        (pos.z > 9
          ? hasExpansion(s, 14)
          : pos.x > 8.3
            ? hasExpansion(s, 13)
            : true);
    });
    premium.visible = hasExpansion(s, 17);
    prestige.visible = hasExpansion(s, 18);
    cash.visible = s.cash > 0;
    plot.visible = s.level < d.unlocks.length;
    pad.material = material(
      expansionChoices(s, d.unlocks.length).some(
        (id) => s.money >= d.unlocks[id - 1].cost - expansionPaid(s, id),
      )
        ? "#91c17e"
        : "#b5bea0",
    );
    for (const w of s.workers) {
      let m = workerModels.get(w.id ?? w.role);
      if (!m) {
        m = person(
          w.role === "cook"
            ? "#efe4c5"
            : w.role === "cleaner"
              ? "#849cb0"
              : "#75a380",
          w.role === "cook",
        );
        world.add(m.group);
        workerModels.set(w.id ?? w.role, m);
      }
      pose(m, w, s.time, false, undefined, s.recipe);
    }
    for (const c of s.customers) {
      let m = npcModels.get(c.id);
      if (!m) {
        m = c.drive ? vehicle(d, palette[c.color]) : person(palette[c.color]);
        world.add(m instanceof T.Group ? m : m.group);
        npcModels.set(c.id, m);
      }
      if (m instanceof T.Group) {
        m.position.set(c.x, 0, c.z);
        m.rotation.y = c.state === "leave" ? 0 : Math.PI;
      } else
        pose(
          m,
          {
            ...c,
            item: null,
            count: 0,
            fries: 0,
            cooldown: 0,
            angle:
              c.state === "queue"
                ? Math.PI
                : c.state === "leave"
                  ? 0
                  : Math.PI / 2,
          },
          s.time,
          false,
        );
    }
    for (const [id, m] of npcModels)
      if (!s.customers.some((c) => c.id === id)) {
        removeModel(m);
        npcModels.delete(id);
      }
    arrow.position.set(
      goal.x,
      2.8 + (reduced ? 0 : Math.sin(s.time * 3) * 0.18),
      goal.z,
    );
    arrow.visible = true;
    if (!reduced)
      for (const e of events) {
        const count = e.type === "unlock" ? 30 : e.type === "sale" ? 6 : 2;
        for (let i = 0; i < count && pool.length; i++) {
          const mesh = pool.pop()!;
          mesh.position.set(e.x, 1.4, e.z);
          mesh.visible = true;
          fx.push({
            mesh,
            life: 0.8,
            vx: (Math.random() - 0.5) * 3,
            vz: (Math.random() - 0.5) * 3,
            vy: 2 + Math.random() * 3,
          });
        }
      }
    if (s.level > oldLevel) {
      oldLevel = s.level;
      for (let i = 0; i < 25 && pool.length && !reduced; i++) {
        const mesh = pool.pop()!;
        mesh.position.set(PLOT.x, 1, PLOT.z);
        mesh.visible = true;
        fx.push({
          mesh,
          life: 1.2,
          vx: (Math.random() - 0.5) * 5,
          vz: (Math.random() - 0.5) * 5,
          vy: 5,
        });
      }
    }
    for (let i = fx.length - 1; i >= 0; i--) {
      const f = fx[i];
      f.life -= dt;
      f.vy -= dt * 8;
      f.mesh.position.x += f.vx * dt;
      f.mesh.position.y += f.vy * dt;
      f.mesh.position.z += f.vz * dt;
      f.mesh.rotation.x += dt * 4;
      if (f.life <= 0) {
        f.mesh.visible = false;
        pool.push(f.mesh);
        fx.splice(i, 1);
      }
    }
    for (const label of labels) {
      const p = new T.Vector3(
        label.position.x,
        label.id === "unlock" ? 0.5 : 1.7,
        label.position.z - 0.6,
      ).project(camera);
      label.screen.x = ((p.x + 1) * width) / 2;
      label.screen.y = ((1 - p.y) * height) / 2;
      label.visible = hasExpansion(
        s,
        d.stations.find((st) => st.id === label.id)?.unlock ?? 0,
      );
    }
    if (overview && portrait) {
      const active = labels.filter(
        (label) =>
          label.visible &&
          (label.id !== "unlock" || s.level < d.unlocks.length),
      );
      const slots: Array<{ x: number; y: number }> = [];
      for (let y = 105; y <= height - 100; y += 56)
        for (const x of [75, width - 75]) slots.push({ x, y });
      // Keep every destination selectable in the small map overview. The closest
      // free slot preserves approximate world placement without overlapping taps.
      active.sort((a, b) => a.screen.y - b.screen.y || a.screen.x - b.screen.x);
      for (const label of active) {
        let best = -1,
          cost = Infinity;
        slots.forEach((slot, i) => {
          const distance =
            (slot.x - label.screen.x) ** 2 + (slot.y - label.screen.y) ** 2;
          if (distance < cost) {
            cost = distance;
            best = i;
          }
        });
        if (best >= 0) label.screen = slots.splice(best, 1)[0];
      }
    }
    renderer.render(scene, camera);
  }
  resize();
  return {
    render,
    labels,
    toggleOverview() {
      overview = !overview;
      return overview;
    },
    setQuality(value: boolean) {
      quality = value;
      renderer.shadowMap.enabled = quality;
      renderer.setPixelRatio(Math.min(devicePixelRatio, quality ? 1.75 : 1));
    },
    dispose() {
      scene.traverse((o) => {
        if (o instanceof T.Mesh) o.geometry.dispose();
      });
      renderer.dispose();
    },
  };
}
