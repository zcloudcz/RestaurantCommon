# Restaurant Common

Sdílený základ her Burger Rush, Pizza Piazza, Next Stop (GasStation) a Restaurant World: simulace, Three.js grafika, ovládání, UI, lokalizace (20 jazyků), ukládání, build/dev skripty a testy. Hry z něj importují kód relativní cestou a používají jeho `node_modules`.

## Příkazy

```bash
npm ci
npm test            # unit testy (část testuje i sousední hry)
npm run typecheck   # TypeScript přes všechny projekty
npm run build       # produkční build všech her
npm run test:e2e    # Playwright testy v prohlížeči
```

Podrobnosti: [docs/DETAILS.md](docs/DETAILS.md)

## Rodina repozitářů

Hry sdílí kód přes relativní cesty, proto se všechny repozitáře klonují **vedle sebe do jedné složky** (názvy složek musí zůstat stejné):

```bash
for r in RestaurantCommon CommonAdvanced BurgerRush PizzaPiazza GasStation RestaurantWorld; do git clone https://github.com/zcloudcz/$r.git; done
cd RestaurantCommon && npm ci
```

| Repo | Obsah |
|---|---|
| [RestaurantCommon](https://github.com/zcloudcz/RestaurantCommon) | sdílený engine, UI, build a testy |
| [CommonAdvanced](https://github.com/zcloudcz/CommonAdvanced) | provozní simulace pro RestaurantWorld |
| [BurgerRush](https://github.com/zcloudcz/BurgerRush) · [PizzaPiazza](https://github.com/zcloudcz/PizzaPiazza) · [GasStation](https://github.com/zcloudcz/GasStation) · [RestaurantWorld](https://github.com/zcloudcz/RestaurantWorld) | hry |

Stack: TypeScript, Three.js, Vite, Vitest, Playwright. Node.js 22.12+, prohlížeč s WebGL 2.
