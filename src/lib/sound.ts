"use client";

import { getSettings } from "@/lib/settings";

/**
 * Discreet synthesized sounds (Web Audio, no audio files, no autoplay: the
 * AudioContext is only created after a user gesture triggers a sound).
 */
export type SoundName = "correct" | "wrong" | "reveal" | "next" | "complete";

let ctx: AudioContext | null = null;

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!ctx) {
      const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      ctx = new Ctor();
    }
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function tone(c: AudioContext, freq: number, start: number, dur: number, gain = 0.05, type: OscillatorType = "sine") {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, c.currentTime + start);
  g.gain.exponentialRampToValueAtTime(gain, c.currentTime + start + 0.015);
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + start + dur);
  osc.connect(g).connect(c.destination);
  osc.start(c.currentTime + start);
  osc.stop(c.currentTime + start + dur + 0.05);
}

export function playSound(name: SoundName) {
  if (!getSettings().sound) return;
  const c = context();
  if (!c) return;
  switch (name) {
    case "correct":
      tone(c, 659.25, 0, 0.35);
      tone(c, 880, 0.09, 0.45);
      break;
    case "wrong":
      tone(c, 220, 0, 0.35, 0.045, "triangle");
      tone(c, 185, 0.1, 0.4, 0.04, "triangle");
      break;
    case "reveal":
      tone(c, 523.25, 0, 0.18, 0.03);
      break;
    case "next":
      tone(c, 392, 0, 0.1, 0.02);
      break;
    case "complete":
      [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => tone(c, f, i * 0.12, 0.6, 0.05));
      break;
  }
}
