import { build } from "vite";
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { configFor, rootFor } from "./config.mjs";
for (const id of process.argv[2] === "all"
  ? ["pizza", "burger", "gas", "world"]
  : [process.argv[2]]) {
  await build(configFor(id));
  const out = join(rootFor(id), "dist");
  const files = [
    "./",
    "./index.html",
    "./manifest.webmanifest",
    "./icon.svg",
    "./icon-192.png",
    "./icon-512.png",
    ...(await readdir(join(out, "assets"))).map((f) => "./assets/" + f),
  ];
  const hash = createHash("sha256").update(files.join());
  for (const file of files.slice(1))
    hash.update(await readFile(join(out, file)));
  const revision = hash.digest("hex").slice(0, 12);
  await writeFile(
    join(out, "sw.js"),
    `const CACHE='${id}-${revision}';const FILES=${JSON.stringify(files)};
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('${id}-')&&k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(caches.match(e.request).then(hit=>hit||fetch(e.request).catch(()=>e.request.mode==='navigate'?caches.match('./index.html'):Response.error())))});`,
  );
}
