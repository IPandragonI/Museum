// Phase 1 helper: re-fetch the complete museum record for every artwork in the dataset,
// so the audit compares our data to the primary source (not to our own earlier extraction).
// Output: scripts/.cache/records/<id>.json (cached) and scripts/.cache/records.json (compact summary).
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(root, "scripts", ".cache", "records");
fs.mkdirSync(dir, { recursive: true });
const artworks = JSON.parse(fs.readFileSync(path.join(root, "src", "data", "artworks.json"), "utf8"));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const out = {};
for (const a of artworks) {
  const cmaId = a.id.replace("cma-", "");
  const file = path.join(dir, cmaId + ".json");
  let rec;
  if (fs.existsSync(file)) rec = JSON.parse(fs.readFileSync(file, "utf8"));
  else {
    for (let i = 0; i < 4 && !rec; i++) {
      try {
        const res = await fetch(`https://openaccess-api.clevelandart.org/api/artworks/${cmaId}`);
        if (!res.ok) throw new Error(String(res.status));
        rec = (await res.json()).data;
        fs.writeFileSync(file, JSON.stringify(rec));
      } catch {
        await sleep(2000 * (i + 1));
      }
    }
    await sleep(300);
  }
  if (!rec) {
    out[a.id] = { missing: true };
    continue;
  }
  out[a.id] = {
    title: rec.title,
    titleOriginal: rec.title_in_original_language,
    altTitles: rec.alternate_titles,
    type: rec.type,
    department: rec.department,
    collection: rec.collection,
    technique: rec.technique,
    creationDate: rec.creation_date,
    earliest: rec.creation_date_earliest,
    latest: rec.creation_date_latest,
    culture: rec.culture,
    creators: (rec.creators || []).map((c) => ({ d: c.description, role: c.role, q: c.qualifier, e: c.extent })),
    wikidata: rec.external_resources?.wikidata?.[0] ?? null,
    citations: (rec.citations || []).length,
    exhibitions: (rec.exhibitions?.legacy || []).length + (rec.exhibitions?.current || []).length,
    onView: !!rec.current_location,
    highlight: !!rec.is_highlight,
    license: rec.share_license_status,
    printW: Number(rec.images?.print?.width) || null,
    printH: Number(rec.images?.print?.height) || null,
    descLen: (rec.description || "").length,
    dykLen: (rec.did_you_know || "").length,
    measurements: rec.measurements,
    stateOfWork: rec.state_of_the_work,
    editionOf: rec.edition_of_the_work,
  };
}
fs.writeFileSync(path.join(root, "scripts", ".cache", "records.json"), JSON.stringify(out));
console.log("records:", Object.keys(out).length, "missing:", Object.values(out).filter((r) => r.missing).length);
