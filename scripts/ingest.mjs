#!/usr/bin/env node
/**
 * MUSEUM data ingestion — Cleveland Museum of Art Open Access API (CC0).
 *
 *   node scripts/ingest.mjs select   -> query the API per curated seed, validate & pick artworks
 *   node scripts/ingest.mjs images   -> download images, make web copies + detail crops
 *   node scripts/ingest.mjs build    -> write src/data/artworks.json
 *   node scripts/ingest.mjs all
 *
 * Titles, artists, dates, descriptions, "did you know" facts and biographies are copied
 * verbatim from the museum's records. Seeds (scripts/seeds.mjs) only say *who* to look for;
 * records that fail validation (no CC0 licence, no image, uncertain attribution, odd dates…)
 * are dropped. The shipped game never calls these APIs at runtime.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ARTISTS, DEPARTMENT_SWEEPS } from "./seeds.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CACHE = path.join(ROOT, "scripts", ".cache");
const SELECTED = path.join(CACHE, "selected.json");
const IMAGES_META = path.join(CACHE, "images.json");
const OUT_JSON = path.join(ROOT, "src", "data", "artworks.json");
const OUT_ART = path.join(ROOT, "public", "art");
const API = "https://openaccess-api.clevelandart.org/api/artworks/";
const FIELDS = [
  "id", "accession_number", "title", "alternate_titles", "creation_date", "creation_date_earliest", "creation_date_latest",
  "type", "technique", "culture", "department", "description", "did_you_know", "creators", "images", "is_highlight", "url",
  "creditline", "measurements", "share_license_status", "tombstone",
].join(",");

fs.mkdirSync(CACHE, { recursive: true });
fs.mkdirSync(path.join(OUT_ART, "details"), { recursive: true });
fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) =>
  (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

let nextSlot = 0;
async function throttle(ms = 350) {
  const now = Date.now();
  const wait = Math.max(0, nextSlot - now);
  nextSlot = Math.max(now, nextSlot) + ms;
  if (wait) await sleep(wait);
}

async function api(params) {
  const qs = new URLSearchParams({ cc0: "1", has_image: "1", fields: FIELDS, ...params });
  const url = `${API}?${qs}`;
  for (let i = 0; i < 4; i++) {
    try {
      await throttle();
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      const j = JSON.parse(await res.text());
      return j.data ?? [];
    } catch {
      await sleep(3000 * (i + 1));
    }
  }
  return [];
}

// ------------------------------------------------------------------ helpers

const strip = (html) =>
  (html || "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&rsquo;/g, "’")
    .replace(/\s+/g, " ")
    .trim();

function sentences(text) {
  const parts = text.split(/(?<=[.!?])\s+(?=[A-Z“"‘'])/);
  const out = [];
  for (const p of parts) {
    if (out.length && /(\bc|\bca|\bSt|\bJr|\bSr|\bNo|\bvs|\bDr|\bMr|\bMrs|\bMs|\bfig|\bcat)\.$/.test(out[out.length - 1])) out[out.length - 1] += " " + p;
    else out.push(p);
  }
  return out;
}

function takeSentences(text, maxChars, from = 0, maxCount = 3) {
  const s = sentences(strip(text)).slice(from);
  let out = "";
  let n = 0;
  for (const x of s) {
    if (n >= maxCount) break;
    if (out && (out + " " + x).length > maxChars) break;
    if (!out && x.length > maxChars * 1.4) {
      out = x.slice(0, maxChars).replace(/\s+\S*$/, "") + "…";
      break;
    }
    out = (out + " " + x).trim();
    n++;
  }
  return out;
}

const CATEGORY = {
  painting: "painting",
  drawing: "drawing",
  print: "printmaking",
  sculpture: "sculpture",
  photograph: "photography",
  "miniature painting": "painting",
  "original drawing": "drawing",
  "illustrated book": "printmaking",
};
function categoryOf(o) {
  const t = norm(o.type);
  if (CATEGORY[t]) return CATEGORY[t];
  if (/architect/.test(t)) return "architecture";
  if (/painting/.test(t)) return "painting";
  if (/sculpt|relief|statue/.test(t)) return "sculpture";
  return "decorative";
}

function periodOf(year) {
  if (year < 500) return "Ancient";
  if (year < 1400) return "Medieval";
  if (year < 1600) return "Renaissance";
  if (year < 1740) return "Baroque";
  if (year < 1815) return "Enlightenment";
  if (year < 1900) return "19th Century";
  if (year < 1945) return "Modern";
  return "Contemporary";
}

const BAD_TITLE = /^(untitled|portrait|landscape|study|sketch|figure|head|seated figure|standing figure|fragment|plate \d+|page|leaf)$/i;

/** Parse "Claude Monet (French, 1840–1926)" */
function parseCreator(c) {
  const m = /^(.*?)\s*\(([^,)]*?)(?:,\s*(?:about|c\.|born|died)?\s*(-?\d{3,4})\s*[–-]\s*(-?\d{3,4}))?\)\s*$/.exec(c.description || "");
  const name = (m ? m[1] : c.description || "").trim();
  return {
    name,
    nationality: m ? m[2].trim() || null : null,
    birth: m && m[3] ? Number(m[3]) : null,
    death: m && m[4] ? Number(m[4]) : null,
  };
}

function toRecord(o, seed) {
  if (o.share_license_status !== "CC0") return { reject: "licence" };
  const print = o.images?.print?.url;
  const web = o.images?.web?.url;
  if (!print && !web) return { reject: "no image" };
  if (!o.images?.web?.width || (Number(o.images.web.width) < 500 && Number(o.images.web.height) < 500)) return { reject: "tiny image" };
  const title = (o.title || "").replace(/\s+/g, " ").replace(/<[^>]+>/g, "").trim();
  if (title.length < 3 || title.length > 68 || BAD_TITLE.test(title) || /[|\[\]]/.test(title)) return { reject: "title" };
  const begin = Number(o.creation_date_earliest);
  const end = Number(o.creation_date_latest ?? o.creation_date_earliest);
  if (!Number.isFinite(begin) || !Number.isFinite(end) || (begin === 0 && end === 0)) return { reject: "no date" };
  const span = end - begin;
  if (span < 0 || span > 60) return { reject: "date range" };
  const description = strip(o.description);
  const dyk = strip(o.did_you_know);
  if (description.length < 60 && dyk.length < 40) return { reject: "no educational text" };

  let artist = null;
  let creator = null;
  if (seed.artistMatch) {
    const creators = o.creators || [];
    if (creators.length !== 1) return { reject: "multiple/no creators" };
    const c = creators[0];
    if (c.role !== "artist" || c.qualifier || c.extent) return { reject: "uncertain attribution" };
    creator = parseCreator(c);
    if (!norm(creator.name).includes(norm(seed.artistMatch))) return { reject: "other artist" };
    artist = creator.name;
  } else if ((o.creators || []).length) {
    return { reject: "has creator in anonymous sweep" };
  }

  const category = categoryOf(o);
  const year = Math.round((begin + end) / 2);
  return {
    rec: {
      id: "cma-" + o.id,
      cmaId: o.id,
      accession: o.accession_number,
      isHighlight: !!o.is_highlight,
      title,
      alternateTitles: (o.alternate_titles || []).map((t) => strip(t)).filter((t) => t && t.length < 90 && norm(t) !== norm(title)).slice(0, 3),
      artist,
      artistNationality: creator?.nationality ?? null,
      artistBirthYear: creator?.birth ?? null,
      artistDeathYear: creator?.death ?? null,
      artistBio: creator ? takeSentences(o.creators[0].biography || "", 380, 0, 2) || null : null,
      creationYear: year,
      yearSpan: span,
      dateDisplay: strip(o.creation_date) || String(year),
      category,
      movement: seed.movement,
      period: periodOf(year),
      difficulty: seed.tier === 1 ? "easy" : seed.tier === 2 ? "intermediate" : "expert",
      medium: o.technique ? strip(o.technique) : null,
      culture: (o.culture || [])[0] ?? null,
      department: o.department,
      creditLine: o.creditline || null,
      measurements: (o.measurements || "").match(/unframed: ([^;(]*cm)/i)?.[1]?.trim() ?? (o.measurements || "").match(/^([^;(]*cm)/)?.[1]?.trim() ?? null,
      description: description.length >= 60 ? takeSentences(description, 430, 0, 3) : takeSentences(dyk, 430, 0, 2),
      didYouKnow: description.length >= 60 && dyk.length >= 40 ? takeSentences(dyk, 300, 0, 2) : null,
      sourceUrl: o.url,
      printUrl: print || web,
      webUrl: web || print,
    },
  };
}

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(
    Array.from({ length: n }, async () => {
      while (i < items.length) {
        const k = i++;
        out[k] = await fn(items[k], k);
      }
    }),
  );
  return out;
}

const rank = (r) => (r.isHighlight ? 100 : 0) + (r.description.length > 150 ? 10 : 0) + (r.didYouKnow ? 5 : 0) + (r.yearSpan <= 5 ? 3 : 0);

// ------------------------------------------------------------------ stage 1

async function select() {
  const chosen = new Map();
  const stats = [];
  for (const a of ARTISTS) {
    const match = a.match || a.name;
    const data = await api({ artists: a.name, limit: "100" });
    const recs = [];
    const reasons = {};
    for (const o of data) {
      const r = toRecord(o, { movement: a.movement, tier: a.tier, artistMatch: match });
      if (r.rec) recs.push(r.rec);
      else reasons[r.reject] = (reasons[r.reject] || 0) + 1;
    }
    recs.sort((x, y) => rank(y) - rank(x) || x.cmaId - y.cmaId);
    const want = a.per ?? 2;
    const picked = [];
    const cats = new Map();
    // first pass: one per category for variety; second pass: fill up
    for (const pass of [0, 1]) {
      for (const r of recs) {
        if (picked.length >= want) break;
        if (picked.includes(r) || picked.some((p) => norm(p.title) === norm(r.title))) continue;
        if (pass === 0 && cats.get(r.category)) continue;
        picked.push(r);
        cats.set(r.category, (cats.get(r.category) || 0) + 1);
      }
    }
    for (const p of picked) chosen.set(p.id, p);
    stats.push(`${a.name}: ${picked.length}/${want} (api ${data.length}, valid ${recs.length}, rejects ${JSON.stringify(reasons)})`);
  }

  for (const d of DEPARTMENT_SWEEPS) {
    const data = await api({ department: d.dept, is_highlight: "1", limit: "100" });
    const recs = [];
    for (const o of data) {
      const r = toRecord(o, { movement: d.movement, tier: 2 });
      if (r.rec && !r.rec.artist) {
        r.rec.difficulty = d.tier === 3 ? "expert" : "intermediate";
        recs.push(r.rec);
      }
    }
    recs.sort((x, y) => rank(y) - rank(x) || x.cmaId - y.cmaId);
    const picked = [];
    for (const r of recs) {
      if (picked.length >= d.max) break;
      if (picked.some((p) => norm(p.title) === norm(r.title))) continue;
      picked.push(r);
    }
    for (const p of picked) chosen.set(p.id, p);
    stats.push(`DEPT ${d.dept}: +${picked.length} (api ${data.length}, valid ${recs.length})`);
  }

  fs.writeFileSync(SELECTED, JSON.stringify([...chosen.values()], null, 1));
  console.log(stats.join("\n"));
  console.log(`\nSelected ${chosen.size} candidate artworks`);
}

// ------------------------------------------------------------------ stage 2: images

async function download(url, tries = 3) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      return Buffer.from(await res.arrayBuffer());
    } catch {
      await sleep(1500 * (i + 1));
    }
  }
  return null;
}

function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick a detail window (normalised x,y,w,h). Window size and "obviousness" depend on difficulty. */
async function chooseDetail(sharp, buf, difficulty, seedNum) {
  const { data, info } = await sharp(buf, { limitInputPixels: false })
    .rotate()
    .resize({ width: 480, height: 480, fit: "inside" })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const W = info.width;
  const H = info.height;
  const frac = difficulty === "easy" ? 0.42 : difficulty === "intermediate" ? 0.3 : 0.2;
  let ww = Math.round(W * frac);
  let wh = Math.round(ww * 0.75);
  if (wh > H * 0.8) {
    wh = Math.round(H * 0.8);
    ww = Math.round(wh / 0.75);
  }
  if (ww < 24 || wh < 24) return null;
  const size = (W + 1) * (H + 1);
  const integ = new Float64Array(size);
  const integ2 = new Float64Array(size);
  const lum = new Float64Array(size);
  for (let y = 0; y < H; y++) {
    let row = 0, row2 = 0, rowl = 0;
    for (let x = 0; x < W; x++) {
      let g = 0;
      if (x > 0 && y > 0 && x < W - 1 && y < H - 1) {
        const gx = data[y * W + x + 1] - data[y * W + x - 1];
        const gy = data[(y + 1) * W + x] - data[(y - 1) * W + x];
        g = Math.sqrt(gx * gx + gy * gy);
      }
      const v = data[y * W + x];
      row += g;
      rowl += v;
      row2 += v * v;
      const i = (y + 1) * (W + 1) + x + 1;
      integ[i] = integ[i - (W + 1)] + row;
      lum[i] = lum[i - (W + 1)] + rowl;
      integ2[i] = integ2[i - (W + 1)] + row2;
    }
  }
  const sum = (arr, x, y, w, h) => arr[(y + h) * (W + 1) + x + w] - arr[y * (W + 1) + x + w] - arr[(y + h) * (W + 1) + x] + arr[y * (W + 1) + x];
  const mx = Math.round(W * 0.08);
  const my = Math.round(H * 0.08);
  const cands = [];
  const step = Math.max(3, Math.round(W / 60));
  for (let y = my; y + wh <= H - my; y += step)
    for (let x = mx; x + ww <= W - mx; x += step) {
      const n = ww * wh;
      const energy = sum(integ, x, y, ww, wh) / n;
      const m = sum(lum, x, y, ww, wh) / n;
      const variance = Math.sqrt(Math.max(0, sum(integ2, x, y, ww, wh) / n - m * m));
      cands.push({ x, y, energy, variance });
    }
  if (!cands.length) return null;
  cands.sort((a, b) => b.energy - a.energy);
  const rng = mulberry32(seedNum);
  const lo = difficulty === "easy" ? 0 : difficulty === "intermediate" ? 0.08 : 0.15;
  const hi = difficulty === "easy" ? 0.06 : difficulty === "intermediate" ? 0.25 : 0.4;
  const from = Math.floor(cands.length * lo);
  const slice = cands.slice(from, Math.max(from + 1, Math.floor(cands.length * hi)));
  const useful = slice.filter((c) => c.variance > 12);
  const choose = useful.length ? useful : slice;
  const pick = choose[Math.floor(rng() * choose.length)];
  return { x: pick.x / W, y: pick.y / H, w: ww / W, h: wh / H, variance: pick.variance };
}

async function images() {
  const sharp = (await import("sharp")).default;
  const recs = JSON.parse(fs.readFileSync(SELECTED, "utf8"));
  const meta = fs.existsSync(IMAGES_META) ? JSON.parse(fs.readFileSync(IMAGES_META, "utf8")) : {};
  let done = 0;
  await pool(recs, 3, async (r) => {
    const main = path.join(OUT_ART, r.id + ".jpg");
    const det = path.join(OUT_ART, "details", r.id + ".jpg");
    if (meta[r.id] && !meta[r.id].failed && fs.existsSync(main) && (!meta[r.id].detail || fs.existsSync(det))) return;
    let buf = await download(r.printUrl);
    if (!buf) buf = await download(r.webUrl);
    if (!buf) {
      meta[r.id] = { failed: "download" };
      console.log("FAILED download", r.id, r.title);
      return;
    }
    try {
      const base = sharp(buf, { limitInputPixels: false }).rotate();
      const out = await base
        .clone()
        .resize({ width: 1280, height: 1280, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: 76, mozjpeg: true })
        .toBuffer({ resolveWithObject: true });
      fs.writeFileSync(main, out.data);
      const rotated = await base.clone().toBuffer({ resolveWithObject: true });
      const RW = rotated.info.width;
      const RH = rotated.info.height;
      let detail = null;
      const rect = await chooseDetail(sharp, rotated.data, r.difficulty, r.cmaId);
      if (rect && RW >= 700) {
        const left = Math.round(rect.x * RW);
        const top = Math.round(rect.y * RH);
        const width = Math.min(RW - left, Math.round(rect.w * RW));
        const height = Math.min(RH - top, Math.round(rect.h * RH));
        const crop = await sharp(rotated.data)
          .extract({ left, top, width, height })
          .resize({ width: 760, withoutEnlargement: true })
          .jpeg({ quality: 80, mozjpeg: true })
          .toBuffer({ resolveWithObject: true });
        fs.writeFileSync(det, crop.data);
        detail = {
          rect: { x: +(left / RW).toFixed(4), y: +(top / RH).toFixed(4), w: +(width / RW).toFixed(4), h: +(height / RH).toFixed(4) },
          width: crop.info.width,
          height: crop.info.height,
          sourcePixels: `${RW}x${RH}`,
        };
      }
      meta[r.id] = { width: out.info.width, height: out.info.height, detail };
      done++;
      if (done % 8 === 0) {
        fs.writeFileSync(IMAGES_META, JSON.stringify(meta));
        console.log("images processed:", done, "/", recs.length);
      }
    } catch (e) {
      meta[r.id] = { failed: String(e.message || e) };
      console.log("FAILED process", r.id, e.message);
    }
  });
  fs.writeFileSync(IMAGES_META, JSON.stringify(meta));
  console.log("images done:", done);
}

// ------------------------------------------------------------------ stage 3: build

const NOUN = { painting: "painting", sculpture: "sculpture", photography: "photograph", drawing: "drawing", printmaking: "print", architecture: "architectural work", decorative: "work" };

function build() {
  const recs = JSON.parse(fs.readFileSync(SELECTED, "utf8"));
  const meta = JSON.parse(fs.readFileSync(IMAGES_META, "utf8"));
  const out = [];
  for (const r of recs) {
    const m = meta[r.id];
    if (!m || m.failed || !fs.existsSync(path.join(OUT_ART, r.id + ".jpg"))) continue;
    const facts = [];
    if (r.didYouKnow) facts.push(r.didYouKnow);
    if (r.medium) facts.push(`Medium: ${r.medium}.`);
    if (r.measurements) facts.push(`It measures ${r.measurements}.`);
    if (r.artistBirthYear && r.yearSpan <= 2 && !/c\.|about|probably|possibly/i.test(r.dateDisplay)) {
      const age = r.creationYear - r.artistBirthYear;
      if (age >= 12 && age <= 90) facts.push(`${r.artist} was about ${age} years old when this was made.`);
    }
    out.push({
      id: r.id,
      title: r.title,
      alternativeTitles: r.alternateTitles,
      artist: r.artist,
      artistNationality: r.artistNationality,
      artistBirthYear: r.artistBirthYear,
      artistDeathYear: r.artistDeathYear,
      artistBio: r.artistBio,
      artistBioSource: r.artistBio ? { name: "Cleveland Museum of Art — artist biography", url: r.sourceUrl, license: "CC0 1.0" } : null,
      creationYear: r.creationYear,
      yearSpan: r.yearSpan,
      dateDisplay: r.dateDisplay,
      category: r.category,
      movement: r.movement,
      period: r.period,
      difficulty: r.difficulty,
      medium: r.medium,
      culture: r.culture,
      imageUrl: `/art/${r.id}.jpg`,
      imageWidth: m.width,
      imageHeight: m.height,
      imageSource: r.sourceUrl,
      detail: m.detail
        ? {
            imageUrl: `/art/details/${r.id}.jpg`,
            width: m.detail.width,
            height: m.detail.height,
            rect: m.detail.rect,
            source: `Real crop of the museum's ${m.detail.sourcePixels}px open-access image (region x=${m.detail.rect.x}, y=${m.detail.rect.y}, w=${m.detail.rect.w}, h=${m.detail.rect.h})`,
          }
        : null,
      description: r.description || `${r.title} is a ${NOUN[r.category]}, dated ${r.dateDisplay}.`,
      descriptionSource: { name: "Cleveland Museum of Art", url: r.sourceUrl, license: "CC0 1.0" },
      interestingFacts: facts.slice(0, 3),
      museum: "The Cleveland Museum of Art",
      museumUrl: "https://www.clevelandart.org",
      sourceUrl: r.sourceUrl,
      license: "CC0 1.0 (Cleveland Museum of Art Open Access)",
      tags: [r.department, r.culture].filter(Boolean),
    });
  }
  out.sort((a, b) => a.id.localeCompare(b.id));
  fs.writeFileSync(OUT_JSON, JSON.stringify(out, null, 1));
  const by = (k) => out.reduce((m, a) => ((m[a[k]] = (m[a[k]] || 0) + 1), m), {});
  console.log(`Wrote ${out.length} artworks`, { difficulty: by("difficulty"), category: by("category"), period: by("period"), withDetail: out.filter((a) => a.detail).length });
}

const stage = process.argv[2] ?? "all";
const run = { select, images, build };
if (stage === "all") for (const k of ["select", "images", "build"]) await run[k]();
else if (run[stage]) await run[stage]();
else console.error("unknown stage", stage);
