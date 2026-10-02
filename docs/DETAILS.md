# Restaurant Common

Společný projekt pro dvě samostatné 3D idle arcade hry: **Burger Rush** a **Pizza Piazza**. Obsahuje herní simulaci, Three.js grafiku, ovládání, rozhraní, zvuky, ukládání, testy a build nástroje. Každá hra má vlastní sousední adresář, konfiguraci, ikony, manifest a výsledný web.

## Spuštění

Potřebuješ Node.js 22.12+ a prohlížeč s WebGL 2. Zachovej sourozenecké adresáře:

```text
GAMES/
  RestaurantCommon/
  BurgerRush/
  PizzaPiazza/
```

Jednorázově v tomto adresáři:

```powershell
npm ci
```

Potom v adresáři vybrané hry:

```powershell
npm run dev
```

- Burger Rush: `http://localhost:4173`
- Pizza Piazza: `http://localhost:4174`
- Telefon ve stejné Wi-Fi: použij adresu `Network`, kterou vypíše server. Přístup může záviset na nastavení místní sítě/firewallu.

Vývojová hra funguje bez backendu nebo registrace. Závislosti se instalují pouze v `RestaurantCommon`; obě hry používají zdejší nástroje.

## Produkční build a PWA

```powershell
# V RestaurantCommon sestaví obě hry:
npm run build

# V každé hře lze samostatně:
npm run build
npm run preview
```

Výsledky jsou v `BurgerRush/dist/` a `PizzaPiazza/dist/`. Každou složku lze samostatně nasadit na statický HTTPS hosting, i do podadresáře. Žádná vzdálená knihovna, font ani model není potřeba za běhu. Build obsahuje lokální cache a ikony PWA.

**Instalace a offline režim vyžadují HTTPS nebo localhost.** Obyčejná LAN adresa přes HTTP je vhodná pro vyzkoušení ovládání na telefonu; nezajišťuje PWA/offline funkce. První načtení musí proběhnout online. Po dokončení cache hra funguje bez sítě. Nová verze service workeru nenahrazuje rozhraní během rozehrané hry.

## Co je hotové

- Dva odlišné výrobní řetězce: gril → burger a těsto → příprava → dávkové pečení.
- Burger navíc odemyká fritézu a samostatně přenášené hranolky, které zákazníci kupují jako přílohu. Starší uložené hry se automaticky doplní o novou stanici.
- Ruční nošení, společný tác pro burgery a hranolky, kapacita, přenosové zóny, výroba do bufferů, výdej, objednávky, pokladna a tržby.
- Zákazníci, fronta, stoly, úklid, koš, drive-thru / rozvoz skútry.
- Dvanáct rozšíření podniku, čtyři pracovní role, šest řad vylepšení, tři recepty a tři zástěry.
- Tři denní úkoly, navigační nápověda, závěrečné vyhodnocení a pokračování po dokončení restaurace.
- Dotykové tažení, WASD/šipky a kliknutí na označení stanice pro automatické dojití.
- Rozhraní ve 20 jazycích: čeština, angličtina, slovenština, němčina, francouzština, španělština, italština, portugalština, polština, nizozemština, ukrajinština, ruština, rumunština, maďarština, turečtina, čínština (zjednodušená), japonština, korejština, arabština a hindština. Automatická volba podle preferencí prohlížeče, uložená ruční volba, arabské RTL a místní formátování čísel.
- Zvuky, pauza, omezení efektů a úsporná grafika.
- Samostatné uložené hry, export/import zálohy, kontrola schématu, migrace v0 → v1, automatické ukládání a offline příjem po plné automatizaci.
- Trvale viditelný ukazatel „Volné peníze“ odlišuje neinvestovanou hotovost od částky vložené do rozšíření.

Offline příjem je konzervativní odhad udržitelné automatizované výroby, nikoli simulace každého jednotlivého offline zákazníka. Výchozí limit jsou dvě hodiny, vylepšení jej zvyšují na osm.

Třetí projekt `GasStation` sdílí drobné grafické pomocné funkce, ovládání, zvuk, jazykové nastavení a nástroje. Má vlastní simulaci dopravy, zásob a služeb i vlastní uloženou hru. `npm run build` sestaví všechny tři projekty; jednotlivě lze spustit `node scripts/build.mjs burger`, `pizza` nebo `gas`. Benzinka používá dev port 4175 a při ověřování produkční preview 4185. Její simulační testy se spouštějí příkazem `npm test` přímo v `GasStation`.

## Ovládání

Postav se do zóny u stanice; naložení a vyložení probíhá automaticky. Kliknutí na štítek stanice nebo šipku aktuálního cíle dovede postavu na místo. Ruční pohyb plánovanou cestu přeruší. Burgery a hranolky mohou být společně na jednom tácu a sdílejí jeho kapacitu; ostatní typy zboží se přenášejí odděleně. Nechtěný náklad nebo odpadky odnes do koše.

Pokladnu zpočátku obsluhuješ stáním v její zóně. Zelená rozšiřovací plocha průběžně utrácí dostupné peníze; alternativou je tlačítko financování v panelu podniku. Částečné splátky se ukládají. Nakonec zaměstnanci převezmou celý řetězec.

## Ověření

Z tohoto adresáře:

```powershell
npm test
npm run typecheck
npm run build
npm run test:e2e
```

Browserové testy používají místní Google Chrome. Playwright spustí potřebné dev/preview servery na portech 4173, 4174, 4183 a 4184. Před browserovými testy vytvoř produkční build. Pokud všechny servery už běží, lze nastavit `RESTAURANT_SERVERS_RUNNING=1` a spravovat jejich životní cyklus samostatně.

Testy pokrývají chování zásob, plateb, ukládání, dotyků, automatizace, průchod celou progresí, hodinový chod zaměstnanců a offline browser. Simulovaný průchod není měření skutečného hráče. Fyzický Android/iPhone a publikování do obchodů nebyly ověřeny; tato dodávka je web/PWA, bez reklam, platebních SDK a cloudového účtu.

Podrobnosti o struktuře a původu grafiky: [ASSETS.md](ASSETS.md). Výsledky ověření: [VALIDATION.md](VALIDATION.md).
