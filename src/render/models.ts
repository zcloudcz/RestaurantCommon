import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { GameDefinition, Item, StationDef } from "../game/types";
const materials = new Map<string, T.MeshStandardMaterial>();
export function bakeScenery(parent: T.Object3D) {
  const groups = new Map<T.Material, T.BufferGeometry[]>(),
    remove: T.Mesh[] = [];
  parent.updateMatrixWorld(true);
  parent.traverse((o) => {
    if (o instanceof T.Mesh && !Array.isArray(o.material)) {
      const geometry = o.geometry.clone();
      geometry.applyMatrix4(o.matrixWorld);
      const list = groups.get(o.material) ?? [];
      list.push(geometry);
      groups.set(o.material, list);
      remove.push(o);
    }
  });
  for (const mesh of remove) {
    mesh.removeFromParent();
    mesh.geometry.dispose();
  }
  for (const [mat, geometries] of groups) {
    const merged = mergeGeometries(geometries, false);
    geometries.forEach((g) => g.dispose());
    if (merged) {
      const mesh = new T.Mesh(merged, mat);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      parent.add(mesh);
    }
  }
}
export function material(color: string) {
  let m = materials.get(color);
  if (!m) {
    m = new T.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.02 });
    materials.set(color, m);
  }
  return m;
}
export function box(
  parent: T.Object3D,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  depth: number,
  color: string,
) {
  const o = new T.Mesh(new T.BoxGeometry(w, h, depth), material(color));
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}
export function cylinder(
  parent: T.Object3D,
  x: number,
  y: number,
  z: number,
  r: number,
  h: number,
  color: string,
  r2 = r,
) {
  const o = new T.Mesh(new T.CylinderGeometry(r, r2, h, 16), material(color));
  o.position.set(x, y, z);
  o.castShadow = true;
  o.receiveShadow = true;
  parent.add(o);
  return o;
}
export function ball(
  parent: T.Object3D,
  x: number,
  y: number,
  z: number,
  r: number,
  color: string,
  sx = 1,
  sy = 1,
  sz = 1,
) {
  const o = new T.Mesh(new T.SphereGeometry(r, 12, 8), material(color));
  o.position.set(x, y, z);
  o.scale.set(sx, sy, sz);
  o.castShadow = true;
  parent.add(o);
  return o;
}
export function sign(
  text: string,
  bg = "#fff9e9",
  color = "#264c45",
  width = 3,
  height = 0.65,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 128;
  const c = canvas.getContext("2d")!;
  c.fillStyle = bg;
  c.beginPath();
  c.roundRect(0, 0, 512, 128, 28);
  c.fill();
  c.font = "bold 52px Trebuchet MS, sans-serif";
  c.textAlign = "center";
  c.textBaseline = "middle";
  c.fillStyle = color;
  c.fillText(text, 256, 66, 470);
  const tex = new T.CanvasTexture(canvas);
  tex.colorSpace = T.SRGBColorSpace;
  const o = new T.Sprite(new T.SpriteMaterial({ map: tex, depthTest: true }));
  o.scale.set(width, height, 1);
  return o;
}
export function food(d: GameDefinition, item: Item, recipe = 0): T.Group {
  const g = new T.Group();
  if (item === "fries") {
    box(g, 0, 0.15, 0, 0.36, 0.3, 0.22, "#e75e36");
    box(g, 0, 0.17, 0.115, 0.13, 0.12, 0.012, "#ffe5a5");
    for (let i = 0; i < 7; i++) {
      const chip = box(
        g,
        ((i % 4) - 0.5 * 3) * 0.075,
        0.35 + (i % 3) * 0.025,
        (Math.floor(i / 4) - 0.5) * 0.09,
        0.055,
        0.3 + (i % 2) * 0.07,
        0.055,
        i % 2 ? "#ffd368" : "#edac3c",
      );
      chip.rotation.z = ((i % 3) - 1) * 0.15;
    }
    return g;
  }
  if (item === "trash") {
    ball(g, 0, 0.1, 0, 0.2, "#d5c5ac", 1, 0.7, 1);
    box(g, 0.12, 0.12, 0.05, 0.25, 0.1, 0.2, "#edeee0");
    return g;
  }
  if (d.id === "burger") {
    if (item === "raw") {
      cylinder(g, 0, 0.08, 0, 0.26, 0.13, "#7e422c");
      return g;
    }
    cylinder(g, 0, 0.05, 0, 0.29, 0.11, "#e2a249");
    cylinder(g, 0, 0.12, 0, 0.31, 0.045, "#64a653");
    cylinder(g, 0, 0.19, 0, 0.27, 0.12, "#703c2b");
    const cheese = box(g, 0, 0.27, 0, 0.49, 0.035, 0.49, "#ffd15a");
    cheese.rotation.y = 0.3;
    if (recipe >= 2) cylinder(g, 0, 0.31, 0, 0.28, 0.1, "#703c2b");
    ball(g, 0, recipe >= 2 ? 0.42 : 0.33, 0, 0.3, "#efb451", 1, 0.5, 1);
    if (recipe === 3) {
      for (const x of [-0.14, 0.14])
        box(g, x, 0.38, 0, 0.09, 0.035, 0.48, "#a63c23");
      cylinder(g, 0, 0.4, 0, 0.19, 0.03, "#6e3924");
    }
    for (let i = 0; i < 5; i++)
      box(
        g,
        Math.sin(i * 2) * 0.16,
        recipe >= 2 ? 0.55 : 0.46,
        Math.cos(i * 2) * 0.16,
        0.045,
        0.015,
        0.02,
        "#fff0be",
      );
  } else {
    if (item === "raw") {
      ball(g, 0, 0.1, 0, 0.27, "#f5dfaa", 1, 0.6, 1);
      return g;
    }
    cylinder(
      g,
      0,
      0.06,
      0,
      0.37,
      0.12,
      item === "prep" ? "#f3d6a0" : "#d99442",
    );
    cylinder(g, 0, 0.125, 0, 0.31, 0.025, "#ce4b36");
    cylinder(g, 0, 0.145, 0, 0.27, 0.023, "#ffda7b");
    for (let i = 0; i < 5; i++) {
      const x = Math.sin(i * 2.4) * 0.2,
        z = Math.cos(i * 2.4) * 0.2;
      cylinder(
        g,
        x,
        0.17,
        z,
        0.055,
        0.025,
        recipe === 1
          ? "#b63831"
          : recipe === 2
            ? "#edb634"
            : recipe === 3
              ? "#514238"
              : "#fff1cb",
      );
      if (recipe === 2) {
        const pepper = box(
          g,
          x - 0.04,
          0.2,
          z + 0.05,
          0.12,
          0.035,
          0.04,
          "#489749",
        );
        pepper.rotation.y = i;
        cylinder(g, x + 0.06, 0.2, z - 0.03, 0.027, 0.035, "#3b3430");
      }
      if (i % 2 === 0)
        ball(g, x + 0.03, 0.19, z + 0.03, 0.04, "#39854c", 0.7, 0.3, 1.5);
    }
  }
  return g;
}
export interface PersonModel {
  group: T.Group;
  left: T.Group;
  right: T.Group;
  arm: T.Group;
  stack: T.Group;
  body: T.Mesh;
  lastX: number;
  lastZ: number;
}
export function person(color: string, chef = false): PersonModel {
  const g = new T.Group();
  const left = new T.Group();
  left.position.set(-0.15, 0.5, 0);
  g.add(left);
  box(left, 0, -0.22, 0, 0.22, 0.45, 0.25, "#354657");
  box(left, 0, -0.43, 0.08, 0.25, 0.14, 0.37, "#f7f2df");
  const right = left.clone();
  right.position.x = 0.15;
  g.add(right);
  const body = box(g, 0, 0.88, 0, 0.58, 0.67, 0.4, color);
  box(g, 0, 0.86, 0.218, 0.34, 0.45, 0.035, "#fff5dd");
  ball(g, 0, 1.48, 0, 0.3, "#e9b78c", 1, 1.12, 0.95);
  ball(g, 0, 1.66, -0.04, 0.305, chef ? "#fffdf0" : "#62412f", 1, 0.5, 1);
  if (chef) {
    cylinder(g, 0, 1.79, -0.02, 0.29, 0.15, "#fffdf1");
    for (let i = 0; i < 3; i++)
      ball(g, (i - 1) * 0.16, 1.88, -0.02, 0.18, "#fffdf1");
  }
  ball(g, -0.105, 1.51, 0.261, 0.034, "#273e3d");
  ball(g, 0.105, 1.51, 0.261, 0.034, "#273e3d");
  ball(g, 0, 1.4, 0.29, 0.055, "#d79271", 1, 0.6, 0.6);
  const arm = new T.Group();
  arm.position.set(0.35, 1.06, 0);
  g.add(arm);
  box(arm, 0, -0.17, 0.1, 0.17, 0.4, 0.21, color);
  ball(arm, 0, -0.32, 0.18, 0.105, "#e9b78c");
  box(g, -0.36, 0.91, 0, 0.17, 0.4, 0.22, color);
  ball(g, -0.36, 0.69, 0.06, 0.105, "#e9b78c");
  const stack = new T.Group();
  stack.position.set(0.1, 0.95, 0.48);
  g.add(stack);
  return { group: g, left, right, arm, stack, body, lastX: 0, lastZ: 0 };
}
export function plant(parent: T.Object3D, x: number, z: number, large = false) {
  const h = large ? 1.2 : 0.45;
  cylinder(
    parent,
    x,
    h * 0.4,
    z,
    large ? 0.45 : 0.22,
    h * 0.8,
    "#c97d55",
    large ? 0.32 : 0.16,
  );
  for (let i = 0; i < 5; i++)
    ball(
      parent,
      x + Math.sin(i * 1.3) * 0.18,
      h + Math.abs(Math.cos(i)) * h * 0.3,
      z + Math.cos(i * 1.3) * 0.18,
      large ? 0.48 : 0.23,
      i % 2 ? "#598754" : "#7ca05d",
      0.7,
      1.3,
      0.7,
    );
}
export function station(def: StationDef, d: GameDefinition): T.Group {
  const g = new T.Group(),
    pizza = d.id === "pizza";
  box(
    g,
    0,
    0.62,
    0,
    2.7,
    1.2,
    1.4,
    def.kind === "source" && !pizza ? "#434b50" : d.dark,
  );
  box(g, 0, 1.25, 0, 2.9, 0.18, 1.6, pizza ? "#ead5af" : "#eceddd");
  for (const x of [-1, 1]) box(g, x, 0.09, 0, 0.18, 0.18, 0.9, "#4a5656");
  if (def.id === "fryer") {
    for (const x of [-0.65, 0.65]) {
      box(g, x, 1.38, 0, 0.95, 0.12, 1.1, "#9aacab");
      box(g, x, 1.46, 0, 0.8, 0.04, 0.85, "#855c23");
      for (let i = 0; i < 6; i++)
        box(
          g,
          x - 0.28 + (i % 3) * 0.23,
          1.5,
          -0.2 + Math.floor(i / 3) * 0.35,
          0.1,
          0.08,
          0.3,
          "#efc34e",
        );
      box(g, x, 1.59, 0.65, 0.1, 0.1, 0.6, "#333f42");
      box(g, x, 1.59, 0.91, 0.3, 0.12, 0.15, "#333f42");
    }
    box(g, 0, 1.63, -0.6, 2.8, 0.45, 0.15, "#adbdbc");
    for (const x of [-0.6, 0.6])
      cylinder(g, x, 1.89, -0.55, 0.09, 0.08, "#66a880");
  } else if (def.kind === "source") {
    if (pizza) {
      cylinder(g, -0.6, 1.5, 0, 0.48, 0.4, "#bbcaca");
      ball(g, -0.6, 1.63, 0, 0.37, "#eeddb8", 1, 0.25, 1);
      box(g, 0.7, 1.42, 0.1, 0.65, 0.25, 0.65, "#dba66f");
      for (let i = 0; i < 3; i++)
        ball(g, 0.55 + i * 0.17, 1.59, 0.1, 0.14, "#f2dcac");
    } else {
      box(g, 0, 1.37, 0, 2.55, 0.07, 1.2, "#232d32");
      for (let i = 0; i < 12; i++)
        box(g, -1.14 + i * 0.205, 1.42, 0, 0.055, 0.04, 1.13, "#939e98");
      for (let i = 0; i < 5; i++)
        cylinder(g, -0.85 + i * 0.42, 1.46, 0.03, 0.17, 0.07, "#784332");
      box(g, 0, 3, -0.3, 3, 0.25, 1.6, "#8faaa8");
      box(g, 0, 3.35, -0.6, 1.5, 0.6, 0.65, "#acbcb5");
    }
  } else if (def.kind === "oven") {
    box(g, 0, 1.83, -0.08, 2.6, 1.2, 1.45, "#c7774b");
    ball(g, 0, 2.33, -0.1, 1.26, "#d18a55", 1, 0.65, 0.6);
    box(g, 0, 1.8, 0.67, 1.8, 0.78, 0.05, "#512e29");
    box(g, 0, 1.56, 0.72, 1.6, 0.14, 0.12, "#ef8c30");
    for (let i = 0; i < 4; i++)
      ball(g, -0.55 + i * 0.35, 1.72, 0.77, 0.19, "#ffd469", 0.5, 1.4, 0.2);
    for (let i = 0; i < 3; i++)
      box(g, -0.85 + i * 0.85, 2.18, 0.69, 0.06, 0.35, 0.04, "#e4ae7a");
    cylinder(g, 0.73, 2.95, -0.3, 0.26, 1, "#b56945");
  } else if (def.kind === "convert") {
    box(g, -0.3, 1.39, 0.12, 1.7, 0.1, 1, "#be9467");
    for (let i = 0; i < 3; i++) {
      box(g, -0.7 + i * 0.65, 1.42, -0.4, 0.48, 0.1, 0.35, "#a9baba");
      cylinder(
        g,
        -0.7 + i * 0.65,
        1.5,
        -0.4,
        0.14,
        0.08,
        ["#d34b36", "#76a551", "#f6d477"][i],
      );
    }
    const f = food(d, pizza ? "prep" : "meal");
    f.position.set(0.5, 1.44, 0.2);
    g.add(f);
  } else {
    box(g, 0, 1.5, -0.5, 2.8, 0.4, 0.12, pizza ? "#e0b077" : "#8dbeb7");
    if (def.id === "drive") {
      box(g, 0, 2.6, 0, 3.2, 0.18, 1.9, d.accent);
      for (const x of [-1.35, 1.35])
        cylinder(g, x, 1.96, -0.5, 0.055, 1.8, "#fff2d3");
      for (let i = 0; i < 8; i++)
        box(g, -1.4 + i * 0.4, 2.56, 0.85, 0.2, 0.22, 0.16, "#fff7dc");
    }
  }
  return g;
}
export function diningTable(d: GameDefinition): T.Group {
  const g = new T.Group();
  cylinder(g, 0, 0.67, 0, 0.13, 1.25, d.dark);
  cylinder(g, 0, 1.3, 0, 0.8, 0.17, d.id === "pizza" ? "#f3e4bc" : "#f2c35d");
  for (const x of [-1.05, 1.05]) {
    box(g, x, 0.56, 0, 0.55, 0.18, 0.6, d.accent);
    box(g, x, 0.92, x < 0 ? -0.27 : 0.27, 0.57, 0.6, 0.09, d.accent);
    for (const z of [-0.18, 0.18]) box(g, x, 0.24, z, 0.1, 0.5, 0.1, d.dark);
  }
  cylinder(g, 0, 1.48, 0, 0.1, 0.23, "#eee9d4");
  ball(g, 0, 1.68, 0, 0.14, "#69904c");
  return g;
}
export function vehicle(d: GameDefinition, color: string): T.Group {
  const g = new T.Group();
  if (d.id === "burger") {
    box(g, 0, 0.65, 0, 1.25, 0.55, 2.3, color);
    box(g, 0, 1.1, -0.15, 1.1, 0.55, 1.15, color);
    box(g, 0, 1.18, 0.43, 1, 0.35, 0.035, "#bde1e5");
    box(g, 0, 1.18, -0.75, 1, 0.35, 0.035, "#bde1e5");
    for (const x of [-0.66, 0.66])
      for (const z of [-0.75, 0.75]) {
        const wheel = cylinder(g, x, 0.4, z, 0.27, 0.15, "#30414b");
        wheel.rotation.z = Math.PI / 2;
      }
    for (const x of [-0.4, 0.4])
      box(g, x, 0.72, 1.17, 0.23, 0.16, 0.04, "#fff4ba");
  } else {
    box(g, 0, 0.62, 0, 0.48, 0.25, 1.1, color);
    box(g, 0, 1, -0.4, 0.46, 0.6, 0.18, color);
    box(g, 0, 0.93, 0.3, 0.5, 0.14, 0.5, "#4f4442");
    box(g, 0, 1.3, 0.64, 0.78, 0.65, 0.6, "#deb178");
    for (const z of [-0.6, 0.6]) {
      const wheel = cylinder(g, 0, 0.32, z, 0.29, 0.17, "#36484b");
      wheel.rotation.z = Math.PI / 2;
    }
    box(g, 0, 1.37, -0.4, 0.7, 0.07, 0.1, "#bbc5ba");
  }
  return g;
}
