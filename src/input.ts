export class InputState {
  keys = new Set<string>();
  pointer: number | null = null;
  origin = { x: 0, y: 0 };
  stick = { x: 0, y: 0 };
  read() {
    let x =
      this.stick.x +
      (Number(this.keys.has("KeyD") || this.keys.has("ArrowRight")) -
        Number(this.keys.has("KeyA") || this.keys.has("ArrowLeft")));
    let y =
      this.stick.y +
      (Number(this.keys.has("KeyS") || this.keys.has("ArrowDown")) -
        Number(this.keys.has("KeyW") || this.keys.has("ArrowUp")));
    const length = Math.max(1, Math.hypot(x, y));
    x /= length;
    y /= length;
    // Screen directions are rotated into the fixed isometric camera's world axes.
    const angle = Math.atan2(14, 22),
      cos = Math.cos(angle),
      sin = Math.sin(angle);
    return { x: x * cos + y * sin, z: -x * sin + y * cos };
  }
  reset() {
    this.keys.clear();
    this.pointer = null;
    this.stick = { x: 0, y: 0 };
  }
  begin(id: number, x: number, y: number) {
    if (this.pointer !== null) return false;
    this.pointer = id;
    this.origin = { x, y };
    this.stick = { x: 0, y: 0 };
    return true;
  }
  drag(id: number, x: number, y: number) {
    if (id !== this.pointer) return;
    const dx = (x - this.origin.x) / 48,
      dy = (y - this.origin.y) / 48,
      l = Math.max(1, Math.hypot(dx, dy));
    this.stick = { x: dx / l, y: dy / l };
  }
  end(id: number) {
    if (id === this.pointer) {
      this.pointer = null;
      this.stick = { x: 0, y: 0 };
    }
  }
}
export function createInput(surface: HTMLElement, joystick: HTMLElement) {
  const state = new InputState(),
    abort = new AbortController(),
    options = { signal: abort.signal };
  const knob = joystick.querySelector<HTMLElement>("span")!;
  const reset = () => {
    state.reset();
    joystick.classList.remove("active");
  };
  window.addEventListener(
    "keydown",
    (e) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.closest("input,select,textarea,[contenteditable=true],dialog")
      )
        return;
      if (
        [
          "KeyW",
          "KeyA",
          "KeyS",
          "KeyD",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
        ].includes(e.code)
      ) {
        e.preventDefault();
        state.keys.add(e.code);
      }
    },
    options,
  );
  window.addEventListener("keyup", (e) => state.keys.delete(e.code), options);
  window.addEventListener("blur", reset, options);
  document.addEventListener("visibilitychange", reset, options);
  surface.addEventListener(
    "pointerdown",
    (e) => {
      if (
        e.target !== surface &&
        e.target instanceof Element &&
        e.target.closest("button")
      )
        return;
      if (!state.begin(e.pointerId, e.clientX, e.clientY)) return;
      surface.setPointerCapture(e.pointerId);
      const r = surface.getBoundingClientRect();
      joystick.style.left = `${e.clientX - r.left}px`;
      joystick.style.top = `${e.clientY - r.top}px`;
      joystick.classList.add("active");
    },
    options,
  );
  surface.addEventListener(
    "pointermove",
    (e) => {
      state.drag(e.pointerId, e.clientX, e.clientY);
      knob.style.transform = `translate(${state.stick.x * 36}px,${state.stick.y * 36}px)`;
    },
    options,
  );
  for (const name of ["pointerup", "pointercancel", "lostpointercapture"])
    surface.addEventListener(
      name,
      (e) => {
        if (e instanceof PointerEvent) {
          state.end(e.pointerId);
          if (state.pointer === null) joystick.classList.remove("active");
        }
      },
      options,
    );
  return {
    read: () => state.read(),
    reset,
    dispose() {
      abort.abort();
      reset();
    },
  };
}
