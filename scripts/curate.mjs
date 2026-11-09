#!/usr/bin/env node
/**
 * Phase 1: applies scripts/curation.mjs to the raw ingestion output
 * (scripts/.cache/artworks.base.json) and writes src/data/artworks.json.
 * Idempotent: always starts from the base file. Also writes docs/audit/changes.json.
 *
 * Difficulty is computed PER ARTWORK and PER MODE (see score functions below):
 *   guess    – recognising the whole work: public recognisability of that work
 *   detail   – recognising a close-up: recognisability, one notch harder
 *   artist   – naming the creator: artist fame, harder if the medium is atypical for them
 *   movement – naming its artistic movement: how well known the movement is (movements.ts), easier for famous works
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { movementDifficulty } from "../src/lib/game/movements.ts"; // run with tsx (npm run curate)
import { ARTIST_FAME, CATEGORY, DESCRIPTION_FIX, FACT_FIX, MOVEMENT, RECOGNIZABILITY, REMOVE, TITLE_QUIZ_OFF, TYPICAL_MEDIA } from "./curation.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const famousFile = path.join(root, "scripts", ".cache", "famous.base.json");
const base = [
  ...JSON.parse(fs.readFileSync(path.join(root, "scripts", ".cache", "artworks.base.json"), "utf8")),
  // very famous public-domain works from Wikidata/Commons (scripts/ingest-famous.mjs)
  ...(fs.existsSync(famousFile) ? JSON.parse(fs.readFileSync(famousFile, "utf8")) : []),
];
const records = JSON.parse(fs.readFileSync(path.join(root, "scripts", ".cache", "records.json"), "utf8"));
const cropsFile = path.join(root, "scripts", "curation", "crops.json");
const manifestFile = path.join(root, "scripts", ".cache", "images-manifest.json");
const manifest = fs.existsSync(manifestFile) ? JSON.parse(fs.readFileSync(manifestFile, "utf8")) : {};
const crops = fs.existsSync(cropsFile) ? JSON.parse(fs.readFileSync(cropsFile, "utf8")) : {};

const TIER_BY_OLD = { easy: 1, intermediate: 2, expert: 3 };
const DEFAULT_RECOG = { 1: 2.5, 2: 1.5, 3: 0.8 };
const level = (score, easyAt, midAt) => (score >= easyAt ? "easy" : score >= midAt ? "intermediate" : "expert");
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const UNCERTAIN_DATE = /after|before|probably|possibly|\bor\b|shortly/i;

const log = { removed: [], movement: [], category: [], difficulty: [], quizOff: [], dates: [], crops: [] };
const out = [];

for (const a of base) {
  const num = Number(a.id.replace("cma-", ""));
  const rec = records[a.id] ?? {};
  if (REMOVE[num]) {
    log.removed.push({ id: a.id, title: a.title, reason: REMOVE[num] });
    continue;
  }
  const tier = TIER_BY_OLD[a.difficulty];
  const anonymous = !a.artist;

  // ---- movement / category
  let movement = a.movement;
  if (num in MOVEMENT) {
    movement = MOVEMENT[num];
    if (movement !== a.movement) log.movement.push({ id: a.id, title: a.title, from: a.movement, to: movement });
  }
  let category = a.category;
  if (CATEGORY[num] && CATEGORY[num] !== a.category) {
    log.category.push({ id: a.id, title: a.title, from: a.category, to: CATEGORY[num] });
    category = CATEGORY[num];
  }

  // ---- recognisability
  let recog = RECOGNIZABILITY[num] ?? a.recog;
  if (recog === undefined) {
    recog = anonymous ? 1.0 + (rec.highlight ? 0.6 : 0) : DEFAULT_RECOG[tier] + (rec.highlight ? 0.3 : 0);
    if (rec.citations >= 60) recog += 0.3;
    if (/^(Portrait of|Study|Sketch|Sheet of|Head of|Various)/i.test(a.title)) recog -= 0.4;
    if (/\((recto|verso)/i.test(a.title)) recog -= 0.8;
  }

  // ---- per-mode difficulty
  const fame = anonymous ? null : ARTIST_FAME[tier];
  const typical = TYPICAL_MEDIA[a.artist] ?? ["painting"];
  const atypical = !anonymous && !typical.includes(category);
  const artistScore = anonymous ? 0 : fame + (atypical ? -1.0 : 0) + clamp((recog - DEFAULT_RECOG[tier]) * 0.4, -0.5, 0.5);
  // "Which Movement?": how well known the movement is; a famous work makes its movement easier to name
  const baseMovement = movement ? movementDifficulty(movement) : "expert";
  const movementLevel = recog >= 3.4 ? (baseMovement === "expert" ? "intermediate" : "easy") : baseMovement;
  const difficulty = {
    guess: level(recog, 2.4, 1.4),
    detail: level(recog - 0.35, 2.3, 1.3),
    artist: anonymous ? "expert" : level(artistScore, 2.6, 1.5),
    movement: movementLevel,
  };
  log.difficulty.push({ id: a.id, title: a.title, old: a.difficulty, recog: +recog.toFixed(2), ...difficulty });

  // ---- which modes may use this artwork
  const titleOk = !TITLE_QUIZ_OFF[num];
  if (!titleOk) log.quizOff.push({ id: a.id, title: a.title, reason: TITLE_QUIZ_OFF[num] });
  const crop = crops[a.id];
  const man = manifest[a.id];
  const detailRaw = a.detail ? { ...a.detail, ...(crop ? { rect: crop.rect ?? a.detail.rect, status: crop.status } : { status: "reviewed" }) } : null;
  // ---- images: responsive WebP variants from scripts/images.mjs (falls back to the legacy single JPEG)
  let imageFields = {};
  let detail = detailRaw;
  if (man) {
    const largest = man.variants[man.variants.length - 1];
    imageFields = {
      imageUrl: `/art/${a.id}/${largest.long}.webp`,
      imageWidth: largest.w,
      imageHeight: largest.h,
      images: {
        variants: man.variants.map((v) => ({ url: `/art/${a.id}/${v.long}.webp`, w: v.w, h: v.h, bytes: v.bytes })),
        original: { w: man.source.w, h: man.source.h, format: man.source.format },
      },
    };
    detail = detailRaw && man.detail ? { ...detailRaw, imageUrl: `/art/${a.id}/detail.webp`, width: man.detail.w, height: man.detail.h, bytes: man.detail.bytes } : detailRaw && detailRaw.status === "rejected" ? { ...detailRaw, imageUrl: null, bytes: 0 } : detailRaw;
  }
  const quiz = {
    guess: titleOk,
    detail: titleOk && !!detail && detail.status !== "rejected",
    artist: !anonymous && !new RegExp(a.artist.split(" ").pop().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i").test(a.title),
    movement: !!movement,
  };

  // ---- facts: keep only the museum's own "did you know" text; templated facts are rendered by the UI
  const dyk = a.interestingFacts.filter((f) => !/^Medium: |^It measures |years old when this was made\.$/.test(f));
  const measurements = (a.interestingFacts.find((f) => f.startsWith("It measures ")) ?? "").replace(/^It measures |\.$/g, "") || null;

  // ---- artist name hygiene: some museum records carry "(Nationality, born …, 1755–1828)" in the name
  let artistName = a.artist;
  let nationality = a.artistNationality;
  let birth = a.artistBirthYear;
  let death = a.artistDeathYear;
  const paren = a.artist ? /^(.*?)\s*\(([^)]*)\)\s*$/.exec(a.artist) : null;
  if (paren) {
    artistName = paren[1].trim();
    const inner = paren[2];
    nationality = nationality ?? inner.split(",")[0].trim();
    const years = inner.match(/\d{4}/g);
    if (years?.length) {
      birth = birth ?? Number(years[0]);
      death = death ?? (years.length > 1 ? Number(years[years.length - 1]) : null);
    }
    log.artistNames = [...(log.artistNames ?? []), { id: a.id, from: a.artist, to: artistName }];
  }
  // ---- biography hygiene: drop dates-only bios, catalogue shorthand and "Name Nationality, 1857-1927" headers
  let bio = a.artistBio;
  if (bio) {
    bio = bio.replace(/\s*\(q\.v\.\)/g, "").replace(/^.{3,50}? (French|British|American|German|Dutch|Italian|English), \d{4}\s*[-–]\s*\d{4}\s+/, "").trim();
    if (bio.length < 45) bio = null;
  }

  const { difficulty: _old, interestingFacts: _f, recog: _r, ...rest } = a;
  void _r;
  void _old;
  void _f;
  out.push({
    ...rest,
    artist: artistName,
    artistNationality: nationality,
    artistBirthYear: birth,
    artistDeathYear: death,
    artistBio: bio,
    artistBioSource: bio ? a.artistBioSource : null,
    description: DESCRIPTION_FIX[num] ?? rest.description,
    ...imageFields,
    category,
    movement,
    difficulty,
    quiz,
    recognizability: +recog.toFixed(2),
    detail,
    interestingFacts: FACT_FIX[num] ?? dyk,
    measurements,
  });
}

out.sort((x, y) => x.id.localeCompare(y.id));
fs.writeFileSync(path.join(root, "src", "data", "artworks.json"), JSON.stringify(out, null, 1));
fs.mkdirSync(path.join(root, "docs", "audit"), { recursive: true });
fs.writeFileSync(path.join(root, "docs", "audit", "changes.json"), JSON.stringify(log, null, 1));

const count = (f) => out.reduce((m, a) => ((m[f(a)] = (m[f(a)] || 0) + 1), m), {});
console.log("artworks:", out.length, "removed:", log.removed.length);
for (const m of ["guess", "detail", "artist", "movement"]) console.log(m, count((a) => a.difficulty[m]), "eligible:", out.filter((a) => a.quiz[m]).length);
console.log("movement changes:", log.movement.length, "category changes:", log.category.length, "quiz-off titles:", log.quizOff.length);
