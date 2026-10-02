import "./styles.css";
import type { GameDefinition, GameEvent, Vec } from "./game/types";
import { createGame, step, command, refreshDay } from "./game/simulation";
import { route, distance } from "./game/navigation";
import { createScene } from "./render/scene";
import { createAudio } from "./render/audio";
import { createInput } from "./input";
import { createHud } from "./ui/hud";
import { goal } from "./ui/goal";
import {
  createCareer,
  activeBranch,
  encodeCareer,
  decodeCareer,
  careerView,
  travel,
  advanceCareer,
  accrueOffline,
} from "./career";

export function boot(d: GameDefinition) {
  const root = document.querySelector<HTMLElement>("#app");
  if (!root) return;
  document.documentElement.style.setProperty("--accent", d.accent);
  document.documentElement.style.setProperty("--dark", d.dark);
  document.documentElement.style.setProperty("--world", d.background);
  let state = createGame(d),
    paused = false,
    last = performance.now(),
    accumulator = 0,
    sinceSave = 0,
    offline = 0,
    storageIssue = false,
    protectOriginal = false,
    hiddenAt = 0,
    waypoints: Vec[] = [],
    destroyed = false;
  let career = createCareer(state);
  const key = `restaurant.${d.id}.v1`;
  const audio = createAudio();
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const loaded = decodeCareer(raw, d, Date.now());
      if (loaded.ok) {
        career = loaded.career;
        state = activeBranch(career);
        offline = loaded.offline;
      } else {
        storageIssue = true;
        protectOriginal = true;
      }
    }
  } catch {
    storageIssue = true;
    protectOriginal = true;
  }
  // An unreadable save may belong to a future version. Never overwrite it merely
  // because this version cannot read it; explicit import/reset lifts protection.
  function save() {
    if (protectOriginal) {
      hud.saveStatus(false);
      return;
    }
    try {
      localStorage.setItem(key, encodeCareer(career, hiddenAt || Date.now()));
      hud.saveStatus(true);
    } catch {
      hud.saveStatus(false);
    }
  }
  const hud = createHud(root, d, {
    command(action) {
      const previous = state.level;
      if (command(state, d, action)) {
        save();
        audio.play([
          {
            type: state.level > previous ? "unlock" : "pickup",
            x: 0,
            z: 0,
            amount: 1,
          },
        ]);
      }
    },
    move(target) {
      waypoints = route(state.player, target, d, state).slice();
      input.reset();
    },
    pause(value) {
      paused = value;
      input.reset();
      waypoints = [];
      last = performance.now();
      accumulator = 0;
    },
    sound: (value) => audio.setEnabled(value),
    quality: (value) => scene.setQuality(value),
    overview: () => scene.toggleOverview(),
    empire: () => careerView(career, d),
    travel(index) {
      if (!travel(career, d, index)) return;
      state = activeBranch(career);
      refreshDay(state, Date.now());
      hud.enter(state);
      waypoints = [];
      input.reset();
      scene.dispose();
      scene = createScene(canvas, d);
      root.querySelector(".stage")?.classList.remove("overview-active");
      root
        .querySelector('[data-action="overview"]')
        ?.setAttribute("aria-pressed", "false");
      save();
      hud.close();
    },
    export() {
      const blob = new Blob([encodeCareer(career, Date.now())], {
          type: "application/json",
        }),
        url = URL.createObjectURL(blob),
        a = document.createElement("a");
      a.href = url;
      a.download = `${d.id}-save.json`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    async import(file) {
      try {
        if (file.size > 2000000) {
          hud.toast(hud.translate("Save file is too large."));
          return;
        }
        const loaded = decodeCareer(await file.text(), d, Date.now());
        if (!loaded.ok) {
          hud.toast(hud.translate("Invalid save or a different game."));
          return;
        }
        career = loaded.career;
        state = activeBranch(career);
        protectOriginal = false;
        waypoints = [];
        save();
        hud.close();
        hud.toast(hud.translate("Progress restored."));
      } catch {
        hud.toast(hud.translate("Could not read the file."));
      }
    },
    reset() {
      state = createGame(d);
      career = createCareer(state);
      protectOriginal = false;
      waypoints = [];
      save();
      location.reload();
    },
  });
  const canvas = root.querySelector<HTMLCanvasElement>("#world")!;
  const input = createInput(
    root.querySelector<HTMLElement>(".stage")!,
    root.querySelector<HTMLElement>(".joystick")!,
  );
  let scene: ReturnType<typeof createScene>;
  try {
    scene = createScene(canvas, d);
  } catch (error) {
    root.innerHTML = `<div class="fatal"><h1>${hud.translate("Graphics could not start")}</h1><p>${hud.translate("This game needs WebGL 2. Enable hardware acceleration or use a compatible browser.")}</p><button class="primary" onclick="location.reload()">${hud.translate("Try again")}</button></div>`;
    console.error(error);
    input.dispose();
    return;
  }
  const initialGoal = goal(state, d);
  scene.render(state, [], 0, initialGoal.position, hud.lang, hud.reduced);
  hud.update(state, scene.labels);
  save();
  if (offline > 0)
    hud.toast(
      `${hud.translate("Welcome back! Your restaurant earned")} ${hud.format(offline)} $.`,
    );
  else if (storageIssue)
    hud.toast(
      hud.translate("Could not load your save. Restore a backup in settings."),
    );
  function frame(now: number) {
    if (destroyed) return;
    const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
    last = now;
    const events: GameEvent[] = [];
    if (!paused && !document.hidden) {
      accumulator += dt;
      let movement = input.read();
      if (Math.hypot(movement.x, movement.z) > 0.05) waypoints = [];
      while (accumulator >= 1 / 30) {
        if (waypoints.length) {
          while (
            waypoints.length &&
            distance(state.player, waypoints[0]) < 0.05
          )
            waypoints.shift();
          const p = waypoints[0];
          movement = { x: 0, z: 0 };
          if (p) {
            const dist = distance(state.player, p);
            const amount = Math.min(
              1,
              dist / ((d.speed * (1 + state.upgrades.speed * 0.14)) / 30),
            );
            movement = {
              x: ((p.x - state.player.x) / dist) * amount,
              z: ((p.z - state.player.z) / dist) * amount,
            };
          }
        }
        events.push(...step(state, d, movement, 1 / 30));
        advanceCareer(career, d, 1 / 30);
        accumulator -= 1 / 30;
      }
      sinceSave += dt;
      if (sinceSave >= 10) {
        refreshDay(state, Date.now());
        save();
        sinceSave = 0;
      }
    }
    scene.render(
      state,
      events,
      dt,
      goal(state, d).position,
      hud.lang,
      hud.reduced,
    );
    hud.update(state, scene.labels);
    audio.play(events);
    if (
      events.some((e) => e.type === "unlock") &&
      !hud.reduced &&
      navigator.vibrate
    )
      navigator.vibrate(30);
    requestAnimationFrame(frame);
  }
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      hiddenAt = Date.now();
      save();
    } else if (hiddenAt) {
      const award = accrueOffline(
        career,
        d,
        Math.max(0, (Date.now() - hiddenAt) / 1000),
      );
      hiddenAt = 0;
      refreshDay(state, Date.now());
      save();
      if (award > 0)
        hud.toast(
          `+ ${hud.format(award)} $ · ${hud.translate("Offline income")}`,
        );
    }
    input.reset();
    waypoints = [];
    last = performance.now();
    accumulator = 0;
  });
  window.addEventListener("pagehide", save);
  window.addEventListener("blur", () => {
    input.reset();
    waypoints = [];
    accumulator = 0;
  });
  window.addEventListener("beforeunload", () => {
    save();
    destroyed = true;
    input.dispose();
    scene.dispose();
    audio.dispose();
  });
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    paused = true;
    save();
    hud.toast(
      hud.translate(
        "Graphics interrupted. Reload the page; progress is saved.",
      ),
    );
  });
  if (import.meta.env.PROD && "serviceWorker" in navigator)
    void navigator.serviceWorker
      .register("./sw.js")
      .catch(() =>
        hud.toast(
          hud.translate("Offline mode unavailable. You can still play online."),
        ),
      );
  requestAnimationFrame(frame);
}
