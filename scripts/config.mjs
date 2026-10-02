import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
export const common = fileURLToPath(new URL("..", import.meta.url));
const projects = {
  pizza: "PizzaPiazza",
  burger: "BurgerRush",
  gas: "GasStation",
  world: "RestaurantWorld",
};
export const rootFor = (id) => {
  if (!projects[id]) throw new Error(`Unknown game: ${id}`);
  return resolve(common, "..", projects[id]);
};
export const portFor = (id) => ({ pizza: 4174, burger: 4173, gas: 4175, world: 4176 })[id];
export const configFor = (id) => ({
  root: rootFor(id),
  base: "./",
  configFile: false,
  resolve: {
    alias: [
      {
        find: /^three$/,
        replacement: resolve(
          common,
          "node_modules/three/build/three.module.js",
        ),
      },
      {
        find: /^three\/addons\//,
        replacement: resolve(common, "node_modules/three/examples/jsm") + "/",
      },
    ],
  },
  server: {
    host: "0.0.0.0",
    port: portFor(id),
    strictPort: true,
    fs: { allow: [resolve(common, "..")] },
  },
  preview: { host: "0.0.0.0", port: portFor(id), strictPort: true },
  build: { outDir: "dist", emptyOutDir: true, chunkSizeWarningLimit: 650 },
});
