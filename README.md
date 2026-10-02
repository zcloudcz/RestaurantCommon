# Restaurant Common

Shared foundation of Burger Rush, Pizza Piazza, Next Stop (GasStation) and Restaurant World: simulation, Three.js rendering, input, UI, localization (20 languages), saving, build/dev scripts and tests. The games import its code via relative paths and use its `node_modules`.

## Commands

```bash
npm ci
npm test            # unit tests (some also cover the sibling games)
npm run typecheck   # TypeScript across all projects
npm run build       # production build of all games
npm run test:e2e    # Playwright browser tests
```

Details: [docs/DETAILS.md](docs/DETAILS.md)

## Repository family

The games share code through relative paths, so all repositories must be cloned **side by side into one folder** (keep the folder names unchanged):

```bash
for r in RestaurantCommon CommonAdvanced BurgerRush PizzaPiazza GasStation RestaurantWorld; do git clone https://github.com/zcloudcz/$r.git; done
cd RestaurantCommon && npm ci
```

| Repo | Contents |
|---|---|
| [RestaurantCommon](https://github.com/zcloudcz/RestaurantCommon) | shared engine, UI, build tooling and tests |
| [CommonAdvanced](https://github.com/zcloudcz/CommonAdvanced) | operations simulation used by Restaurant World |
| [BurgerRush](https://github.com/zcloudcz/BurgerRush) · [PizzaPiazza](https://github.com/zcloudcz/PizzaPiazza) · [GasStation](https://github.com/zcloudcz/GasStation) · [RestaurantWorld](https://github.com/zcloudcz/RestaurantWorld) | games |

Stack: TypeScript, Three.js, Vite, Vitest, Playwright. Requires Node.js 22.12+ and a browser with WebGL 2.

## License

[MIT](LICENSE) © 2026 Martin Zahálka
