#!/usr/bin/env node
/**
 * Phase 4 image build. From the cached 2600px working copies (scripts/images-fetch.mjs) produce, per artwork:
 *   public/art/<id>/480.webp  960.webp  1280.webp   (long-edge sizes; thumbnails / responsive / large)
 *   public/art/<id>/detail.webp                      (real crop of the original at the stored rect, 720px wide)
 * and a manifest (scripts/.cache/images-manifest.json) with exact pixel sizes and byte sizes that
 * curate.mjs merges into the artwork data (used for srcset, storage estimates and the offline package).
 * Source/licence metadata is untouched: it lives in the artwork record, not in the files.
 *
 * Format: WebP (universal in current browsers). AVIF was evaluated and rejected: ~15-20% smaller but slow
 * to encode and still unsupported on older Safari, where there would be no fallback in a static export.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const art = JSON.parse(fs.readFileSync(path.join(root, "src", "data", "artworks.json"), "utf8"));
const work = path.join(root, "scripts", ".cache", "work");
const outRoot = path.join(root, "public", "art");
const source = JSON.parse(fs.readFileSync(path.join(root, "scripts", ".cache", "source-images.json"), "utf8"));
const LONG = [480, 960, 1280];
const QUALITY = { 480: 78, 960: 80, 1280: 82 };

const manifestFile = path.join(root, "scripts", ".cache", "images-manifest.json");
const previous = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, "utf8")) : {};
const manifest = {};
let n = 0;
for (const a of art) {
  const file = path.join(work, a.id + ".jpg");
  const dir = path.join(outRoot, a.id);
  // unchanged since the last build (same crop rectangle, every file present) → reuse instead of re-encoding
  const sig = JSON.stringify(a.detail && a.detail.status !== "rejected" ? a.detail.rect : null);
  const prev = previous[a.id];
  if (prev && prev.sig === sig && LONG.every((l) => fs.existsSync(path.join(dir, `${l}.webp`))) && (sig === "null" || fs.existsSync(path.join(dir, "detail.webp")))) {
    manifest[a.id] = prev;
    continue;
  }
  fs.mkdirSync(dir, { recursive: true });
  const meta = await sharp(file).metadata();
  const entry = { sig, source: { w: source[a.id]?.srcW ?? meta.width, h: source[a.id]?.srcH ?? meta.height, format: source[a.id]?.format ?? "jpeg", bytes: source[a.id]?.srcBytes ?? null }, variants: [], detail: null };
  for (const long of LONG) {
    const info = await sharp(file)
      .resize({ width: long, height: long, fit: "inside", withoutEnlargement: true })
      .webp({ quality: QUALITY[long], effort: 5 })
      .toFile(path.join(dir, `${long}.webp`));
    entry.variants.push({ long, w: info.width, h: info.height, bytes: info.size });
  }
  if (a.detail && a.detail.status !== "rejected") {
    const r = a.detail.rect;
    const left = Math.round(r.x * meta.width);
    const top = Math.round(r.y * meta.height);
    const width = Math.min(meta.width - left, Math.round(r.w * meta.width));
    const height = Math.min(meta.height - top, Math.round(r.h * meta.height));
    const info = await sharp(file).extract({ left, top, width, height }).resize({ width: 720, withoutEnlargement: true }).webp({ quality: 82, effort: 5 }).toFile(path.join(dir, "detail.webp"));
    entry.detail = { w: info.width, h: info.height, bytes: info.size, sourceCropPx: `${width}x${height}` };
  }
  manifest[a.id] = entry;
  if (++n % 40 === 0) console.log("images", n, "/", art.length);
}
fs.writeFileSync(path.join(root, "scripts", ".cache", "images-manifest.json"), JSON.stringify(manifest));
const total = Object.values(manifest).reduce((s, e) => s + e.variants.reduce((t, v) => t + v.bytes, 0) + (e.detail?.bytes ?? 0), 0);
const by = (long) => Object.values(manifest).reduce((s, e) => s + e.variants.find((v) => v.long === long).bytes, 0);
console.log("done:", art.length, "artworks; total MB", (total / 1e6).toFixed(1), "| 480:", (by(480) / 1e6).toFixed(1), "960:", (by(960) / 1e6).toFixed(1), "1280:", (by(1280) / 1e6).toFixed(1));
