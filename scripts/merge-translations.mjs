// Merges scripts/translations/fr-*.json (artworks) and artists-fr.json (biographies) into the bundled
// src/data/translations.fr.json, and reports coverage and structural problems (missing facts, unknown ids).
// The English originals stay untouched in src/data/artworks.json.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "scripts", "translations");
const art = JSON.parse(fs.readFileSync(path.join(root, "src", "data", "artworks.json"), "utf8"));
const byId = new Map(art.map((a) => [a.id, a]));

const artworks = {};
for (const f of fs.readdirSync(dir).filter((n) => /^fr-[\w-]+\.json$/.test(n)).sort()) {
  const part = JSON.parse(fs.readFileSync(path.join(dir, f), "utf8"));
  for (const k of Object.keys(part)) if (!k.startsWith("__")) artworks[k] = part[k]; // "__end" is an append marker
}
const artistsFile = path.join(dir, "artists-fr.json");
const artists = fs.existsSync(artistsFile) ? JSON.parse(fs.readFileSync(artistsFile, "utf8")) : {};

const problems = [];
for (const [id, tr] of Object.entries(artworks)) {
  const a = byId.get(id);
  if (!a) {
    problems.push(`unknown artwork ${id}`);
    delete artworks[id];
    continue;
  }
  if (!tr.description) problems.push(`${id}: no description`);
  if ((tr.didYouKnow?.length ?? 0) !== a.interestingFacts.length) problems.push(`${id}: ${a.interestingFacts.length} facts in English, ${tr.didYouKnow?.length ?? 0} in French`);
}
for (const name of Object.keys(artists)) if (!art.some((a) => a.artist === name)) problems.push(`unknown artist ${name}`);

fs.writeFileSync(path.join(root, "src", "data", "translations.fr.json"), JSON.stringify({ artworks, artists }, null, 1));
const bioNeeded = new Set(art.filter((a) => a.artistBio).map((a) => a.artist));
console.log(`descriptions: ${Object.keys(artworks).length}/${art.length} | artist bios: ${Object.keys(artists).length}/${bioNeeded.size}`);
if (problems.length) console.log("PROBLEMS:\n" + problems.join("\n"));
