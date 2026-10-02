# RestaurantCommon
Shared TypeScript simulation, Three.js renderer and browser shell for sibling projects PizzaPiazza and BurgerRush. Game-specific definitions live in those projects.
Run npm test, npm run typecheck, npm run build, npm run test:e2e here.
Do not couple simulation to DOM or renderer. New money/inventory behavior needs a regression test. Keep separate save slots. Do not modify existing unrelated games.
