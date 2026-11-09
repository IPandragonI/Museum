// Caches a 2600px working copy (JPEG q90) of every artwork's museum "print" image in
// scripts/.cache/work/<id>.jpg. All later image work (crop review, thumbnails, WebP/AVIF)
// derives from these working copies, so the museum server is only hit once.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const work = path.join(root, "scripts", ".cache", "work");
fs.mkdirSync(work, { recursive: true });
const selected = JSON.parse(fs.readFileSync(path.join(root, "scripts", ".cache", "selected.json"), "utf8"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const report = {};

async function get(url) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await fetch(url);
      if (!r.ok) throw new Error(String(r.status));
      return Buffer.from(await r.arrayBuffer());
    } catch {
      await sleep(1500 * (i + 1));
    }
  }
  return null;
}

let i = 0;
async function worker() {
  while (i < selected.length) {
    const r = selected[i++];
    const file = path.join(work, r.id + ".jpg");
    if (fs.existsSync(file)) continue;
    const buf = (await get(r.printUrl)) ?? (await get(r.webUrl));
    if (!buf) {
      report[r.id] = "download failed";
      continue;
    }
    const meta = await sharp(buf, { limitInputPixels: false }).metadata();
    await sharp(buf, { limitInputPixels: false })
      .rotate()
      .resize({ width: 2600, height: 2600, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toFile(file);
    report[r.id] = { srcW: meta.width, srcH: meta.height, srcBytes: buf.length, format: meta.format };
    if (Object.keys(report).length % 20 === 0) console.log("fetched", Object.keys(report).length, "/", selected.length);
  }
}
await Promise.all([worker(), worker(), worker()]);
fs.writeFileSync(path.join(root, "scripts", ".cache", "source-images.json"), JSON.stringify(report));
console.log("done", Object.keys(report).length);
