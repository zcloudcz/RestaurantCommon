# Restaurant Common

A shared project for two standalone 3D idle arcade games: **Burger Rush** and **Pizza Piazza**. It contains the game simulation, Three.js graphics, controls, UI, sounds, saving, tests, and build tools. Each game has its own sibling directory, configuration, icons, manifest, and resulting website.

## Running

You need Node.js 22.12+ and a browser with WebGL 2. Keep the sibling directories together:

```text
GAMES/
  RestaurantCommon/
  BurgerRush/
  PizzaPiazza/
```

Run once in this directory:

```powershell
npm ci
```

Then, in the directory of the chosen game:

```powershell
npm run dev
```

- Burger Rush: `http://localhost:4173`
- Pizza Piazza: `http://localhost:4174`
- Phone on the same Wi-Fi: use the `Network` address printed by the server. Access may depend on the local network/firewall settings.

The development game works without a backend or registration. Dependencies are installed only in `RestaurantCommon`; both games use the tools here.

## Production build and PWA

```powershell
# In RestaurantCommon, builds both games:
npm run build

# In each game, separately:
npm run build
npm run preview
```

The results are in `BurgerRush/dist/` and `PizzaPiazza/dist/`. Each folder can be deployed on its own to static HTTPS hosting, including in a subdirectory. No remote library, font, or model is needed at runtime. The build contains a local cache and PWA icons.

**Installation and offline mode require HTTPS or localhost.** A plain LAN address over HTTP is suitable for trying out the controls on a phone; it does not provide PWA/offline features. The first load must happen online. Once the cache is complete, the game works without a network. A new service worker version does not replace the interface during a game in progress.

## What is done

- Two distinct production chains: grill → burger, and dough → preparation → batch baking.
- The burger game additionally unlocks a deep fryer and separately carried fries, which customers buy as a side. Older saved games are automatically extended with the new station.
- Manual carrying, a shared tray for burgers and fries, capacity, transfer zones, production into buffers, pickup counter, orders, cash register, and revenue.
- Customers, queue, tables, cleanup, trash bin, drive-thru / scooter delivery.
- Twelve business expansions, four work roles, six upgrade tracks, three recipes, and three aprons.
- Three daily tasks, navigation hints, a final summary, and continued play after the restaurant is completed.
- Touch drag, WASD/arrow keys, and a click on a station marker to walk there automatically.
- UI in 20 languages: Czech, English, Slovak, German, French, Spanish, Italian, Portuguese, Polish, Dutch, Ukrainian, Russian, Romanian, Hungarian, Turkish, Chinese (Simplified), Japanese, Korean, Arabic, and Hindi. Automatic selection based on browser preferences, a saved manual choice, Arabic RTL, and local number formatting.
- Sounds, pause, reduced effects, and power-saving graphics.
- Separate saved games, backup export/import, schema validation, v0 → v1 migration, autosave, and offline income after full automation.
- A permanently visible "Free money" (Volné peníze) indicator distinguishes uninvested cash from the amount put into an expansion.

Offline income is a conservative estimate of sustainable automated production, not a simulation of every individual offline customer. The default limit is two hours; upgrades raise it to eight.

The third project, `GasStation`, shares small graphics helper functions, controls, sound, language settings, and tools. It has its own simulation of traffic, stock, and services, and its own saved game. `npm run build` builds all three projects; individually you can run `node scripts/build.mjs burger`, `pizza`, or `gas`. The gas station uses dev port 4175 and preview port 4185 during validation. Its simulation tests are run with `npm test` directly in `GasStation`.

## Controls

Stand in a station's zone; loading and unloading happen automatically. Clicking a station label or the arrow of the current target walks the character to that spot. Manual movement interrupts the planned path. Burgers and fries can be on one tray together and share its capacity; other goods types are carried separately. Take unwanted cargo or trash to the bin.

At first you operate the cash register by standing in its zone. The green expansion area continuously spends available money; the alternative is the funding button in the business panel. Partial payments are saved. Eventually, employees take over the whole chain.

## Validation

From this directory:

```powershell
npm test
npm run typecheck
npm run build
npm run test:e2e
```

The browser tests use a local Google Chrome. Playwright starts the required dev/preview servers on ports 4173, 4174, 4183, and 4184. Create a production build before the browser tests. If all the servers are already running, you can set `RESTAURANT_SERVERS_RUNNING=1` and manage their lifecycle separately.

The tests cover the behavior of stock, payments, saving, touch input, automation, a run through the entire progression, an hour of employee operation, and the offline browser. A simulated run is not a measurement of a real player. A physical Android/iPhone and publishing to stores were not verified; this delivery is a web/PWA, without ads, payment SDKs, or a cloud account.

Details on the structure and origin of the graphics: [ASSETS.md](ASSETS.md). Validation results: [VALIDATION.md](VALIDATION.md).
