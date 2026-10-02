# Execution ledger — NewGameAnalysis/implementacni-plan.md

## 2026-10-01 — Independent expansion choices and the fourth game

The user authorized implementation, with a separate reusable CommonAdvanced layer and a continuously controlled avatar in RestaurantWorld. The earlier documentation-only status is superseded: CommonAdvanced now contains an implementation, and RestaurantWorld has a playable build. RestaurantCommon retains the existing games and shared tooling; the generic one-based `offeredIds(total, owned, dependencies)` policy is shared by the projects.

Burger Rush, Pizza Piazza and Next Stop now track purchased expansion IDs independently from the completion count. The UI offers two eligible purchases; only the selected purchase grants its furniture, stations, recipes, staffing and other effects. Prerequisites protect connected floors and seating. When only one expansion is eligible, an available paid skill upgrade appears as the other option, with its own price and effect; it does not count as a map expansion. Exhausted upgrades and a completed progression are finite end states, not fabricated choices.

Separate contributions persist per expansion. Gas keeps a partially funded offer available when another purchase unlocks earlier candidates. Legacy saves with only `level`/`paid` retain sequential ownership and their existing contribution. Navigation, physical rendering, staffing, supply access, recipes, offline income and career behavior use actual ownership. Merely standing on the restaurant plot does not choose a purchase; automatic contribution requires an explicitly selected expansion.

Verification for this stage:

- RestaurantCommon: 177/177 unit tests; final complete run used two workers. A preceding concurrent browser/unit run had three timeout-only failures; focused reruns and the final full run passed. Legacy ownership checks were changed to avoid allocating an array on every capability query.
- GasStation: 27/27 unit tests. Twenty seeded progression runs finished in 46.16–47.93 simulated minutes, checking vehicle overlaps every tick and save validity each minute. Reversed-choice progression and separate funding also round-trip successfully.
- CommonAdvanced: 18/18 tests passed, including the two additional inventory regressions, as confirmed by the integration controller. The earlier independent run at 11:03 covered 16 tests.
- Browser coverage: 26 distinct passing scenarios for the existing games in this stage, including real second-option purchases, persistence, paid skill alternatives, Gas layouts and physical restaurant expansions. The integration controller also reported two passing RestaurantWorld scenarios.
- Global TypeScript check and all four production builds passed, as confirmed by integration. Existing bundle-size warnings remain; they are not build failures.
- Independent Common/Gas review found no remaining issues after exhaustively checking 148 reachable Common states / 534 purchase-and-funding cases and 90 Gas states / 320 cases. Every checked save decoded and preserved the relevant alternative's funding. This signoff does not cover CommonAdvanced or RestaurantWorld.

Permanent choice screenshots: `BurgerRush/docs/screenshots/two-choices.png`, `PizzaPiazza/docs/screenshots/two-choices.png`, `GasStation/docs/screenshots/two-choices.png`. Gas also retains the cream topbar, shared icons, yellow wallet, responsive sidebar/bottom sheet and current/max tank gauges introduced in this stage.

Remaining integration work at this checkpoint: RestaurantWorld localization and its project documentation are still being finalized by their owner; The additional CommonAdvanced inventory regressions passed; its separate final review is tracked by the integration controller. Do not describe all four projects as fully finalized based on this entry. Physical phones/Safari, professional translation proofreading and human gameplay/retention testing remain unverified. No Git commits were created.

## Historical execution entries

Final follow-up complete, 2026-09-30: Burger mixed burger/fries trays share capacity, render both items, persist across reload and unload without loss. Independent review approved. GasStation is implemented and integrated, superseding the earlier specification-only status below. All 54 Common tests, 16 GasStation tests, 25 integrated browser scenarios, global typecheck and all three production builds passed. Previews: Burger 4183, Pizza 4184, Gas 4185. No implementation tasks pending.

User approved inline execution and separate directories on 2026-09-30.
Ruling: RestaurantCommon, PizzaPiazza and BurgerRush are sibling projects instead of one RestaurantGames directory, as explicitly requested. Dependencies/tooling are installed once in Common; each game has its own entry, definitions, assets, manifest and dist output.
Ruling: No parent Git repository exists. New project directories provide isolation; no existing project is modified. Portable Windows workflow uses this ledger rather than POSIX worktree scripts.
Preflight: definitions -> simulation -> renderer/HUD -> save all consume a single GameState contract. UI sends commands; renderer never mutates state. Definitions stay in individual games.
Tasks 1-5 implemented. Common owns simulation, renderer, controls, saving and HUD; games own definitions, entrypoints, icons/manifests and separate builds.
Task 6 verification in progress: 26 unit/simulation tests and four initial browser tests passed; added save migration and four more browser checks (offline both games, invalid save preservation, touch input).
Ruling: active-operator balancing changed burger base price to 10, pizza first table to 24, pizza movement to 5 and oven batch time to 2.8. Simulation reaches first unlock in 17/20 seconds and full completion in 30.5/27.1 minutes. These are simulation measurements, not human retention or playtest evidence.
Ruling: original optional mobile SDKs are excluded as approved. Local PWA cache and JSON save are real; there are no simulated advertisements or payment buttons.
Navigation regression fixed: clearance around grid obstacles prevents workers being stuck on floating-point corner boundaries. One-hour simulations now serve 712 burger / 538 pizza customers.
Persistence regression fixed: timestamps use a separate epoch-millisecond validator (currency bounds are not timestamp bounds). Unknown/corrupt saves remain intact until explicit import/reset.
Final-review focus: blur/cancel stops input; wrong-item carrier can recover at trash; invalid and future saves protected; shared inventory cannot double-consume; production cache works independently per game.
Independent review complete: seven findings fixed and approved in a focused re-review. 34 unit/simulation tests, TypeScript and both production builds pass. All 14 browser scenarios pass, including the final two restoration/screenshot scenarios. Results in docs/VALIDATION.md.
User addition completed: 20 full language dictionaries, browser/device auto-detection, persistent manual choice and Arabic RTL. All dictionaries have 180 keys.
Third-game addition: GasStation/RESEARCH.md and SPEC.md define Next Stop, researched against five official store listings. GasStation is specification only; implementation was not requested in this addition.
Final delivery: separate deployable dist folders, local previews on 4183/4184, project READMEs, original-asset notes and validation record.

Follow-up: removed Burger counter canopy and expanded player interaction around stations. Added fries (fryer at expansion3, separate side stock/transport/payment, staff supply, new models), exact legacy save migration and visible uninvested funds in both HUDs. 49 unit tests pass, focused fries/budget/localization/restore browser checks pass; independent review approves. Three aliases and gas target added to shared tools while GasStation implementation proceeds independently.
`nShared player reach corrected: removed Burger-only condition in production.interact. Both games use distance to the full station footprint; staff transfer points remain unchanged. 46 station reach cases cover pickup/drop from four sides and no accidental pickup between stations. All 91 unit tests, typecheck and Pizza production build passed. Pizza counter canopy also removed in preceding follow-up.

Second restaurant chapter implemented: 18 expansions and four recipes per game; levels13–18 grant tray+5, staff movement+35%, signature recipe, production+50%, sales+20%, offline+50% and gold scenery. Existing level12 saves continue. Shared max tray25 and dynamic HUD completion. 98 unit tests covered by main97 run plus added signature-model test; typecheck/build pass; all20 restaurant browser scenarios pass. Review approved after removing20-item render truncation. Gas visuals independently enhanced; final interaction visibility fix in progress.

Physical expansion request COMPLETE: levels13–18 now connected usable wings/garden, 14tables7stations, actualstaff/customerflows, alllevels1–18visualchanges. Legacy4table/oldstation saves migrate, existingbonusespreserved. Navigationconcavecorner, NPCseatboundary, fullbufferstafflatch, SVGoverviewclick fixed with regressions. 140Commonunit+16Gasunit tests, globaltypecheck, all3builds,31integratedbrowser scenarios passed. Gas capacitycurrent/max atpumpsandHUD, localized20languages. No work pending.

Career and payroll implementation (2026-09-30): Added nine persistent branches per brand across city, country and world. Opening requires the previous branch at level 18 plus its one-time cost; new branches start at level 0 with no purchased upgrades or staff, using the remaining shared wallet. Returning is free and restores each branch’s state. Inactive automated branches earn estimated net income after payroll; legacy saves migrate into branch one and career exports include all branches. Added a mobile-safe career map, permanent navigation, completion CTA and translated financial/status text. Staff now grow from four at level 11 to ten at level 18, with stable IDs and 23 $/minute total wages at level 18. Wages accrue during active simulation; unpaid amounts persist and are repaid from later income while staff keep working. Documentation updated in both READMEs and docs/EMPIRE.md. Final integrated verification is tracked separately.

Final empire/economy verification: Common 166/166 units, Gas 22/22 units, 36 unique browser scenarios passed (24 restaurants + 12 gas; final focused economy run 14/14), global typecheck and all three production builds pass. Fresh links: http://localhost:4183/?v=empire-payroll ; http://localhost:4184/?v=empire-payroll ; http://localhost:4185/?v=paid-supplies . Existing saves preserved.


## Integrated completion — 2026-10-01

Delivered the two-choice progression across Burger/Pizza/Gas and RestaurantWorld. Common footprint distance is now shared by fast-food production and CommonAdvanced; the existing 70 reach regressions and new side-pickup check pass. RestaurantWorld runs on CommonAdvanced, with 12 physical expansions, 4 cuisines / 20 recipes, 5 paid staff roles, real stock and deliveries, reusable plates, and 9 fresh-start branches with shared cash. A paid movement skill supplements the final expansion choice. Inventory transaction utilities are game-independent; the first complete runtime remains restaurant-oriented, with future general adapters documented honestly.

Final evidence: Common177 + Gas27 + Advanced21 =225 unit tests passed; 26 legacy browser scenarios plus3 World gameplay/lifecycle cases and1 production offline-PWA reload =30 browser scenarios. All4 production builds and globalTypeScript check passed. Review fixed invalid save relationships, reserved-storage accounting, hidden-tab resume, paused reset and blur auto-walk. Original saves remain compatible. Final screenshot: RestaurantWorld/docs/playable-mobile.png. Preview4186, development4176; existing4183/4184/4185 retained.

Localization: automatic browser/device selection among20 locales. World Czech/English are complete;18others have translated core controls with English fallback for remaining new descriptions/menu/help. Physical-device Safari and human economic/playability tuning remain unverified. Further Gas UI redesign was deliberately deferred at user request. No commits or deployment performed.
