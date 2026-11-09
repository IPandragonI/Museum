#!/usr/bin/env node
/**
 * Adds very famous public-domain works from Wikidata / Wikimedia Commons / Wikipedia (the Cleveland collection
 * does not hold them). Each candidate is an English Wikipedia article title; everything else is read from the sources:
 *   Wikipedia summary (en + fr)  → description (CC BY-SA 4.0, credited per artwork) and the Wikidata item id
 *   Wikidata                     → title, creator (+ life dates), inception, collection, materials, size, Commons image name
 *   Commons                      → image, and its licence field (must be public domain / CC0)
 * Rejections (guards): creator died after 1955, no single creator, no/unclear date, image not clearly public domain,
 * image too small, no French summary. Output: scripts/.cache/famous.base.json (same shape as artworks.base.json),
 * scripts/translations/fr-wiki.json (French text) and scripts/.cache/work/<id>.jpg (2600px working copies).
 *   node scripts/ingest-famous.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
sharp.cache(false); // keep memory low: no libvips cache, one image at a time
sharp.concurrency(1);

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cache = path.join(root, "scripts", ".cache");
const work = path.join(cache, "work");
fs.mkdirSync(work, { recursive: true });
const UA = "MuseumArtQuiz/1.0 (educational open-source art game; uses public Wikimedia APIs politely)";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => (s || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();

// [enwiki title, movement, recognisability 0-4]
const CANDIDATES = [
  ["Mona Lisa", "High Renaissance", 4], ["Lady with an Ermine", "High Renaissance", 3], ["Vitruvian Man", "High Renaissance", 3.6], ["Virgin of the Rocks", "High Renaissance", 2.6], ["Ginevra de' Benci", "High Renaissance", 2.4], ["La Belle Ferronnière", "High Renaissance", 2.4],
  ["The Creation of Adam", "High Renaissance", 4], ["The Last Judgment (Michelangelo)", "High Renaissance", 3.2], ["Doni Tondo", "High Renaissance", 2.4],
  ["The School of Athens", "High Renaissance", 3.8], ["Sistine Madonna", "High Renaissance", 3], ["Transfiguration (Raphael)", "High Renaissance", 2.6], ["Portrait of Baldassare Castiglione", "High Renaissance", 2.4], ["La velata", "High Renaissance", 2.2],
  ["The Birth of Venus", "Early Renaissance", 4], ["Primavera (Botticelli)", "Early Renaissance", 3.6], ["Venus and Mars (Botticelli)", "Early Renaissance", 2.4],
  ["Venus of Urbino", "Venetian Renaissance", 3], ["Bacchus and Ariadne", "Venetian Renaissance", 2.6], ["The Tempest (Giorgione)", "Venetian Renaissance", 2.6], ["Sleeping Venus", "Venetian Renaissance", 2.2],
  ["The Calling of St Matthew", "Baroque", 3.2], ["Judith Beheading Holofernes (Caravaggio)", "Baroque", 2.8], ["Medusa (Caravaggio)", "Baroque", 2.6], ["Bacchus (Caravaggio)", "Baroque", 2.6], ["The Taking of Christ (Caravaggio)", "Baroque", 2.4],
  ["The Night Watch", "Baroque", 4], ["The Anatomy Lesson of Dr. Nicolaes Tulp", "Baroque", 3.2], ["The Return of the Prodigal Son (Rembrandt)", "Baroque", 3], ["The Storm on the Sea of Galilee", "Baroque", 2.4], ["The Jewish Bride", "Baroque", 2.4], ["Belshazzar's Feast (Rembrandt)", "Baroque", 2.2],
  ["Girl with a Pearl Earring", "Baroque", 4], ["The Milkmaid (Vermeer)", "Baroque", 3.4], ["View of Delft", "Baroque", 3], ["The Art of Painting", "Baroque", 2.6], ["Woman Holding a Balance", "Baroque", 2.4], ["The Little Street", "Baroque", 2.4], ["Woman with a Pearl Necklace", "Baroque", 2.2],
  ["Las Meninas", "Baroque", 3.8], ["The Surrender of Breda", "Baroque", 2.6], ["Rokeby Venus", "Baroque", 2.8], ["Portrait of Innocent X", "Baroque", 2.6],
  ["The Third of May 1808", "Romanticism", 3.4], ["Saturn Devouring His Son", "Romanticism", 3.4], ["The Nude Maja", "Romanticism", 3], ["The Clothed Maja", "Romanticism", 2.6], ["The Family of Charles IV", "Romanticism", 2.6], ["Witches' Sabbath (Goya)", "Romanticism", 2.2],
  ["The Burial of the Count of Orgaz", "Mannerism", 3], ["View of Toledo", "Mannerism", 2.8],
  ["The Garden of Earthly Delights", "Early Netherlandish", 3.8], ["The Haywain Triptych", "Early Netherlandish", 2.6], ["The Temptation of St Anthony (Bosch)", "Early Netherlandish", 2.4],
  ["Hunters in the Snow", "Northern Renaissance", 3.2], ["Netherlandish Proverbs", "Northern Renaissance", 2.8], ["The Peasant Wedding", "Northern Renaissance", 2.4],
  ["Arnolfini Portrait", "Early Netherlandish", 3.6], ["Ghent Altarpiece", "Early Netherlandish", 3],
  ["Young Hare", "Northern Renaissance", 3], ["Praying Hands (Dürer)", "Northern Renaissance", 3], ["Self-Portrait (Dürer, Munich)", "Northern Renaissance", 2.6],
  ["The Ambassadors (Holbein)", "Northern Renaissance", 3.2], ["The Laughing Cavalier", "Baroque", 3], ["Et in Arcadia ego", "Baroque", 2.6],
  ["Pilgrimage to Cythera", "Rococo", 3], ["Pierrot (Watteau)", "Rococo", 3], ["The Swing (Fragonard)", "Rococo", 3.4], ["The Blue Boy", "Rococo", 3.4],
  ["The Death of Marat", "Neoclassicism", 3.4], ["Oath of the Horatii", "Neoclassicism", 3], ["Napoleon Crossing the Alps", "Neoclassicism", 3.4], ["The Coronation of Napoleon", "Neoclassicism", 3], ["The Intervention of the Sabine Women", "Neoclassicism", 2.6],
  ["La Grande Odalisque", "Neoclassicism", 3.4], ["Valpinçon Bather", "Neoclassicism", 2.4], ["The Turkish Bath", "Neoclassicism", 3], ["Portrait of Madame Moitessier", "Neoclassicism", 2.2],
  ["The Raft of the Medusa", "Romanticism", 3.8], ["Liberty Leading the People", "Romanticism", 4], ["The Death of Sardanapalus", "Romanticism", 3], ["Women of Algiers in their Apartment", "Romanticism", 2.8], ["Massacre at Chios", "Romanticism", 2.6], ["The Barque of Dante", "Romanticism", 2.6],
  ["The Fighting Temeraire", "Romanticism", 3.2], ["Rain, Steam and Speed", "Romanticism", 3], ["The Slave Ship", "Romanticism", 3], ["The Hay Wain", "Romanticism", 3.6],
  ["Wanderer above the Sea of Fog", "Romanticism", 4], ["Monk by the Sea", "Romanticism", 3], ["The Sea of Ice", "Romanticism", 2.6], ["The Ancient of Days", "Romanticism", 3],
  ["A Burial at Ornans", "Realism", 3], ["The Gleaners", "Realism", 3], ["The Angelus (painting)", "Realism", 3.2], ["The Sower (Millet)", "Realism", 2.4],
  ["Olympia (Manet)", "Realism", 3.6], ["Le Déjeuner sur l'herbe", "Realism", 3.6], ["A Bar at the Folies-Bergère", "Realism", 3.4], ["The Fifer (Manet)", "Realism", 2.6],
  ["Impression, Sunrise", "Impressionism", 4], ["Woman with a Parasol – Madame Monet and Her Son", "Impressionism", 3.2], ["The Japanese Footbridge", "Impressionism", 2.6],
  ["Luncheon of the Boating Party", "Impressionism", 3.6], ["Bal du moulin de la Galette", "Impressionism", 3.6], ["Dance at Bougival", "Impressionism", 2.6], ["Girls at the Piano", "Impressionism", 2.4],
  ["L'Absinthe", "Impressionism", 3], ["Paris Street; Rainy Day", "Impressionism", 3.6], ["The Floor Scrapers", "Impressionism", 2.6], ["The Cradle (Morisot)", "Impressionism", 2.4], ["The Child's Bath", "Impressionism", 2.6],
  ["A Sunday Afternoon on the Island of La Grande Jatte", "Neo-Impressionism", 4], ["Bathers at Asnières", "Neo-Impressionism", 3.4],
  ["The Card Players", "Post-Impressionism", 3.4], ["The Basket of Apples", "Post-Impressionism", 3],
  ["The Starry Night", "Post-Impressionism", 4], ["Bedroom in Arles", "Post-Impressionism", 3.6], ["Café Terrace at Night", "Post-Impressionism", 3.6], ["The Potato Eaters", "Post-Impressionism", 3.2], ["Irises (painting)", "Post-Impressionism", 3.4], ["Wheatfield with Crows", "Post-Impressionism", 3.2], ["Self-Portrait with Bandaged Ear", "Post-Impressionism", 3.4], ["The Night Café", "Post-Impressionism", 3], ["Starry Night Over the Rhône", "Post-Impressionism", 3], ["The Church at Auvers", "Post-Impressionism", 2.8], ["Almond Blossoms", "Post-Impressionism", 2.8], ["Sunflowers (Van Gogh series)", "Post-Impressionism", 3.6], ["Portrait of Dr. Gachet", "Post-Impressionism", 2.8], ["Wheat Field with Cypresses", "Post-Impressionism", 3.2], ["The Yellow House", "Post-Impressionism", 2.4], ["L'Arlésienne (Van Gogh)", "Post-Impressionism", 2.2],
  ["Where Do We Come From? What Are We? Where Are We Going?", "Post-Impressionism", 3.2], ["The Yellow Christ", "Post-Impressionism", 2.8], ["Vision After the Sermon", "Post-Impressionism", 2.6], ["Tahitian Women on the Beach", "Post-Impressionism", 2.8],
  ["At the Moulin Rouge", "Post-Impressionism", 2.8],
  ["The Sleeping Gypsy", "Naïve art", 3], ["The Dream (Rousseau)", "Naïve art", 3], ["Surprised!", "Naïve art", 3],
  ["The Kiss (Klimt)", "Symbolism", 4], ["Portrait of Adele Bloch-Bauer I", "Symbolism", 3.8], ["Judith and the Head of Holofernes (Klimt)", "Symbolism", 2.8], ["Beethoven Frieze", "Symbolism", 2.4],
  ["The Scream", "Expressionism", 4], ["Madonna (Munch)", "Expressionism", 2.8], ["The Sick Child (Munch)", "Expressionism", 2.6], ["Vampire (Munch)", "Expressionism", 2.4],
  ["Death and the Maiden (Schiele)", "Expressionism", 2.8],
  ["The Dance (Matisse)", "Fauvism", 3.4], ["The Joy of Life", "Fauvism", 3], ["Woman with a Hat", "Fauvism", 3], ["Harmony in Red", "Fauvism", 2.8], ["Luxe, Calme et Volupté", "Neo-Impressionism", 2.4],
  ["Black Square", "Suprematism", 3.4], ["Composition VII", "Expressionism", 2.8],
  ["Whistler's Mother", "Aestheticism", 3.8], ["Nocturne in Black and Gold – The Falling Rocket", "Aestheticism", 2.6],
  ["Portrait of Madame X", "Realism", 3.6], ["Carnation, Lily, Lily, Rose", "Realism", 2.8], ["El Jaleo", "Realism", 2.6],
  ["The Gulf Stream (painting)", "Realism", 2.8], ["The Gross Clinic", "Realism", 3], ["Snap the Whip", "Realism", 2.4],
  ["The Great Wave off Kanagawa", "Ukiyo-e", 4], ["Sudden Shower over Shin-Ōhashi bridge and Atake", "Ukiyo-e", 3],
  ["Vertumnus (Arcimboldo)", "Mannerism", 2.6], ["The Flagellation of Christ (Piero della Francesca)", "Early Renaissance", 2.4],
  ["Judith Slaying Holofernes (Gentileschi)", "Baroque", 3], ["Susanna and the Elders (Artemisia Gentileschi)", "Baroque", 2.2],
  ["The Lady of Shalott (Waterhouse painting)", "Pre-Raphaelite", 3], ["Hylas and the Nymphs", "Pre-Raphaelite", 2.6], ["Ophelia (Millais painting)", "Pre-Raphaelite", 3.4], ["Beata Beatrix", "Pre-Raphaelite", 2.4],
  ["The Snake Charmer (Gérôme)", "Academic art", 2.6], ["The Ninth Wave", "Romanticism", 2.6], ["Morning in a Pine Forest", "Realism", 2.4],
  ["Les Demoiselles d'Avignon", "Cubism", 3.6],
];

// ---- batch 2: more of the canon, women artists and non-Western works (a guess that does not resolve, or is not public domain, is skipped automatically)
CANDIDATES.push(
  ["Marie Antoinette and Her Children", "Neoclassicism", 2.8], ["The Horse Fair", "Realism", 3], ["Self-Portrait as the Allegory of Painting", "Baroque", 2.6], ["Self-Portrait in a Straw Hat", "Neoclassicism", 2.2],
  ["Red and White Plum Blossoms", "Rinpa school", 3], ["Along the River During the Qingming Festival", "Song dynasty art", 3.2], ["Night-Shining White", "Tang dynasty art", 2.6], ["Early Spring (painting)", "Song dynasty art", 2.8], ["Travelers Among Mountains and Streams", "Song dynasty art", 2.8], ["Jahangir Preferring a Sufi Sheikh to Kings", "Mughal painting", 2.4], ["The Dream of the Fisherman's Wife", "Ukiyo-e", 3],
  ["Lamentation (Giotto)", "Proto-Renaissance", 2.8], ["Maestà (Duccio)", "Proto-Renaissance", 2.6], ["Holy Trinity (Masaccio)", "Early Renaissance", 2.6], ["The Battle of San Romano", "Early Renaissance", 2.4], ["Lamentation over the Dead Christ", "Early Renaissance", 2.8], ["Madonna with the Long Neck", "Mannerism", 2.8], ["An Allegory with Venus and Cupid", "Mannerism", 2.8], ["The Wedding Feast at Cana", "Venetian Renaissance", 3], ["The Origin of the Milky Way", "Mannerism", 2.4], ["Assumption of the Virgin (Titian)", "Venetian Renaissance", 2.4],
  ["The Spinners (painting)", "Baroque", 2.4], ["Agnus Dei (Zurbarán)", "Baroque", 2.4], ["The Tower of Babel (Bruegel)", "Northern Renaissance", 3], ["The Triumph of Death", "Northern Renaissance", 2.8], ["The Syndics of the Drapers' Guild", "Baroque", 2.6], ["The Lacemaker (Vermeer)", "Baroque", 3], ["The Merry Drinker", "Baroque", 2.2], ["The Descent from the Cross (Rubens)", "Baroque", 2.6], ["The Three Graces (Rubens)", "Baroque", 2.8], ["Marriage A-la-Mode", "Rococo", 2.4], ["Mr and Mrs Andrews", "Rococo", 3], ["The Nightmare", "Romanticism", 3],
  ["The Abbey in the Oakwood", "Romanticism", 2.2], ["The Execution of Lady Jane Grey", "Academic art", 3.2], ["The Kiss (Hayez)", "Romanticism", 3], ["Isle of the Dead (painting)", "Symbolism", 3], ["Pollice Verso", "Academic art", 2.8], ["The Roses of Heliogabalus", "Academic art", 2.4], ["The Third-Class Carriage", "Realism", 2.4], ["The Balcony (Manet)", "Realism", 2.4], ["The Execution of Emperor Maximilian", "Realism", 2.6],
  ["Two Sisters (On the Terrace)", "Impressionism", 2.4], ["The Dance Class", "Impressionism", 2.8], ["Blue Dancers", "Impressionism", 2.2], ["The Circus (Seurat)", "Neo-Impressionism", 2.4], ["The Large Bathers", "Post-Impressionism", 2.8], ["Still Life with Apples and Oranges", "Post-Impressionism", 2.4],
  ["La Berceuse (Van Gogh)", "Post-Impressionism", 2.6], ["Portrait of Père Tanguy", "Post-Impressionism", 2.4], ["Road with Cypress and Star", "Post-Impressionism", 2.6], ["The Red Vineyard", "Post-Impressionism", 2.6], ["Prisoners Exercising", "Post-Impressionism", 2.2], ["Spirit of the Dead Watching", "Post-Impressionism", 2.6], ["The Snake Charmer (Rousseau)", "Naïve art", 2.6], ["War (Rousseau)", "Naïve art", 2.2],
  ["Death and Life (Klimt)", "Symbolism", 2.6], ["The Three Ages of Woman", "Symbolism", 2.4], ["Anxiety (Munch)", "Expressionism", 2.4], ["The Dance of Life", "Expressionism", 2.4], ["Embrace (Schiele)", "Expressionism", 2.4], ["Portrait of Wally", "Expressionism", 2.4], ["Christ's Entry into Brussels in 1889", "Symbolism", 2.8],
  ["Twittering Machine", "Expressionism", 3], ["Senecio (Klee)", "Expressionism", 2.4], ["Blue Horse I", "Expressionism", 3], ["Fate of the Animals", "Expressionism", 2.2], ["Blue Nude (Souvenir de Biskra)", "Fauvism", 2.6], ["The Red Studio", "Fauvism", 2.8], ["White on White (Malevich)", "Suprematism", 2.6],
  ["Symphony in White, No. 1", "Aestheticism", 2.4], ["The Daughters of Edward Darley Boit", "Realism", 2.6], ["Breezing Up (A Fair Wind)", "Realism", 2.4], ["The Oxbow (painting)", "Hudson River School", 2.8], ["Heart of the Andes", "Hudson River School", 2.4],
  ["Barge Haulers on the Volga", "Russian Realism", 3], ["Reply of the Zaporozhian Cossacks", "Russian Realism", 2.6], ["Three Bogatyrs", "Russian Realism", 2.4], ["Ivan the Terrible and His Son Ivan", "Russian Realism", 2.4], ["Boyarynya Morozova", "Russian Realism", 2.2],
  ["Madonna Litta", "High Renaissance", 2.2], ["Melencolia I", "Northern Renaissance", 3], ["Knight, Death and the Devil", "Northern Renaissance", 2.6], ["Dürer's Rhinoceros", "Northern Renaissance", 3], ["Portrait of Henry VIII (Holbein)", "Northern Renaissance", 2.8], ["Ship of Fools (painting)", "Early Netherlandish", 2.4], ["Descent from the Cross (van der Weyden)", "Early Netherlandish", 2.8], ["Madonna of Chancellor Rolin", "Early Netherlandish", 2.4],
  // batch 3
  ["The Last Supper (Leonardo)", "High Renaissance", 4], ["Sistine Chapel ceiling", "High Renaissance", 3.4], ["Landscape with the Fall of Icarus", "Northern Renaissance", 3], ["The Fall of the Rebel Angels", "Northern Renaissance", 2.4], ["The Blind Leading the Blind", "Northern Renaissance", 2.4],
  ["Girl Reading a Letter at an Open Window", "Baroque", 2.8], ["The Astronomer (Vermeer)", "Baroque", 2.6], ["Officer and Laughing Girl", "Baroque", 2.4], ["The Girl with the Wine Glass", "Baroque", 2.2], ["Self-Portrait (Leyster)", "Baroque", 2.2],
  ["Little Girl in a Blue Armchair", "Impressionism", 2.6], ["The Boating Party", "Impressionism", 2.6], ["Summer's Day (Morisot)", "Impressionism", 2.4], ["Flaming June", "Academic art", 3], ["The Birth of Venus (Cabanel)", "Academic art", 2.8], ["The Birth of Venus (Bouguereau)", "Academic art", 2.6],
  ["Fine Wind, Clear Morning", "Ukiyo-e", 3.4], ["Plum Park in Kameido", "Ukiyo-e", 2.4], ["The Artist's Studio", "Realism", 2.4], ["The Stone Breakers", "Realism", 2.4], ["Whistlejacket", "Rococo", 2.4], ["Salisbury Cathedral from the Meadows", "Romanticism", 2.4],
  ["Adam and Eve (Cranach)", "Northern Renaissance", 2.2], ["Tree of Life (Klimt)", "Symbolism", 2.6], ["The Large Blue Horses", "Expressionism", 2.4], ["The Tower of Blue Horses", "Expressionism", 2.6],
  ["Mystical Nativity", "Early Renaissance", 2.2], ["The Triumph of Galatea", "High Renaissance", 2.4], ["Boy with a Basket of Fruit", "Baroque", 2.2], ["Death of the Virgin (Caravaggio)", "Baroque", 2.4], ["Conversion on the Way to Damascus (Caravaggio)", "Baroque", 2.4], ["David with the Head of Goliath (Caravaggio)", "Baroque", 2.4], ["The Fortune Teller (Caravaggio)", "Baroque", 2.2],
);

// ---- batch 4: sculpture (≥25% target), famous ancient statues (no recorded creator), remaining priority paintings.
// Sculpture photos are usually CC BY / CC BY-SA (credited); anything not freely reusable is rejected automatically.
CANDIDATES.push(
  ["David (Michelangelo)", "High Renaissance", 4], ["Pietà (Michelangelo)", "High Renaissance", 3.8], ["Moses (Michelangelo)", "High Renaissance", 2.6], ["Bacchus (Michelangelo)", "High Renaissance", 2.2],
  ["The Burghers of Calais", "Modern sculpture", 3], ["The Kiss (Rodin)", "Modern sculpture", 3.8], ["The Gates of Hell", "Modern sculpture", 3.2], ["The Walking Man", "Modern sculpture", 2.4], ["The Cathedral (Rodin)", "Modern sculpture", 2.2],
  ["Ecstasy of Saint Teresa", "Baroque", 3.2], ["Apollo and Daphne (Bernini)", "Baroque", 3.2], ["The Rape of Proserpina", "Baroque", 2.8], ["David (Bernini)", "Baroque", 2.6], ["Fontana dei Quattro Fiumi", "Baroque", 2.4], ["Bust of Louis XIV", "Baroque", 2.2],
  ["Perseus with the Head of Medusa", "Mannerism", 3], ["David (Donatello)", "Early Renaissance", 3], ["Equestrian Statue of Gattamelata", "Early Renaissance", 2.4],
  ["Psyche Revived by Cupid's Kiss", "Neoclassicism", 3.2], ["The Three Graces (Canova)", "Neoclassicism", 2.6], ["Perseus Triumphant", "Neoclassicism", 2.2],
  ["The Waltz (Claudel)", "Modern sculpture", 2.4], ["The Age of Maturity", "Modern sculpture", 2.2], ["Little Dancer of Fourteen Years", "Impressionism", 3.2],
  ["Winged Victory of Samothrace", "Ancient Greek art", 3.8], ["Venus de Milo", "Ancient Greek art", 4], ["Laocoön and His Sons", "Ancient Greek art", 3.2], ["Discobolus", "Ancient Greek art", 3.2], ["Apollo Belvedere", "Roman art", 2.8], ["Dying Gaul", "Ancient Greek art", 2.4], ["Charioteer of Delphi", "Ancient Greek art", 2.4], ["Farnese Hercules", "Roman art", 2.2],
  ["Augustus of Prima Porta", "Roman art", 3], ["Capitoline Wolf", "Roman art", 3], ["Equestrian Statue of Marcus Aurelius", "Roman art", 2.8], ["Bust of Nefertiti", "Egyptian art (New Kingdom)", 3.8], ["Great Buddha of Kamakura", "Kamakura-period art", 3], ["Nataraja", "Chola art", 2.6], ["Mask of Tutankhamun", "Egyptian art (New Kingdom)", 3.8],
  ["Composition with Red Blue and Yellow", "Modernism", 3], ["Broadway Boogie Woogie", "Modernism", 2.6], ["Yellow-Red-Blue", "Expressionism", 2.4], ["The Judgement of Paris (Rubens)", "Baroque", 2.4], ["Water Lilies", "Impressionism", 3.6], ["Rouen Cathedral (Monet)", "Impressionism", 2.6],
);

const apiCache = path.join(cache, "wiki-api");
fs.mkdirSync(apiCache, { recursive: true });
const keyOf = (url) => Buffer.from(url).toString("base64url").slice(-120) + "." + (url.length % 997);
async function getJson(url, tries = 6) {
  const file = path.join(apiCache, keyOf(url) + ".json");
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
  for (let i = 0; i < tries; i++) {
    try {
      await sleep(350);
      const r = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" } });
      if (r.status === 404) {
        fs.writeFileSync(file, "null");
        return null;
      }
      if (r.status === 429 || r.status >= 500) throw new Error(String(r.status));
      const j = await r.json();
      fs.writeFileSync(file, JSON.stringify(j));
      return j;
    } catch {
      await sleep(5000 * 2 ** i); // 5s, 10s, 20s… on rate limiting
    }
  }
  return null;
}
const enLabel = (e) => e?.labels?.en?.value ?? e?.labels?.mul?.value ?? null;

function cleanText(t) {
  return (t || "")
    .replace(/\s*\([^)]*[:;/][^)]*\)/g, "") // alternate names / IPA: (Italian: …)
    .replace(/\s*\((?:born|c\.|\d)[^)]*\)/gi, (m) => (/^\s*\(\d{3,4}\)\s*$/.test(m) ? m : "")) // life dates in parentheses
    .replace(/\s+/g, " ")
    .replace(/\s+([,.;])/g, "$1")
    .trim();
}
function sentences(text) {
  const parts = text.split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ“"‘'])/);
  const out = [];
  for (const p of parts) {
    if (out.length && /(\bc|\bca|\bSt|\bJr|\bSr|\bNo|\bvs|\bDr|\bMr|\bMrs|\bMs|\bfig|\b[A-Z])\.$/.test(out[out.length - 1])) out[out.length - 1] += " " + p;
    else out.push(p);
  }
  return out;
}
function take(text, maxChars, maxCount) {
  let out = "";
  let n = 0;
  for (const s of sentences(cleanText(text))) {
    if (n >= maxCount) break;
    if (out && (out + " " + s).length > maxChars) break;
    out = (out + " " + s).trim();
    n++;
  }
  return out;
}
const year = (v) => {
  const m = /^([+-])0*(\d{1,4})-/.exec(v?.time ?? "");
  return m ? (m[1] === "-" ? -1 : 1) * Number(m[2]) : null;
};
const periodOf = (y) => (y < 500 ? "Ancient" : y < 1400 ? "Medieval" : y < 1600 ? "Renaissance" : y < 1740 ? "Baroque" : y < 1815 ? "Enlightenment" : y < 1900 ? "19th Century" : y < 1945 ? "Modern" : "Contemporary");

async function wikidata(idList, props = "claims|labels|sitelinks") {
  const out = {};
  for (let i = 0; i < idList.length; i += 40) {
    const j = await getJson(`https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${idList.slice(i, i + 40).join("|")}&props=${props}&languages=en|fr&sitefilter=enwiki|frwiki&format=json`);
    Object.assign(out, j?.entities ?? {});
  }
  return out;
}
const claim = (e, p) => (e?.claims?.[p] ?? []).filter((c) => c.rank !== "deprecated");
const val = (e, p) => claim(e, p)[0]?.mainsnak?.datavalue?.value;
const ids = (e, p) => claim(e, p).map((c) => c.mainsnak?.datavalue?.value?.id).filter(Boolean);

// ---- 1. Wikipedia summaries → QIDs
const summaries = [];
for (const [title, movement, recog] of CANDIDATES) {
  const s = await getJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title.replace(/ /g, "_"))}`);
  if (!s || !s.wikibase_item || s.type === "disambiguation") {
    console.log("SKIP (no article):", title);
    continue;
  }
  summaries.push({ title, movement, recog, qid: s.wikibase_item, en: s });
}
console.log("articles found:", summaries.length, "/", CANDIDATES.length);

// ---- 2. Wikidata items
const items = await wikidata(summaries.map((s) => s.qid));
const creatorIds = [...new Set(summaries.flatMap((s) => ids(items[s.qid], "P170")))];
const creators = await wikidata(creatorIds);
const labelIds = [...new Set(summaries.flatMap((s) => [...ids(items[s.qid], "P276"), ...ids(items[s.qid], "P195"), ...ids(items[s.qid], "P186"), ...ids(items[s.qid], "P31")]))];
const labels = await wikidata(labelIds, "labels");
const label = (id) => enLabel(labels[id]);

// ---- 3. Commons image info
const fileOf = (s) => val(items[s.qid], "P18");
const files = summaries.map(fileOf).filter(Boolean);
const commons = {};
for (let i = 0; i < files.length; i += 30) {
  const batch = files.slice(i, i + 30);
  const j = await getJson(`https://commons.wikimedia.org/w/api.php?action=query&format=json&prop=imageinfo&iiprop=url|size|extmetadata&iiurlwidth=2600&titles=${encodeURIComponent(batch.map((f) => "File:" + f).join("|"))}`);
  for (const p of Object.values(j?.query?.pages ?? {})) {
    const key = (p.title ?? "").replace(/^File:/, "").replace(/_/g, " ");
    commons[key] = p.imageinfo?.[0];
  }
}

// ---- 4. assemble, validate, download
const existing = JSON.parse(fs.readFileSync(path.join(cache, "artworks.base.json"), "utf8"));
const usedTitles = new Set(existing.map((a) => norm(a.title)));
const out = [];
const fr = {};
const source = fs.existsSync(path.join(cache, "source-images.json")) ? JSON.parse(fs.readFileSync(path.join(cache, "source-images.json"), "utf8")) : {};
const rejected = [];

for (const s of summaries) {
  const e = items[s.qid];
  const reject = (why) => {
    rejected.push(`${s.title}: ${why}`);
    console.log("REJECT", s.title, "—", why);
  };
  // English Wikipedia article title without its disambiguation suffix ("Rokeby Venus", not a Wikidata label that may be in any language)
  const title = (s.en.title || "").replace(/\s*\([^)]*\)\s*$/, "").trim() || enLabel(e);
  if (!title) { reject("no English title"); continue; }
  const cids = ids(e, "P170");
  if (cids.length > 1) { reject("creator count " + cids.length); continue; }
  // no recorded creator is accepted only for ancient works (decided below, once the date is known)
  const c = cids.length ? creators[cids[0]] : null;
  const cName = c ? enLabel(c) : null;
  const death = c ? year(val(c, "P570")) : null;
  const birth = c ? year(val(c, "P569")) : null;
  if (c && (!cName || death === null || death > 1955)) { reject(`creator ${cName} died ${death} (not clearly public domain)`); continue; }
  let inc = claim(e, "P571")[0]?.mainsnak?.datavalue?.value;
  let y = year(inc);
  let precision = inc?.precision ?? 0;
  let span = 0;
  if (y === null) {
    // dated by a range (earliest / latest) instead of a single inception
    const a0 = year(val(e, "P1319"));
    const b0 = year(val(e, "P1326"));
    if (a0 !== null && b0 !== null && b0 >= a0 && b0 - a0 <= 30) {
      y = Math.round((a0 + b0) / 2);
      span = b0 - a0;
      precision = 9;
    }
  }
  const anon = !c;
  if (anon && (y === null || y > 1000)) { reject("no creator recorded and not an ancient work"); continue; }
  if (y === null || precision < (anon ? 7 : 8)) { reject("date too imprecise"); continue; }
  const fileName = fileOf(s);
  const info = fileName && commons[fileName.replace(/_/g, " ")];
  if (!info) { reject("no Commons image"); continue; }
  const lic = info.extmetadata?.LicenseShortName?.value ?? "";
  // Photographs of 3-D works belong to the photographer: for sculptures CC BY / CC BY-SA is accepted (credited in the
  // record and on the Credits page); every other category needs public domain / CC0.
  const kindsEarly = ids(e, "P31").map(label).filter(Boolean).join(" ").toLowerCase();
  const isSculpture = /sculpture|statue|relief|bust|monument|fountain/.test(kindsEarly);
  const pdOk = /public domain|\bpd\b|cc0/i.test(lic) && !/gfdl/i.test(lic) && !/cc[- ]by/i.test(lic);
  const ccOk = isSculpture && /^cc[- ]by(-sa)?[- ]\d/i.test(lic) && !/-nc|-nd/i.test(lic);
  if (!pdOk && !ccOk) { reject("image licence: " + lic); continue; }
  const photographer = (info.extmetadata?.Artist?.value ?? "").replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (Math.max(info.width, info.height) < 1500) { reject("image too small"); continue; }
  if (usedTitles.has(norm(title))) { reject("title already in dataset"); continue; }
  const frTitle = e.sitelinks?.frwiki?.title;
  const frSum = frTitle ? await getJson(`https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(frTitle.replace(/ /g, "_"))}`) : null;
  const enDesc = take(s.en.extract, 430, 3);
  const frDesc = frSum?.extract ? take(frSum.extract, 460, 3) : "";
  if (enDesc.length < 60 || frDesc.length < 60) { reject("no usable en/fr description"); continue; }

  const cEn = c?.sitelinks?.enwiki?.title;
  const cFr = c?.sitelinks?.frwiki?.title;
  const bioEn = cEn ? await getJson(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cEn.replace(/ /g, "_"))}`) : null;
  const bioFr = cFr ? await getJson(`https://fr.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(cFr.replace(/ /g, "_"))}`) : null;
  const artistBio = bioEn?.extract ? take(bioEn.extract, 380, 2) : null;
  const artistBioFr = bioFr?.extract ? take(bioFr.extract, 400, 2) : null;

  const mats = ids(e, "P186").map(label).filter(Boolean).map((l) => l.toLowerCase());
  const paint = mats.find((m) => /oil|tempera|fresco|watercolou?r|gouache|ink|woodblock|pastel|acrylic/.test(m));
  const support = mats.find((m) => /canvas|panel|wood|poplar|paper|silk|oak|copper|board/.test(m));
  const medium = paint && support ? `${paint.replace(/ paint$/, "")} on ${support}` : mats.join(", ") || null;
  const h = val(e, "P2048")?.amount;
  const w = val(e, "P2049")?.amount;
  const measurements = h && w ? `${Math.round(Math.abs(Number(h)))} × ${Math.round(Math.abs(Number(w)))} cm` : null;
  const museumId = ids(e, "P276")[0] ?? ids(e, "P195")[0];
  const museum = museumId ? label(museumId) : null;
  const kinds = ids(e, "P31").map(label).filter(Boolean).join(" ").toLowerCase();
  const printLike = mats.some((m) => /woodblock|print/.test(m)) || /print/.test(kinds);
  const category = isSculpture ? "sculpture" : /drawing/.test(kinds) ? "drawing" : printLike ? "printmaking" : "painting";

  const id = "wd-" + s.qid;
  const dest = path.join(work, id + ".jpg");
  if (!fs.existsSync(dest)) {
    let buf = null;
    for (let i = 0; i < 4 && !buf; i++) {
      await sleep(900);
      try {
        const r = await fetch(info.thumburl, { headers: { "User-Agent": UA } });
        if (!r.ok) throw new Error(String(r.status));
        buf = Buffer.from(await r.arrayBuffer());
      } catch {
        await sleep(4000 * (i + 1));
      }
    }
    if (!buf) { reject("image download failed"); continue; }
    await sharp(buf, { limitInputPixels: false }).rotate().resize({ width: 2600, height: 2600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 90 }).toFile(dest);
  }
  source[id] = { srcW: info.width, srcH: info.height, srcBytes: info.size ?? null, format: "jpeg" };
  usedTitles.add(norm(title));

  out.push({
    id,
    recog: s.recog,
    title,
    alternativeTitles: [],
    artist: cName,
    artistNationality: null,
    artistBirthYear: birth,
    artistDeathYear: death,
    artistBio,
    artistBioSource: artistBio ? { name: "Wikipedia — " + (bioEn?.title ?? cName), url: bioEn?.content_urls?.desktop?.page ?? null, license: "CC BY-SA 4.0" } : null,
    creationYear: y,
    yearSpan: anon && precision < 9 ? 50 : precision >= 9 ? span : 10,
    dateDisplay: anon && precision < 9 ? (y < 0 ? `c. ${-y} BCE` : `c. ${y} CE`) : precision >= 9 ? (span ? `c. ${y}` : String(y)) : `${Math.floor(y / 10) * 10}s`,
    category,
    movement: s.movement,
    period: periodOf(y),
    difficulty: s.recog >= 3.4 ? "easy" : "intermediate",
    medium,
    culture: null,
    imageUrl: "/art/" + id + ".jpg",
    imageWidth: 0,
    imageHeight: 0,
    imageSource: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(fileName.replace(/ /g, "_"))}`,
    detail: { imageUrl: "", width: 0, height: 0, rect: { x: 0.3, y: 0.3, w: 0.4, h: 0.3 }, source: "" },
    description: enDesc,
    descriptionSource: { name: "Wikipedia — " + s.en.title, url: s.en.content_urls?.desktop?.page ?? null, license: "CC BY-SA 4.0" },
    interestingFacts: [],
    museum: museum ?? "Public collection",
    museumUrl: museumId ? `https://www.wikidata.org/wiki/${museumId}` : "https://www.wikidata.org",
    sourceUrl: s.en.content_urls?.desktop?.page ?? `https://www.wikidata.org/wiki/${s.qid}`,
    license: `Image: ${lic}${ccOk && photographer ? ", photo by " + photographer : ""} (Wikimedia Commons); text: Wikipedia, CC BY-SA 4.0`,
    tags: ["Wikidata " + s.qid],
    measurements,
  });
  fr[id] = { description: frDesc, ...(artistBioFr ? { artistBio: artistBioFr } : {}) };
  console.log("OK", s.title, "—", cName, y);
}

fs.writeFileSync(path.join(cache, "famous.base.json"), JSON.stringify(out, null, 1));
fs.writeFileSync(path.join(cache, "source-images.json"), JSON.stringify(source));
fs.writeFileSync(path.join(root, "scripts", "translations", "fr-wiki.json"), JSON.stringify(fr, null, 1));
fs.writeFileSync(path.join(cache, "famous.rejected.txt"), rejected.join("\n"));
console.log(`\nAdded ${out.length} works. Rejected ${rejected.length} (see scripts/.cache/famous.rejected.txt)`);
