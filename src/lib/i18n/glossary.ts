import type { Lang } from "./index";

/**
 * Art-historical vocabulary used by the dataset. Movement labels, periods, media and date phrasing come from the
 * data (in English); French renderings live here, in one place. Anything not listed falls back to the English
 * original rather than being machine-translated word by word.
 */
const MOVEMENTS_FR: Record<string, string> = {
  "19th-century portrait photography": "Photographie de portrait du XIXe siècle",
  "Academic art": "Art académique",
  Aestheticism: "Esthétisme",
  "Akan art": "Art akan",
  "American Colonial": "Art colonial américain",
  "American Impressionism": "Impressionnisme américain",
  "American Realism": "Réalisme américain",
  "Ancient Greek art": "Art grec antique",
  "Archaic Greek art": "Art grec archaïque",
  "Asuka-period art": "Art de l’époque d’Asuka",
  "Barbizon school": "École de Barbizon",
  Baroque: "Baroque",
  "Central African art": "Art d’Afrique centrale",
  "Champa art": "Art du Champā",
  "Chola art": "Art chola",
  "Danube school": "École du Danube",
  "Documentary photography": "Photographie documentaire",
  "Dutch Golden Age": "Siècle d’or néerlandais",
  "Early Christian art": "Art paléochrétien",
  "Early Netherlandish": "Primitifs flamands",
  "Early Renaissance": "Première Renaissance",
  "Early photography": "Débuts de la photographie",
  "Egyptian art (Middle Kingdom)": "Art égyptien (Moyen Empire)",
  "Egyptian art (New Kingdom)": "Art égyptien (Nouvel Empire)",
  "Etruscan art": "Art étrusque",
  Expressionism: "Expressionnisme",
  "Gothic art": "Art gothique",
  "Heian-period art": "Art de l’époque de Heian",
  "High Renaissance": "Haute Renaissance",
  "Hittite art": "Art hittite",
  "Hudson River School": "École du fleuve Hudson",
  "Ilkhanid art": "Art ilkhanide",
  Impressionism: "Impressionnisme",
  "Indian Buddhist art": "Art bouddhique indien",
  "Kamakura-period art": "Art de l’époque de Kamakura",
  "Late Gothic": "Gothique tardif",
  "Luba art": "Art luba",
  Luminism: "Luminisme",
  Mannerism: "Maniérisme",
  "Maruyama school": "École Maruyama",
  "Maya art": "Art maya",
  "Medieval Italian painting": "Peinture italienne médiévale",
  "Ming dynasty art": "Art de la dynastie Ming",
  "Modern sculpture": "Sculpture moderne",
  Modernism: "Modernisme",
  "Muromachi-period art": "Art de l’époque de Muromachi",
  "Naïve art": "Art naïf",
  "Neo-Assyrian art": "Art néo-assyrien",
  "Neo-Impressionism": "Néo-impressionnisme",
  Neoclassicism: "Néoclassicisme",
  "Northern Dynasties art": "Art des dynasties du Nord",
  "Northern Mannerism": "Maniérisme nordique",
  "Northern Renaissance": "Renaissance nordique",
  "Ottoman art": "Art ottoman",
  "Pahari painting": "Peinture pahari",
  Pictorialism: "Pictorialisme",
  "Pre-Raphaelite": "Préraphaélisme",
  Suprematism: "Suprématisme",
  Cubism: "Cubisme",
  "Post-Impressionism": "Post-impressionnisme",
  "Qing dynasty art": "Art de la dynastie Qing",
  "Rajput painting": "Peinture rajput",
  Realism: "Réalisme",
  "Rinpa school": "École Rinpa",
  Rococo: "Rococo",
  "Roman Egyptian art": "Art de l’Égypte romaine",
  "Roman art": "Art romain",
  "Romanesque art": "Art roman",
  Romanticism: "Romantisme",
  "Second Empire sculpture": "Sculpture du Second Empire",
  "Seljuq art": "Art seldjoukide",
  Sentimentalism: "Sentimentalisme",
  "Song dynasty art": "Art de la dynastie Song",
  "Songye art": "Art songye",
  Symbolism: "Symbolisme",
  "Tang dynasty art": "Art de la dynastie Tang",
  "Teotihuacan art": "Art de Teotihuacan",
  Tonalism: "Tonalisme",
  "Trompe-l'œil": "Trompe-l’œil",
  "Ukiyo-e": "Ukiyo-e",
  "Veduta painting": "Peinture de vedute",
  "Venetian Renaissance": "Renaissance vénitienne",
  "Victorian photography": "Photographie victorienne",
};

const PERIODS_FR: Record<string, string> = {
  Ancient: "Antiquité",
  Medieval: "Moyen Âge",
  Renaissance: "Renaissance",
  Baroque: "Époque baroque",
  Enlightenment: "Siècle des Lumières",
  "19th Century": "XIXe siècle",
  Modern: "Début du XXe siècle",
  Contemporary: "Époque contemporaine",
};

const MEDIA_FR: Record<string, string> = {
  "oil on canvas": "huile sur toile",
  "oil on fabric": "huile sur toile",
  "oil on wood": "huile sur bois",
  "oil on wood panel": "huile sur panneau de bois",
  "oil on board": "huile sur carton",
  etching: "eau-forte",
  "etching and drypoint": "eau-forte et pointe sèche",
  "etching, drypoint, and engraving": "eau-forte, pointe sèche et burin",
  drypoint: "pointe sèche",
  engraving: "gravure au burin",
  woodcut: "gravure sur bois",
  "woodcut on pink paper": "gravure sur bois sur papier rose",
  "wood engraving": "gravure sur bois de bout",
  lithograph: "lithographie",
  "color lithograph": "lithographie en couleurs",
  "color woodblock print": "gravure sur bois en couleurs",
  "triptych of color woodblock prints": "triptyque de gravures sur bois en couleurs",
  bronze: "bronze",
  terracotta: "terre cuite",
  marble: "marbre",
  "greek marble": "marbre grec",
  limestone: "calcaire",
  granodiorite: "granodiorite",
  plaster: "plâtre",
  ceramic: "céramique",
  porcelain: "porcelaine",
  pastel: "pastel",
  "pastel on brown paper": "pastel sur papier brun",
  "red chalk": "sanguine",
  "black chalk": "pierre noire",
  "graphite on cream wove paper": "graphite sur papier vélin crème",
  watercolor: "aquarelle",
  "albumen print, gold toned": "tirage à l’albumine, virage à l’or",
  "albumen print from wet collodion negative": "tirage à l’albumine d’après un négatif au collodion humide",
  "salted paper print from calotype negative": "tirage sur papier salé d’après un négatif au calotype",
  "platinum print": "tirage au platine",
  photogravure: "photogravure",
  "lindenwood with polychromy and gilding": "bois de tilleul polychrome et doré",
  "gum tempera on paper": "détrempe à la gomme sur papier",
  "gum tempera and gold on paper": "détrempe à la gomme et or sur papier",
  "cliché-verre": "cliché-verre",
};

const lc = (s: string) => s.trim().toLowerCase();

export function movementLabel(lang: Lang, m: string | null): string | null {
  if (!m) return null;
  return lang === "fr" ? (MOVEMENTS_FR[m] ?? m) : m;
}

export function periodLabel(lang: Lang, p: string): string {
  return lang === "fr" ? (PERIODS_FR[p] ?? p) : p;
}

/** Exact-match translation of a medium; anything unknown keeps the museum's English wording. */
export function mediumLabel(lang: Lang, medium: string | null): string | null {
  if (!medium) return null;
  return lang === "fr" ? (MEDIA_FR[lc(medium)] ?? medium) : medium;
}

/** Translate the museum's English date phrasing ("c. 1750–55", "525–500 BCE", "early 1830s"…). */
export function dateLabel(lang: Lang, text: string): string {
  if (lang !== "fr") return text;
  let s = text;
  const rules: [RegExp, string][] = [
    [/\bearly to mid-(\d{3,4})s/gi, "début à milieu des années $1"],
    [/\bshortly after (\d{3,4})/gi, "peu après $1"],
    [/(\d{3,4}) or shortly after/gi, "$1 ou peu après"],
    [/\bafter c\. (\d{3,4})/gi, "après $1 environ"],
    [/\bafter (\d{3,4})/gi, "après $1"],
    [/\bearly (\d{3,4})s/gi, "début des années $1"],
    [/\bmid-(\d{3,4})s/gi, "milieu des années $1"],
    [/\blate (\d{3,4})s/gi, "fin des années $1"],
    [/\bprobably (\d{3,4})/gi, "probablement $1"],
    [/(\d{3,4}) or (\d{3,4})/gi, "$1 ou $2"],
    [/\bca\.\s*/gi, "vers "],
    [/\bc\.\s*/gi, "vers "],
    [/\bBCE\b/g, "av. J.-C."],
    [/\bCE\b/g, "apr. J.-C."],
    [/\bB\.C\.?/g, "av. J.-C."],
  ];
  for (const [re, rep] of rules) s = s.replace(re, rep);
  return s;
}
