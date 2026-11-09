// Generates PNG app icons from public/icons/icon.svg.  Run: node scripts/icons.mjs
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "public", "icons");
const svg = fs.readFileSync(path.join(dir, "icon.svg"));

const targets = [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
];
for (const [name, size] of targets) {
  await sharp(svg, { density: 384 }).resize(size, size).png().toFile(path.join(dir, name));
}
// Maskable: artwork scaled into the 80% safe zone on a solid background.
const inner = await sharp(svg, { density: 384 }).resize(410, 410).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: "#1b1915" } })
  .composite([{ input: inner, gravity: "center" }])
  .png()
  .toFile(path.join(dir, "icon-maskable-512.png"));
console.log("icons written");
