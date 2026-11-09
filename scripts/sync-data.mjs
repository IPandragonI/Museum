#!/usr/bin/env node
/**
 * Copies the curated data (src/data/*.json, the source of truth used by scripts and tests) to public/data/ as
 * minified JSON. The app fetches these files at runtime instead of bundling ~1.2 MB of JSON into every page's
 * JavaScript, and the service worker pre-caches them so they work offline.
 * Runs automatically before `dev` and `build` (see package.json).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.join(root, "public", "data");
fs.mkdirSync(out, { recursive: true });
for (const f of ["artworks.json", "translations.fr.json"]) {
  const data = JSON.parse(fs.readFileSync(path.join(root, "src", "data", f), "utf8"));
  const text = JSON.stringify(data);
  fs.writeFileSync(path.join(out, f), text);
  console.log(`public/data/${f}: ${(text.length / 1024).toFixed(0)} KB`);
}

// Stamp the service worker so that every build is a byte-different worker: browsers then detect the update
// and the app offers "new version available" (otherwise unchanged sw.js would hide a new deploy).
const swFile = path.join(root, "public", "sw.js");
const stamp = new Date().toISOString().replace(/\D/g, "").slice(0, 12);
const sw = fs.readFileSync(swFile, "utf8").replace(/const VERSION = "[^"]*";/, `const VERSION = "v4-${stamp}";`);
fs.writeFileSync(swFile, sw);
console.log(`public/sw.js version v4-${stamp}`);
