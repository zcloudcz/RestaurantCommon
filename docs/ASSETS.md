# Assets and architecture

## Original art

All game models are authored for this project in `src/render/models.ts` and `src/render/scene.ts`: characters, chef hats, articulated limbs, burgers, buns, patties, pizzas/toppings, dough, grill/hood, prep benches, brick oven/fire, counters/awnings, register, furniture, trees, plants, cars, scooters, trash and carried trays. No commercial asset packs, stock textures or copied game art are used.

Each game owns its SVG brand icon and generated 192/512px PNG versions in its own `public/`. Regenerate PNG icons with `node scripts/icons.mjs` in Common; this uses local Chrome to rasterize the original SVG. Signs are drawn locally using Canvas. Fonts use installed system font fallbacks and require no web download.

Sound effects are original Web Audio oscillator envelopes in `src/render/audio.ts`. UI symbols are original SVG paths in `src/ui/icons.ts`.

## Dependencies

- Three.js and its BufferGeometryUtils: MIT; geometry, lighting and rendering. Static geometry is merged by material to reduce draw calls.
- Zod: MIT; strict save validation and explicit v0 migration.
- Vite, TypeScript, Vitest, Playwright and Prettier are development/build/test tools. Their upstream license files ship in the installed dependency directories. Exact dependencies are recorded in `package-lock.json`.

## Project boundaries

`BurgerRush/src/definition.ts` and `PizzaPiazza/src/definition.ts` supply typed maps, recipes, pricing and progression. `RestaurantCommon/src/game/` contains headless simulation with no Three.js or browser dependency. Renderer reads state; HUD issues commands. The browser shell owns time, persistence, pause and lifecycle. Saves never contain renderer references.

The game definitions compile into each independent `dist/`. A deployed game does not make HTTP requests to a separate Common service. Keeping the Common project alongside the games is required for source development, not for hosting the built output.
