import type { GameEvent } from "../game/types";
export function createAudio() {
  let ctx: AudioContext | null = null,
    enabled = false,
    last = 0,
    chain = 0;
  return {
    setEnabled(value: boolean) {
      enabled = value;
      if (value) {
        ctx ??= new AudioContext();
        void ctx.resume();
      }
    },
    play(events: GameEvent[]) {
      if (!enabled || !ctx || ctx.state !== "running" || !events.length) return;
      const now = ctx.currentTime;
      if (now - last < 0.075) return;
      chain = now - last < 0.5 ? Math.min(chain + 1, 10) : 0;
      last = now;
      const e = events[events.length - 1],
        osc = ctx.createOscillator(),
        gain = ctx.createGain();
      osc.type = e.type === "unlock" ? "triangle" : "sine";
      osc.frequency.setValueAtTime(
        (e.type === "sale" ? 880 : e.type === "unlock" ? 660 : 440) *
          1.03 ** chain,
        now,
      );
      osc.frequency.exponentialRampToValueAtTime(
        e.type === "unlock" ? 1320 : 600,
        now + 0.12,
      );
      gain.gain.setValueAtTime(0.045, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.18);
    },
    dispose() {
      void ctx?.close();
    },
  };
}
