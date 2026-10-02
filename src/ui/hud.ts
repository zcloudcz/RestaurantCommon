import { expansionChoices, expansionPaid } from "../game/types";
import { hasExpansion } from "../game/types";
import { renderEmpire, type CareerView } from "./empire";
import { payrollPerMinute } from "../game/staff";
import type {
  GameState,
  GameDefinition,
  GameCommand,
  Vec,
} from "../game/types";
import { REGISTER, TRASH, PLOT } from "../game/types";
import type { WorldLabel } from "../render/scene";
import {
  locales,
  isLocale,
  resolveLocale,
  translate,
  localize,
  type LanguageChoice,
} from "./i18n";
import { icon } from "./icons";
import { goal } from "./goal";
import { capacity } from "../game/production";
import { upgradeCost } from "../game/simulation";
import { price, friesPrice } from "../game/customers";
export interface HudActions {
  empire(): CareerView;
  travel(index: number): void;
  command(a: GameCommand): void;
  move(v: Vec): void;
  pause(value: boolean): void;
  sound(value: boolean): void;
  quality(value: boolean): void;
  overview(): boolean;
  export(): void;
  import(file: File): void;
  reset(): void;
}
export function createHud(
  root: HTMLElement,
  d: GameDefinition,
  actions: HudActions,
) {
  const preferenceKey = `restaurant.${d.id}.language`;
  let choice: LanguageChoice = "auto";
  try {
    const saved = localStorage.getItem(preferenceKey);
    if (saved && isLocale(saved)) choice = saved;
  } catch {
    /* The game remains usable without storage. */
  }
  let lang = resolveLocale(choice, navigator.languages),
    sound = false,
    reduced = matchMedia("(prefers-reduced-motion: reduce)").matches,
    paused = false,
    state: GameState,
    modal = "",
    toastTimer = 0;
  const tr = (key: string) => translate(key, lang);
  const t = (_cs: string, en: string) => tr(en);
  let formatter = new Intl.NumberFormat(lang, { maximumFractionDigits: 0 });
  const fmt = (n: number) => formatter.format(Math.floor(n));
  let lastSaveStatus: boolean | undefined;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  root.innerHTML = `<header class="topbar"><a class="brand" href="./" aria-label="${d.title}"><img src="./icon.svg" alt=""><div><strong>${d.title}</strong><span>${localize(d.subtitle, lang)}</span></div></a><div class="open-sign"><i></i><span data-open>Otevřeno</span></div><div class="top-actions"><div class="wallet">${icon("coin")}<div class="wallet-copy"><span id="budget-label">${tr("Available funds")}</span><div class="wallet-value"><strong id="money">0</strong><span> $</span></div></div></div><button class="icon-button" data-action="sound" aria-label="Zapnout zvuk">${icon("mute")}</button><button class="icon-button" data-action="pause" aria-label="Pauza">${icon("pause")}</button><button class="icon-button" data-action="settings" aria-label="Nastavení">${icon("settings")}</button></div></header>
 <main class="game-layout"><section class="stage" aria-label="Herní plocha"><canvas id="world" tabindex="0" aria-label="Pohyb WASD nebo šipkami"></canvas><div class="labels"></div><div class="mission"><div class="mission-icon">${icon("chef", 26)}</div><div><span id="mission-label">Tvůj další krok</span><strong id="mission-text"></strong></div><button data-action="goal" aria-label="Dojít k cíli">${icon("arrow")}</button></div><div class="world-tools"><button class="icon-button" data-action="overview" aria-label="Přehled mapy">${icon("map")}</button><button class="icon-button" data-action="help" aria-label="Jak hrát">${icon("help")}</button></div><div class="carry"><span class="carry-icon">${icon("bag")}</span><div><strong id="carry-count">0 / 5</strong><span id="carry-item">Prázdný tác</span></div><div class="carry-slots"></div></div><div class="control-hint"><kbd>W A S D</kbd><span> nebo táhni prstem · klikni na stanici</span></div><div class="joystick"><span></span></div><div class="pause-screen" hidden><div>${icon("pause", 40)}<h2>Chvilka odpočinku</h2><p>Tvůj podnik počká.</p><button class="primary" data-action="pause">Pokračovat</button></div></div><div class="toast" role="status"></div></section>
 <aside class="sidebar"><button class="sheet-close icon-button" data-action="sheet">${icon("close")}</button><div class="chapter"><span id="chapter-label">Tvůj podnik</span><strong><span id="chapter">01</span><small> / ${d.unlocks.length}</small></strong></div><div class="progress-track"><i id="progress"></i></div><div class="next-card"><span class="eyebrow" id="next-label">Další velká věc</span><div class="next-art" id="next-art"></div><h1 id="next-name"></h1><p id="next-desc"></p><div class="funding"><span id="funding-text"></span><strong id="next-cost"></strong></div><div class="funding-track"><i id="funding-bar"></i></div><button class="primary" data-action="unlock" id="unlock-button"></button></div><div id="second-expansion"></div><div class="section-title"><h2 id="numbers-title">Dnes v restauraci</h2>${icon("spark", 18)}</div><div class="stats"><div><strong id="served">0</strong><span id="served-label">Hosté</span></div><div><strong id="price">8 $</strong><span id="price-label">Za porci</span></div><div><strong id="staff-count">0</strong><span id="staff-label">Tým</span></div></div><button class="menu-link" data-action="upgrades">${icon("fire")}<span id="upgrades-label">Vylepšení & tým</span>${icon("arrow", 18)}</button><button class="menu-link" data-action="tasks">${icon("list")}<span id="tasks-label">Denní úkoly</span><b id="task-badge">3</b></button><button class="menu-link" data-action="menu">${icon("chef")}<span id="menu-label">Recepty & styl</span>${icon("arrow", 18)}</button><button class="menu-link" data-action="empire">${icon("map")}<span id="empire-label">${tr("Empire")}</span>${icon("arrow", 18)}</button><div class="sidebar-note">${icon("check", 16)}<span id="save-status">Postup se ukládá automaticky</span></div></aside></main>
 <nav class="mobile-nav"><button data-action="empire">${icon("map")}<span data-mobile="empire">${tr("Empire")}</span></button><button data-action="sheet">${icon("star")}<span data-mobile="grow">Rozšířit</span></button><button data-action="upgrades">${icon("fire")}<span data-mobile="upgrades">Vylepšení</span></button><button data-action="tasks">${icon("list")}<span data-mobile="tasks">Úkoly</span></button><button data-action="menu">${icon("chef")}<span data-mobile="menu">Menu</span></button></nav><dialog><div class="dialog-head"><h2 id="dialog-title"></h2><button class="icon-button" data-action="close" aria-label="Zavřít">${icon("close")}</button></div><div id="dialog-content"></div></dialog><input id="import-file" type="file" accept="application/json,.json" hidden>`;
  const get = (id: string) => root.querySelector<HTMLElement>("#" + id)!;
  const dialog = root.querySelector("dialog")!;
  const labelRoot = root.querySelector<HTMLElement>(".labels")!;
  const labelDefs = [
    ...d.stations.map((st) => ({ id: st.id, pos: { x: st.x, z: st.z + 1.5 } })),
    { id: "register", pos: REGISTER },
    { id: "trash", pos: TRASH },
    { id: "unlock", pos: PLOT },
  ];
  const labels = new Map(
    labelDefs.map((st) => {
      const el = document.createElement("button");
      el.className = "world-label";
      el.dataset.station = st.id;
      el.addEventListener("click", () =>
        st.id === "unlock"
          ? root.classList.add("sheet-open")
          : actions.move(st.pos),
      );
      labelRoot.append(el);
      return [st.id, el];
    }),
  );
  function toast(text: string) {
    const el = root.querySelector<HTMLElement>(".toast")!;
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => el.classList.remove("show"), 3200);
  }
  function open(name: string) {
    modal = name;
    actions.pause(true);
    renderModal();
    if (!dialog.open) dialog.showModal();
  }
  function close() {
    dialog.close();
    modal = "";
    actions.pause(paused);
  }
  function renderModal() {
    if (!state) return;
    const s = state;
    let title = "",
      html = "";
    dialog.classList.toggle("empire-dialog", modal === "empire");
    if (modal === "empire") {
      title = tr("Your restaurant empire");
      html = renderEmpire(actions.empire(), tr, fmt);
    } else if (modal === "upgrades") {
      title = t("Lepší každý den", "Better every day");
      const names: Record<keyof GameState["upgrades"], string> = {
        speed: t("Rychlé nohy", "Quick feet"),
        capacity: t("Větší tác", "Bigger tray"),
        income: t("Lepší marže", "Better margins"),
        production: t("Svižná kuchyně", "Fast kitchen"),
        staff: t("Zkušený tým", "Experienced team"),
        offline: t("Delší offline příjem", "More offline hours"),
      };
      html = `<p class="dialog-intro">${t("Každé malé vylepšení je v restauraci znát.", "Small improvements make a big difference.")}</p>`;
      for (const key of Object.keys(names) as (keyof GameState["upgrades"])[]) {
        const cost = upgradeCost(s, key);
        html += `<div class="shop-row"><span class="shop-icon">${icon(key === "capacity" ? "bag" : key === "staff" ? "team" : "spark")}</span><div><strong>${names[key]}</strong><small>${t("Úroveň", "Level")} ${s.upgrades[key]} / 5</small></div><button class="buy" data-upgrade="${key}" ${s.money < cost || s.upgrades[key] >= 5 ? "disabled" : ""}>${s.upgrades[key] >= 5 ? tr("Full") : fmt(cost) + " $"}</button></div>`;
      }
      html += `<div class="payroll-summary"><span>${tr("Staff wages")}<strong>${fmt(payrollPerMinute(s))} $ / ${tr("min")}</strong></span><span>${tr("Unpaid wages")}<strong>${fmt(s.payrollDebt)} $</strong></span></div><p class="dialog-intro">${tr("Wages are paid automatically. Unpaid wages are deducted from future income.")}</p><div class="info-box">${icon("team")}<p>${t("Pokladní, kuchař, uklízeč a číšník se přidají při rozšiřování podniku. Každý převezme část tvé práce.", "Cashier, cook, cleaner and runner join through expansions. Each takes over part of your work.")}</p></div>`;
    } else if (modal === "tasks") {
      title = t("Malé cíle, velká radost", "Little goals, big rewards");
      const values = [s.daily.served, s.daily.earned, s.daily.cleaned],
        goals = [20, 500, 8],
        rewards = [100, 180, 120],
        names = [
          t("Obsluž 20 hostů", "Serve 20 guests"),
          t("Vydělej 500 $", "Earn $500"),
          t("Ukliď 8 stolů", "Clean 8 tables"),
        ];
      html = `<p class="dialog-intro">${t("Tři čerstvé úkoly každý den. Bez ztráty série a bez spěchu.", "Three fresh goals each day. No streaks to lose, no rush.")}</p>`;
      names.forEach(
        (name, i) =>
          (html += `<div class="task-card"><div><strong>${name}</strong><span>${Math.min(values[i], goals[i])} / ${goals[i]}</span></div><progress value="${values[i]}" max="${goals[i]}"></progress><button class="buy" data-claim="${i}" ${values[i] < goals[i] || s.daily.claimed[i] ? "disabled" : ""}>${s.daily.claimed[i] ? t("Vyzvednuto", "Claimed") : t("Vyzvednout", "Claim") + " " + rewards[i] + " $"}</button></div>`),
      );
    } else if (modal === "menu") {
      title = t("Z kuchyně s láskou", "Made with love");
      html = `<p class="dialog-intro">${t("Vyber dnešní specialitu. Celá kuchyně připravuje jedno menu.", "Choose today’s special. Your entire kitchen serves one menu.")}</p><div class="recipe-grid">`;
      d.recipes.forEach(
        (r, i) =>
          (html += `<button class="recipe ${s.recipe === i ? "selected" : ""}" data-recipe="${i}" ${!hasExpansion(s, d.recipeLevels[i]) ? "disabled" : ""}><img src="./icon.svg" alt=""><strong>${localize(r, lang)}</strong><small>${!hasExpansion(s, d.recipeLevels[i]) ? t("Rozšíření", "Expansion") + " " + d.recipeLevels[i] : s.recipe === i ? t("Dnešní menu", "Today’s menu") : "+" + i * 25 + " %"}</small></button>`),
      );
      html += `</div><h3>${t("Tvoje zástěra", "Your apron")}</h3><div class="skins">`;
      ["#ef693c", "#668fa5", "#b58b44"].forEach(
        (color, i) =>
          (html += `<button style="--swatch:${i === 0 ? d.accent : color}" class="skin ${s.skin === i ? "selected" : ""}" data-skin="${i}" aria-label="${t("Zástěra", "Apron")} ${i + 1}">${icon("chef", 32)}</button>`),
      );
      html += "</div>";
    } else if (modal === "settings") {
      title = t("Udělej si pohodlí", "Make yourself comfortable");
      html = `<label class="setting-row">${t("Jazyk", "Language")}<select id="language"><option value="auto" ${choice === "auto" ? "selected" : ""}>${tr("Automatic (device)")}</option>${locales.map((locale) => `<option value="${locale.code}" ${choice === locale.code ? "selected" : ""}>${locale.name}</option>`).join("")}</select></label><label class="setting-row">${t("Zvuky", "Sound")}<input type="checkbox" id="sound-setting" ${sound ? "checked" : ""}></label><label class="setting-row">${t("Omezit efekty", "Reduce effects")}<input type="checkbox" id="motion-setting" ${reduced ? "checked" : ""}></label><label class="setting-row">${t("Úsporná grafika", "Battery-friendly graphics")}<input type="checkbox" id="quality-setting"></label><div class="settings-buttons"><button class="secondary" data-action="export">${t("Stáhnout zálohu", "Export save")}</button><button class="secondary" data-action="import">${t("Obnovit zálohu", "Import save")}</button></div><p class="dialog-intro">${t("Postup zůstává v tomto prohlížeči. Pro přenos do jiného zařízení použij zálohu. Offline příjem funguje po plné automatizaci; limit je", "Progress stays in this browser. Export a save to transfer it. Offline income starts with full automation; the cap is")} ${new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(2 + s.upgrades.offline * 1.2)} h.</p><button class="danger" data-action="reset-confirm">${t("Začít nový podnik", "Start a new restaurant")}</button>`;
    } else if (modal === "reset-confirm") {
      title = t("Opravdu začít znovu?", "Start over?");
      html = `<p>${t("Smaže se postup pouze v této hře. Nejdříve si můžeš stáhnout zálohu.", "This resets only this game. You can export a backup first.")}</p><div class="settings-buttons"><button class="secondary" data-action="export">${t("Stáhnout zálohu", "Export save")}</button><button class="danger" data-action="reset">${t("Smazat a začít", "Reset and start")}</button></div>`;
    } else if (modal === "complete") {
      title = t("Podnik snů je tvůj!", "Your dream came true!");
      html = `<div class="celebration">${icon("trophy", 80)}</div><p class="dialog-intro">${tr("Next stop: a new branch.")} ${tr("New branches start from zero.")}</p><div class="stats"><div><strong>${fmt(s.served)}</strong><span>${t("Hosté", "Guests")}</span></div><div><strong>${fmt(s.earned)} $</strong><span>${t("Tržby", "Revenue")}</span></div></div><button class="primary" data-action="empire">${tr("Build your empire")}</button><button class="secondary" data-action="close">${t("Pokračovat v hraní", "Keep playing")}</button>`;
    } else {
      title = t("Tvoje restaurace, tvoje tempo", "Your restaurant, your pace");
      html = `<div class="help-steps"><p><b>1</b>${t("Pohybuj se WASD, šipkami nebo táhnutím po herní ploše. Kliknutí na štítek stanice tě k ní dovede.", "Move with WASD, arrow keys or by dragging the world. Tap a station label to walk there.")}</p><p><b>2</b>${d.id === "burger" ? tr("Stand at a station to load or unload. Burgers and fries share tray space.") : t("Stůj u stanice: jídlo se automaticky naloží nebo vyloží. Na tácu nosíš vždy jeden druh.", "Stand at a station to pick up or drop off food. Carry one type at a time.")}</p><p><b>3</b>${t("Doplň výdej, obsluž pokladnu a za tržby rozšiřuj podnik. Odpadky patří do koše.", "Stock the counter, take payments, expand with your earnings. Take rubbish to the bin.")}</p><p><b>4</b>${t("Zaměstnanci postupně převezmou práci. Na zelené ploše se další rozšíření splácí automaticky.", "Staff gradually take over. Stand on the green pad to fund your next expansion.")}</p></div><button class="primary" data-action="close">${t("Jdeme vařit", "Let’s cook")}</button>`;
    }
    get("dialog-title").textContent = title;
    get("dialog-content").innerHTML = html;
  }
  root.addEventListener("click", (e) => {
    const el =
      e.target instanceof Element
        ? e.target.closest<HTMLButtonElement>("button")
        : null;
    if (!el || el.disabled) return;
    if (el.dataset.travel !== undefined) {
      actions.travel(Number(el.dataset.travel));
      return;
    }
    if (el.dataset.upgrade) {
      const id = el.dataset.upgrade;
      if (
        [
          "speed",
          "capacity",
          "income",
          "production",
          "staff",
          "offline",
        ].includes(id)
      ) {
        actions.command({
          type: "upgrade",
          id: id as keyof GameState["upgrades"],
        });
        renderModal();
      }
      return;
    }
    for (const type of ["recipe", "skin", "claim"] as const)
      if (el.dataset[type] !== undefined) {
        actions.command({ type, index: Number(el.dataset[type]) });
        renderModal();
        return;
      }
    const action = el.dataset.action;
    if (action === "close") close();
    else if (action === "sound") {
      sound = !sound;
      actions.sound(sound);
      el.innerHTML = icon(sound ? "sound" : "mute");
      el.setAttribute(
        "aria-label",
        sound ? t("Vypnout zvuk", "Mute") : t("Zapnout zvuk", "Unmute"),
      );
    } else if (action === "pause") {
      paused = !paused;
      actions.pause(paused);
      root.querySelector<HTMLElement>(".pause-screen")!.hidden = !paused;
    } else if (action === "overview") {
      const enabled = actions.overview();
      el.setAttribute("aria-pressed", String(enabled));
      root
        .querySelector(".stage")!
        .classList.toggle("overview-active", enabled);
    } else if (action === "goal") {
      const nextGoal = goal(state, d);
      if (nextGoal.id === "unlock") root.classList.add("sheet-open");
      else actions.move(nextGoal.position);
    } else if (action === "unlock") {
      const before = state.level;
      actions.command({ type: "unlock", index: Number(el.dataset.expansion) });
      if (state.level > before)
        toast(t("Nové rozšíření je tvoje!", "Your expansion is ready!"));
    } else if (action === "sheet") root.classList.toggle("sheet-open");
    else if (action === "export") actions.export();
    else if (action === "import") get("import-file").click();
    else if (action === "reset") {
      close();
      actions.reset();
    } else if (action) open(action);
  });
  dialog.addEventListener("cancel", (e) => {
    e.preventDefault();
    close();
  });
  root.addEventListener("change", (e) => {
    const el = e.target;
    if (el instanceof HTMLSelectElement && el.id === "language") {
      choice = isLocale(el.value) ? el.value : "auto";
      try {
        localStorage.setItem(preferenceKey, choice);
      } catch {
        /* Manual language still works for this session. */
      }
      applyLanguage();
    }
    if (el instanceof HTMLInputElement) {
      if (el.id === "sound-setting") {
        sound = el.checked;
        actions.sound(sound);
        root.querySelector('[data-action="sound"]')!.innerHTML = icon(
          sound ? "sound" : "mute",
        );
        translateStatic();
      }
      if (el.id === "motion-setting") reduced = el.checked;
      if (el.id === "quality-setting") actions.quality(!el.checked);
      if (el.id === "import-file" && el.files?.[0]) {
        actions.import(el.files[0]);
        el.value = "";
      }
    }
  });
  function saveStatus(ok: boolean) {
    lastSaveStatus = ok;
    get("save-status").textContent = tr(
      ok ? "Saved on this device" : "Saving unavailable — export a backup",
    );
  }
  function translateStatic() {
    document.title = `${d.title} · ${localize(d.subtitle, lang)}`;
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", localize(d.subtitle, lang));
    root.querySelector(".brand span")!.textContent = localize(d.subtitle, lang);
    const labels: Record<string, string> = {
      '[data-action="sound"]': sound ? "Mute" : "Unmute",
      '.top-actions [data-action="pause"]': "Pause",
      '[data-action="settings"]': "Settings",
      ".stage": "Game world",
      "#world": "Move with WASD or arrow keys",
      '[data-action="goal"]': "Walk to goal",
      '[data-action="overview"]': "Map overview",
      '[data-action="help"]': "How to play",
      '[data-action="close"]': "Close",
      ".sheet-close": "Close",
    };
    for (const [selector, key] of Object.entries(labels))
      root.querySelector(selector)?.setAttribute("aria-label", tr(key));
    const texts: Record<string, string> = {
      ".control-hint span": "Drag to move · tap a station",
      ".pause-screen h2": "Rest a little",
      ".pause-screen p": "Your restaurant can wait.",
      ".pause-screen button": "Continue",
      '[data-mobile="grow"]': "Expand",
      '[data-mobile="upgrades"]': "Upgrades",
      '[data-mobile="tasks"]': "Daily goals",
      '[data-mobile="menu"]': "Menu",
      '[data-mobile="empire"]': "Empire",
      "#empire-label": "Leave restaurant",
    };
    for (const [selector, key] of Object.entries(texts))
      root.querySelector(selector)!.textContent = tr(key);
    if (lastSaveStatus !== undefined) saveStatus(lastSaveStatus);
    else get("save-status").textContent = tr("Automatic save");
  }
  function applyLanguage() {
    lang = resolveLocale(choice, navigator.languages);
    formatter = new Intl.NumberFormat(lang, { maximumFractionDigits: 0 });
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    translateStatic();
    if (modal) renderModal();
  }
  window.addEventListener("languagechange", () => {
    if (choice === "auto") applyLanguage();
  });
  translateStatic();
  let previousLevel = 0;
  let secondMarkup = "";
  const completedStates = new WeakSet<GameState>();
  function update(s: GameState, worldLabels: WorldLabel[]) {
    if (state !== s) previousLevel = 0;
    state = s;
    get("money").textContent = fmt(s.money);
    get("budget-label").textContent = tr("Available funds");
    const choices = expansionChoices(s, d.unlocks.length);
    root
      .querySelector(".sidebar")!
      .classList.toggle("has-choices", choices.length > 1);
    const next = d.unlocks[(choices[0] ?? 0) - 1];
    const paid = expansionPaid(s, choices[0]);
    const g = goal(s, d);
    get("mission-text").textContent = localize(g.text, lang);
    get("mission-label").textContent = t("Tvůj další krok", "Your next move");
    get("chapter").textContent = String(
      Math.min(s.level + 1, d.unlocks.length),
    ).padStart(2, "0");
    get("progress").style.width = `${(s.level / d.unlocks.length) * 100}%`;
    get("next-name").textContent =
      (next ? localize(next.name, lang) : undefined) ??
      t("Podnik dokončen", "Restaurant complete");
    get("next-desc").textContent =
      (next ? localize(next.description, lang) : undefined) ??
      t(
        "Tvá restaurace žije vlastním životem.",
        "Your restaurant has a life of its own.",
      );
    const art = get("next-art");
    if (art.dataset.level !== String(choices[0])) {
      art.innerHTML = icon(next?.icon ?? "trophy", 64);
      art.dataset.level = String(choices[0]);
    }
    get("next-cost").textContent = next
      ? fmt(next.cost - paid) + " $"
      : t("Hotovo", "Complete");
    get("funding-text").textContent =
      next && paid
        ? t("Zaplaceno", "Funded") + " " + fmt(paid) + " $"
        : t("Investice do podniku", "Invest in your dream");
    get("funding-bar").style.width = next
      ? `${Math.min(100, ((paid + s.money) / next.cost) * 100)}%`
      : "100%";
    const unlock = get("unlock-button") as HTMLButtonElement;
    unlock.dataset.expansion = String(choices[0] ?? "");
    unlock.disabled = !next || s.money < 1;
    unlock.innerHTML =
      icon("star", 18) +
      " " +
      (next
        ? s.money >= next.cost - paid
          ? t("Odemknout", "Unlock")
          : t("Přispět na rozšíření", "Fund expansion")
        : t("Splněný sen", "Dream achieved"));
    const secondId = choices[1],
      second = d.unlocks[(secondId ?? 0) - 1];
    const secondPaid = expansionPaid(s, secondId);
    let secondHtml = second
      ? `<div class="next-card alternate-expansion"><div class="next-art">${icon(second.icon, 40)}</div><h2>${localize(second.name, lang)}</h2><p>${localize(second.description, lang)}</p><div class="funding"><span>${tr("Funded")} ${fmt(secondPaid)} $</span><strong>${fmt(second.cost - secondPaid)} $</strong></div><div class="funding-track"><i style="width:${Math.min(100, (secondPaid / second.cost) * 100)}%"></i></div><button class="primary" data-action="unlock" data-expansion="${secondId}" ${s.money < 1 ? "disabled" : ""}>${icon("star", 18)} ${tr(s.money >= second.cost - secondPaid ? "Unlock" : "Fund expansion")}</button></div>`
      : "";
    const fallbackNames: Record<keyof GameState["upgrades"], string> = {
      speed: "Quick feet",
      capacity: "Bigger tray",
      income: "Better margins",
      production: "Fast kitchen",
      staff: "Experienced team",
      offline: "More offline hours",
    };
    const fallback =
      choices.length === 1
        ? (Object.keys(fallbackNames) as (keyof GameState["upgrades"])[]).find(
            (key) => s.upgrades[key] < 5,
          )
        : undefined;
    if (fallback) {
      const cost = upgradeCost(s, fallback);
      const effect = {
        speed: "+14%",
        capacity: "+3",
        income: "+20%",
        production: "+20%",
        staff: "+15%",
        offline: `+72 ${tr("min")}`,
      }[fallback];
      secondHtml = `<div class="next-card alternate-upgrade"><span class="eyebrow">${tr("Upgrades")}</span><div class="next-art">${icon("spark", 40)}</div><h2>${tr(fallbackNames[fallback])}</h2><p>${effect} · ${tr("Level")} ${s.upgrades[fallback]} → ${s.upgrades[fallback] + 1}</p><div class="funding"><span>${tr("Invest in your dream")}</span><strong>${fmt(cost)} $</strong></div><button class="primary" data-upgrade="${fallback}" ${s.money < cost ? "disabled" : ""}>${tr("Unlock")} · ${fmt(cost)} $</button></div>`;
    }
    root
      .querySelector(".sidebar")!
      .classList.toggle("has-choices", choices.length > 1 || !!fallback);
    const secondRoot = get("second-expansion");
    if (secondMarkup !== secondHtml) {
      secondRoot.innerHTML = secondHtml;
      secondMarkup = secondHtml;
    }
    get("served").textContent = fmt(s.served);
    get("price").textContent = fmt(price(s, d)) + " $";
    get("staff-count").textContent = fmt(s.workers.length);
    get("carry-count").textContent =
      `${fmt(s.player.count)} / ${fmt(capacity(s))}`;
    get("carry-item").textContent = s.player.item
      ? {
          raw: d.id === "pizza" ? t("Těsto", "Dough") : t("Placky", "Patties"),
          prep: t("Připravené pizzy", "Prepared pizzas"),
          meal:
            d.id === "pizza"
              ? lang === "cs" || lang === "en"
                ? "Pizza"
                : localize(d.recipes[s.recipe], lang)
              : t("Burgery", "Burgers"),
          trash: t("Odpadky", "Trash"),
          fries: tr("Fries"),
        }[s.player.item]
      : t("Prázdný tác", "Empty tray");
    if (s.player.item === "meal" && s.player.fries > 0) {
      get("carry-item").textContent =
        `${tr("Burgers")} ${fmt(s.player.count - s.player.fries)} · ${tr("Fries")} ${fmt(s.player.fries)}`;
    }
    const slots = root.querySelector<HTMLElement>(".carry-slots")!;
    slots.innerHTML = Array.from(
      { length: Math.min(10, capacity(s)) },
      (_, i) => `<i class="${i < s.player.count ? "filled" : ""}"></i>`,
    ).join("");
    for (const label of worldLabels) {
      const el = labels.get(label.id)!;
      el.style.transform = `translate(${label.screen.x}px,${label.screen.y}px) translate(-50%,-50%)`;
      el.hidden = !label.visible || (label.id === "unlock" && !next);
      el.classList.toggle("target", label.id === g.id);
      const st = d.stations.find((x) => x.id === label.id),
        stState = s.stations.find((x) => x.id === label.id);
      el.innerHTML = st
        ? `<span>${localize(st.label, lang)}</span><b>${fmt(stState!.output)}</b>${d.id === "burger" && hasExpansion(s, 3) && st.kind === "counter" ? `<small>${tr("Fries")} ${fmt(stState!.fries)}</small>` : ""}${st.id === "fryer" ? `<small>${tr("Fries")} +${fmt(friesPrice(s))} $</small>` : ""}`
        : label.id === "register"
          ? `${icon("coin", 14)} ${t("Pokladna", "Register")}`
          : label.id === "trash"
            ? t("Koš", "Bin")
            : icon("star", 14) +
              " " +
              (next ? fmt(next.cost - paid) + " $" : "");
    }
    const translations: Record<string, string> = {
      "chapter-label": `${tr("Branch")} ${actions.empire().active + 1}`,
      "next-label": t("Další velká věc", "The next big thing"),
      "numbers-title": t("Dnes v restauraci", "Restaurant journal"),
      "served-label": t("Hosté", "Guests"),
      "price-label": t("Za porci", "Per meal"),
      "staff-label": t("Tým", "Team"),
      "upgrades-label": t("Vylepšení & tým", "Upgrades & team"),
      "tasks-label": t("Denní úkoly", "Daily goals"),
      "menu-label": t("Recepty & styl", "Recipes & style"),
    };
    for (const [id, text] of Object.entries(translations))
      get(id).textContent = text;
    root.querySelector("[data-open]")!.textContent = t(
      "Otevřeno",
      "Open for business",
    );
    if (
      s.level === d.unlocks.length &&
      previousLevel < d.unlocks.length &&
      !completedStates.has(s)
    ) {
      completedStates.add(s);
      open("complete");
    }
    previousLevel = s.level;
  }
  return {
    enter(s: GameState) {
      state = s;
      previousLevel = s.level;
      if (s.level === d.unlocks.length) completedStates.add(s);
    },
    update,
    toast,
    open,
    close,
    get lang() {
      return lang;
    },
    get reduced() {
      return reduced;
    },
    get modalOpen() {
      return dialog.open;
    },
    saveStatus,
    translate: tr,
    format: fmt,
  };
}
