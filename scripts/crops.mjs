#!/usr/bin/env node
/**
 * Phase 1.4 — regenerate detail-crop candidates for the artworks flagged during visual review.
 *   node scripts/crops.mjs candidates   -> scripts/.cache/crops-new/<id>.jpg + crops-new.json
 *   node scripts/crops.mjs accept <id,id,...|all>   -> record chosen rects in scripts/curation/crops.json
 *   node scripts/crops.mjs reject <id,...>          -> mark crops as unusable (mode disabled for that artwork)
 *
 * Better than the first heuristic: windows are scored on large-scale structure (variation between
 * sub-blocks), moderate edge density and centrality, and rejected when flat, near-black/near-white
 * or pure fine texture (hatching, canvas grain, blank paper/mount).
 * Rect coordinates are normalised to the 2600px working copy, which has the display image's aspect ratio.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const art = JSON.parse(fs.readFileSync(path.join(root, "src", "data", "artworks.json"), "utf8"));
const work = path.join(root, "scripts", ".cache", "work");
const newDir = path.join(root, "scripts", ".cache", "crops-new");
const curDir = path.join(root, "scripts", "curation");
fs.mkdirSync(newDir, { recursive: true });
fs.mkdirSync(curDir, { recursive: true });
const cropsFile = path.join(curDir, "crops.json");
const crops = fs.existsSync(cropsFile) ? JSON.parse(fs.readFileSync(cropsFile, "utf8")) : {};
const candFile = path.join(root, "scripts", ".cache", "crops-new.json");

// ids (without prefix) flagged "bad" or "weak" in the visual review of all 276 crops
const BAD = [107208, 108401, 108555, 112062, 114776, 123616, 124092, 129862, 134843, 135341, 135920, 135931, 138359, 144058, 146909, 147410, 147982, 151078, 155499, 156167, 162316, 294155, 518719, 519100, 97193];
const WEAK = [100489, 103366, 106785, 108544, 110060, 110597, 112900, 113026, 113948, 117908, 117915, 122183, 123965, 125895, 127235, 127537, 128067, 128808, 129219, 130133, 130360, 130625, 135214, 135336, 136942, 144216, 144967, 145010, 146146, 147018, 147449, 148774, 150115, 151839, 151840, 156646, 157331, 159988, 160078, 160289, 161273, 161695, 166522, 173167, 396848, 447789, 449527, 523229, 83453, 86517, 87286, 94676];
export const REDO = new Set([...BAD, ...WEAK].map((n) => "cma-" + n));

const FRAC = { easy: 0.42, intermediate: 0.32, expert: 0.24 };

async function analyse(file, frac, rank) {
  const { data, info } = await sharp(file).resize({ width: 480, height: 480, fit: "inside" }).greyscale().raw().toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  let ww = Math.round(W * frac);
  let wh = Math.round(ww * 0.75);
  if (wh > H * 0.8) {
    wh = Math.round(H * 0.8);
    ww = Math.round(wh / 0.75);
  }
  const S = W + 1;
  const I1 = new Float64Array(S * (H + 1));
  const I2 = new Float64Array(S * (H + 1));
  const IE = new Float64Array(S * (H + 1));
  for (let y = 0; y < H; y++) {
    let a = 0, b = 0, e = 0;
    for (let x = 0; x < W; x++) {
      const v = data[y * W + x];
      let g = 0;
      if (x > 0 && y > 0 && x < W - 1 && y < H - 1) g = Math.hypot(data[y * W + x + 1] - data[y * W + x - 1], data[(y + 1) * W + x] - data[(y - 1) * W + x]);
      a += v;
      b += v * v;
      e += g;
      const i = (y + 1) * S + x + 1;
      I1[i] = I1[i - S] + a;
      I2[i] = I2[i - S] + b;
      IE[i] = IE[i - S] + e;
    }
  }
  const sum = (A, x, y, w, h) => A[(y + h) * S + x + w] - A[y * S + x + w] - A[(y + h) * S + x] + A[y * S + x];
  const mx = Math.round(W * 0.07);
  const my = Math.round(H * 0.07);
  const step = Math.max(4, Math.round(W / 50));
  const cands = [];
  for (let y = my; y + wh <= H - my; y += step)
    for (let x = mx; x + ww <= W - mx; x += step) {
      const n = ww * wh;
      const mean = sum(I1, x, y, ww, wh) / n;
      const std = Math.sqrt(Math.max(0, sum(I2, x, y, ww, wh) / n - mean * mean));
      const E = sum(IE, x, y, ww, wh) / n;
      // large-scale structure: std of the means of a 4×3 grid of sub-blocks
      const bw = Math.floor(ww / 4);
      const bh = Math.floor(wh / 3);
      const means = [];
      for (let j = 0; j < 3; j++) for (let i = 0; i < 4; i++) means.push(sum(I1, x + i * bw, y + j * bh, bw, bh) / (bw * bh));
      const mm = means.reduce((s, v) => s + v, 0) / means.length;
      const low = Math.sqrt(means.reduce((s, v) => s + (v - mm) ** 2, 0) / means.length);
      const cx = (x + ww / 2) / W - 0.5;
      const cy = (y + wh / 2) / H - 0.5;
      cands.push({ x, y, mean, std, E, low, center: Math.exp(-(cx * cx + cy * cy) / 0.08) });
    }
  const sorted = (k) => cands.map((c) => c[k]).sort((a, b) => a - b);
  const p = (k, q) => sorted(k)[Math.min(cands.length - 1, Math.floor(q * cands.length))] || 1;
  const lowN = p("low", 0.95);
  const eHi = p("E", 0.9);
  const eN = p("E", 0.75);
  const ok = cands.filter((c) => c.std >= 20 && c.mean > 35 && c.mean < 238 && c.E <= eHi);
  const pool = ok.length ? ok : cands;
  for (const c of pool) c.score = 1.0 * Math.min(1, c.low / lowN) + 0.6 * Math.min(1, c.E / eN) + 0.5 * c.center;
  pool.sort((a, b) => b.score - a.score);
  // non-maximum suppression: pick distinct windows, then take the requested rank
  const picks = [];
  for (const c of pool) {
    if (picks.every((q) => Math.abs(q.x - c.x) > ww * 0.7 || Math.abs(q.y - c.y) > wh * 0.7)) picks.push(c);
    if (picks.length > rank) break;
  }
  const pick = picks[Math.min(rank, picks.length - 1)];
  return { x: pick.x / W, y: pick.y / H, w: ww / W, h: wh / H, score: +pick.score.toFixed(2) };
}

const cmd = process.argv[2];
if (cmd === "candidates") {
  const cand = {};
  for (const a of art) {
    if (!REDO.has(a.id) || !a.detail) continue;
    const mode = a.difficulty.detail;
    const rank = mode === "easy" ? 0 : mode === "intermediate" ? 1 : 2;
    const file = path.join(work, a.id + ".jpg");
    const rect = await analyse(file, FRAC[mode], rank);
    const meta = await sharp(file).metadata();
    const left = Math.round(rect.x * meta.width);
    const top = Math.round(rect.y * meta.height);
    const width = Math.min(meta.width - left, Math.round(rect.w * meta.width));
    const height = Math.min(meta.height - top, Math.round(rect.h * meta.height));
    await sharp(file).extract({ left, top, width, height }).resize({ width: 720, withoutEnlargement: true }).jpeg({ quality: 82 }).toFile(path.join(newDir, a.id + ".jpg"));
    cand[a.id] = { rect: { x: +rect.x.toFixed(4), y: +rect.y.toFixed(4), w: +rect.w.toFixed(4), h: +rect.h.toFixed(4) }, mode };
  }
  fs.writeFileSync(candFile, JSON.stringify(cand));
  console.log("candidates:", Object.keys(cand).length);
} else if (cmd === "accept" || cmd === "reject") {
  const cand = JSON.parse(fs.readFileSync(candFile, "utf8"));
  const arg = process.argv[3];
  const ids = arg === "all" ? Object.keys(cand) : arg.split(",").map((s) => (s.startsWith("cma-") ? s : "cma-" + s));
  for (const id of ids) {
    if (cmd === "accept") crops[id] = { rect: cand[id].rect, status: "reviewed" };
    else crops[id] = { rect: cand[id]?.rect ?? null, status: "rejected" };
  }
  fs.writeFileSync(cropsFile, JSON.stringify(crops, null, 1));
  console.log(cmd, ids.length);
}

if (cmd === "rescale") {
  // Keep each reviewed crop's centre, but resize its window to the artwork's (new) detail difficulty.
  const base = JSON.parse(fs.readFileSync(path.join(root, "scripts", ".cache", "artworks.base.json"), "utf8"));
  const oldLevel = Object.fromEntries(base.map((b) => [b.id, b.difficulty]));
  const OLD = { easy: 0.42, intermediate: 0.3, expert: 0.2 };
  let changed = 0;
  for (const a of art) {
    if (!a.detail || REDO.has(a.id) || crops[a.id]) continue;
    const mode = a.difficulty.detail;
    if (mode === oldLevel[a.id]) continue;
    const r = a.detail.rect;
    const k = FRAC[mode] / r.w; // scale factor
    const w = Math.min(0.92, r.w * k);
    const h = Math.min(0.92, r.h * k);
    const cx = r.x + r.w / 2;
    const cy = r.y + r.h / 2;
    const x = Math.min(1 - w, Math.max(0, cx - w / 2));
    const y = Math.min(1 - h, Math.max(0, cy - h / 2));
    crops[a.id] = { rect: { x: +x.toFixed(4), y: +y.toFixed(4), w: +w.toFixed(4), h: +h.toFixed(4) }, status: "reviewed" };
    changed++;
  }
  void OLD;
  fs.writeFileSync(cropsFile, JSON.stringify(crops, null, 1));
  console.log("rescaled", changed);
}
