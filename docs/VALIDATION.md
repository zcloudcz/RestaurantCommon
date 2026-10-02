# Ověření — 30. září 2026

## Finální společný běh: smíšený tác a benzinka

Prošlo 54 testů Common, 16 testů GasStation a všech 25 společných browserových scénářů (Chrome, 2,2 minuty). Typecheck a produkční build všech tří her prošly. Burger umí na jednom tácu současně nést burgery a hranolky se společnou kapacitou, zachovat je po obnovení a vyložit i při zaplnění jedné zásoby pultu. Nezávislé review tuto změnu schválilo. Sedm browserových scénářů benzinky zahrnuje ruční tankování, rozšíření, mobilní cíle, zásobování dieselem, uložení a offline start. Starší výsledky níže zachycují předchozí etapy.

Výsledek je webová/PWA verze Burger Rush a Pizza Piazza se samostatnými buildy. Grafika je vlastní procedurální Three.js scéna, modely, SVG/PNG ikony a UI; zvuk vytváří Web Audio. Žádná grafika konkurence se nepoužívá.

## Následné změny: hranolky a rozpočet

Po přidání hranolků a ukazatele „Volné peníze“ prošlo 49 testů logiky a 17 browserových scénářů. Testy zahrnují samostatnou zásobu přílohy, jediné odečtení a zaplacení, automatizaci, migraci staré čtyřstanicové hry a viditelnost hotovosti na 360px obrazovce. Nezávislé review nezjistilo další závadu v tomto rozsahu. Burger v aktualizované aktivní simulaci dokončen za 29,7 minuty; hodinový automatický provoz obsloužil 430 zákazníků. Následující původní měření jsou z verze před hranolky.

## Automatické kontroly

Celkem prošlo 34 jednotkových/simulačních a 14 browserových scénářů (12 základních + 2 kontroly importu a screenshotů).

- `npm test`: 34 úspěšných testů. Výroba, kapacity, splátky, platby, ovládání, denní odměny, validace/migrace uložení, offline limit, jazyky, odlišné recepty a dlouhé simulační běhy.
- `npm run typecheck`: bez chyb.
- `npm run build`: oba samostatné produkční buildy. JavaScript přibližně 794 kB, gzip 215 kB na hru; CSS 16 kB. Vite upozorňuje na velikost jednoho balíku, který obsahuje Three.js a všechny offline slovníky.
- Browser Chrome/Playwright: ruční výrobní řetězec → prodej → rozšíření → obnovení obou her; mobilní rozložení, menu, dotykové tažení a zastavení; klávesnice po pauze, ztráta fokusu; německá automatická lokalizace, francouzská ruční volba, změna zařízení na japonštinu, arabské RTL; oba produkční buildy offline a zachování nečitelné zálohy.
- Samostatná kontrola importu rozvinutého podniku a návratu na nový stav v obou hrách včetně dalšího hraní a screenshotů.

## Vyvážení a výdrž

Deterministický aktivní operátor používá stejné výrobní stanice, pohyb, peníze a příkazy jako hráč. Burger: první rozšíření 17 s, poslední 30,5 min. Pizza: první rozšíření 20 s, poslední 27,1 min. Nejde o naměřené chování lidských hráčů ani o důkaz retence.

Hodinový simulovaný automatický provoz obsloužil 712 zákazníků u burgeru a 538 u pizzy. Při neobsluhované pokladně se populace zastaví na 40 entitách a uložený stav zůstává čitelný.

Nezávislé review identifikovalo sedm chyb. Opraveny: neomezený počet zákazníků, neplatné položky v importu, neprůchozí importovaná pozice, blokovaná klávesnice po kliknutí na tlačítko, pokračující automatická chůze po ztrátě fokusu, staré dynamické modely po importu a vizuálně stejná zahradní pizza. Následná kontrola oprav nenalezla další problém v tomto rozsahu.

## Hranice ověření

Browserové testy běžely v místním Chrome na Windows, telefonní viewport 390 × 844, desktop 1440 × 1000. Fyzické Android/iPhone, Safari, výkon na konkrétním telefonu a distribuce v obchodech nebyly ověřeny. Překlady mají úplné klíče a funkční rozhraní, neproběhla profesionální korektura rodilými mluvčími. Instalace/offline PWA vyžaduje HTTPS nebo localhost; běžné hraní na lokální síti funguje přes HTTP.

Screenshoty jsou v `BurgerRush/docs/screenshots` a `PizzaPiazza/docs/screenshots`. Zachycují rozvinutý stav vytvořený testem importu, nikoli délku lidského hraní. Zdrojové příkazy a postup spuštění jsou v README jednotlivých projektů.

## Druhá kapitola restaurací
Burger a Pizza mají 18 rozšíření a čtyři recepty. Původní dokončené uložení na úrovni 12 pokračuje bez resetu; kapacita nového tácu dosahuje s upgrady 25. Testy kontrolují bonusy, zamčený recept, odmítnutí neplatné úrovně, hranice uložení a průchod novou kapitolou z běžných tržeb. Všech 98 testů logiky a typecheck prošly. Nové dva browserové scénáře ověřují nákup úrovní 13–18, recept, reload a mobilní menu. Nezávislé review: opraveno zobrazení všech 25 položek; bez zbývajících nálezů. Automatická simulace nové kapitoly bez počáteční hotovosti: Burger 77,3 minuty, Pizza 49,3 minuty. Tyto časy nepředstavují lidský playtest.

Finální společný browserový běh restaurací: 20 scénářů včetně výroby, mobilního ovládání, jazyků, offline uložení, hranolků a druhé kapitoly.

Závěrečné ověření této iterace: všech 98 jednotkových testů Common, typecheck, oba produkční buildy restaurací a 20 browserových scénářů prošly. Benzinka navíc prošla samostatnými 7 browserovými scénáři po grafické úpravě (celkem 27).

## Fyzické rozšiřování restaurace
Rozšíření 1–18 mají fyzický projev v mapě. Úrovně 13–18 přidávají východní jídelnu, terasu, severní kuchyň s funkční stanicí, expresní křídlo s výdejem, salonek a vstupní zahradu. Celkem lze používat 14 stolů a 7 stanic. Zachována zakoupená vylepšení, recepty a hotovost; známé starší rozložení uložení se doplní automaticky.
Průběžně ověřeno 140 jednotkových testů a TypeScript. Regrese zahrnují funkční nové stanice/personál/platby, průchod přes hranice mapy, zastavení u cíle, migraci, průchod zákazníků a přesměrování číšníka z plného výdeje. Opraven klik na SVG ikonu přehledu mapy. Desktopové průchody přístavbami a obnovení pozice v novém křídle prošly u obou her.

Závěrečný běh po všech opravách: 140/140 jednotkových testů Common, typecheck a build všech tří her prošly. Všech 31 prohlížečových scénářů prošlo za 2,9 minuty; zahrnují nové přístavby, uložení v novém křídle, kliknutí na SVG přehledu, všechna mobilní tlačítka stanic, benzín/diesel a jejich kapacitu. Screenshoty physical-map.png a physical-map-mobile.png jsou v dokumentaci obou restaurací. Přehled viditelných změn po úrovních: PHYSICAL-EXPANSIONS.md.


## Empire and operating costs — 2026-09-30

- Common: 166 unit tests passed, including 14 career and 12 payroll regressions.
- GasStation: 22 unit tests passed, including 6 supply financial regressions and 20 seeded full progressions (46.16–47.93 minutes).
- TypeScript checking and production builds of all three games passed.
- All 24 restaurant browser scenarios passed; the enhanced empire scenario additionally verifies ten workers and the wage display after returning from a fresh branch and reloading. Both games pass that scenario.
- Career coverage: completion/affordability gates, fresh starts without duplicate cash, free return visits, all nine locations, legacy migration, network round-trip, bounded net offline income, debt repayment and corrupt-envelope rejection.
- Fixed hidden-tab save timestamps to preserve the unclaimed offline interval; refreshed branch daily goals on load/travel. Returning to a mastered branch resumes play without a repeated celebration dialog.
- Desktop/mobile empire screenshots: BurgerRush and PizzaPiazza `docs/screenshots/empire.png` and `empire-mobile.png`.

Final empire/economy verification: Common 166/166 units, Gas 22/22 units, 36 unique browser scenarios passed (24 restaurants + 12 gas; final focused economy run 14/14), global typecheck and all three production builds pass. Fresh links: http://localhost:4183/?v=empire-payroll ; http://localhost:4184/?v=empire-payroll ; http://localhost:4185/?v=paid-supplies . Existing saves preserved.
