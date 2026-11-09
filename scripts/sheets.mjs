// Contact sheets for visual review of detail crops.
// usage: node scripts/sheets.mjs [dir-with-crops] [out-prefix] [ids-file.json]
// Each tile shows the crop (left) and the full artwork thumbnail with the crop rectangle (right).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const art = JSON.parse(fs.readFileSync(path.join(root, "src", "data", "artworks.json"), "utf8"));
const outDir = path.join(root, "scripts", ".cache", "sheets");
fs.mkdirSync(outDir, { recursive: true });
const prefix = process.argv[3] ?? "crops";
const useNew = process.argv[2] === "new";
const cand = useNew ? JSON.parse(fs.readFileSync(path.join(root, "scripts", ".cache", "crops-new.json"), "utf8")) : null;
const only = process.argv[4] ? new Set(JSON.parse(fs.readFileSync(process.argv[4], "utf8"))) : null;
const list = art.filter((a) => a.detail && (!useNew || cand[a.id]) && (!only || only.has(a.id)));

const TILE_W = 380;
const TILE_H = 150;
const COLS = 4;
const ROWS = 5;
const per = COLS * ROWS;

for (let s = 0; s * per < list.length; s++) {
  const chunk = list.slice(s * per, (s + 1) * per);
  const comps = [];
  for (let i = 0; i < chunk.length; i++) {
    const a = chunk[i];
    const x = (i % COLS) * TILE_W;
    const y = Math.floor(i / COLS) * TILE_H;
    const cropPath = useNew ? path.join(root, "scripts", ".cache", "crops-new", a.id + ".jpg") : path.join(root, "public", a.detail.imageUrl);
    const crop = await sharp(cropPath).resize(200, 138, { fit: "cover" }).toBuffer();
    const thumbSrc = useNew ? path.join(root, "scripts", ".cache", "work", a.id + ".jpg") : path.join(root, "public", a.imageUrl);
    const thumb = await sharp(thumbSrc).resize(150, 138, { fit: "contain", background: "#eee" }).toBuffer();
    const meta = await sharp(thumb).metadata();
    comps.push({ input: crop, left: x + 4, top: y + 2 });
    comps.push({ input: thumb, left: x + 208, top: y + 2 });
    // crop rectangle on thumbnail (computed against the contained image box)
    const wm = useNew ? await sharp(thumbSrc).metadata() : null;
    const ratio = wm ? wm.width / wm.height : a.imageWidth / a.imageHeight;
    let bw = 150;
    let bh = 138;
    if (ratio > 150 / 138) bh = 150 / ratio;
    else bw = 138 * ratio;
    const ox = (150 - bw) / 2;
    const oy = (138 - bh) / 2;
    const r = useNew ? cand[a.id].rect : a.detail.rect;
    const svg = `<svg width="${TILE_W}" height="${TILE_H}" xmlns="http://www.w3.org/2000/svg"><rect x="${208 + ox + r.x * bw}" y="${2 + oy + r.y * bh}" width="${r.w * bw}" height="${r.h * bh}" fill="none" stroke="#e11" stroke-width="2"/><text x="4" y="${TILE_H - 3}" font-size="11" font-family="sans-serif" fill="#000">${a.id.slice(4)} ${a.difficulty[0]} ${a.title.slice(0, 40).replace(/[<&>]/g, " ")}</text></svg>`;
    comps.push({ input: Buffer.from(svg), left: x, top: y });
    void meta;
  }
  await sharp({ create: { width: COLS * TILE_W, height: ROWS * TILE_H, channels: 3, background: "#fff" } })
    .composite(comps)
    .jpeg({ quality: 82 })
    .toFile(path.join(outDir, `${prefix}-${String(s + 1).padStart(2, "0")}.jpg`));
}
console.log("sheets:", Math.ceil(list.length / per));
