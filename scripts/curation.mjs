// Phase 1 curation decisions. Every entry is a judgement made while auditing the 280 records
// against the museum's own record (scripts/.cache/records.json) and by looking at every image.
// Nothing here invents facts: movement labels for anonymous works are derived from the museum's
// own `culture` field; for artists whose label is genuinely contested for a given work we set null
// (the UI then falls back to the period) rather than guess.
// ids are Cleveland object ids (without the "cma-" prefix).

/** Records removed from the dataset. */
export const REMOVE = {
  101360: "Generic title ('Trial Piece Worked on Both Sides'), obscure sculptor's exercise, poor quiz material",
  147411: "Near-duplicate of 147410 (same Ōkyo screens; single panel photographed separately)",
  148391: "Near-duplicate: one sheet of the Utamaro triptych whose centre sheet (148392) is kept; '(right)' title is ambiguous",
  132646: "Image is essentially a blank sheet ('Three Sketches of Arches (verso)'); unsuitable for any mode",
};

/** Per-artwork movement. null = no reliable label for this work (UI shows the period instead). */
export const MOVEMENT = {
  // wrong: 'Raphael' substring matched 'Anton Raphael Mengs'
  142311: "Neoclassicism",
  // Veronese is a Venetian Late Renaissance painter, not High Renaissance
  109507: "Venetian Renaissance",
  118664: "Venetian Renaissance",
  // early works made before the artist's mature style (artist-level label was misleading)
  163547: "Realism", // Degas, etching 1857
  128808: "Realism", // Degas, studies 1858
  121188: "Realism", // Renoir, 1864 (pre-Impressionist)
  135286: "Realism", // Van Gogh, 1883 Dutch period
  // contested or period-spanning: do not guess
  147607: null, // Chardin
  150115: null, // Chardin
  127537: null, // Copley, 1812 (English period)
  100489: null, // Stuart, Dublin 1789
  103366: null, // Stuart, c.1803–5
  120435: null, // Piranesi, Carceri
  156646: null, // Maillol, wood engravings
  160078: null, // Maillol, wood engravings
  112062: null, // Hubert Robert
  128876: null, // Hubert Robert
  // 1803 Clodion is Neoclassical, not Rococo
  138880: "Neoclassicism",
  // anonymous works: label from the museum's own culture / period field
  105540: "Ancient Greek art",
  130360: "Archaic Greek art",
  161695: "Archaic Greek art",
  124135: "Etruscan art",
  130359: "Etruscan art",
  110232: "Roman art",
  142647: "Roman art",
  141643: "Early Christian art", // was 'Medieval' but dated 280–90 CE
  145925: "Roman Egyptian art", // Fayum-type portrait, Roman period Egypt
  130133: "Egyptian art (New Kingdom)",
  136667: "Egyptian art (New Kingdom)",
  136942: "Egyptian art (New Kingdom)",
  136482: "Egyptian art (Middle Kingdom)",
  122979: "Neo-Assyrian art",
  146146: "Hittite art",
  106841: "Gothic art",
  112877: "Romanesque art",
  112958: "Romanesque art",
  112971: "Gothic art",
  159234: "Medieval Italian painting",
  128067: "Asuka-period art",
  137057: "Heian-period art",
  129862: "Kamakura-period art",
  134430: "Kamakura-period art",
  114776: "Muromachi-period art",
  130638: "Muromachi-period art",
  123616: "Qing dynasty art",
  145937: "Qing dynasty art",
  135007: "Ming dynasty art",
  134843: "Song dynasty art",
  145010: "Song dynasty art",
  161427: "Tang dynasty art",
  93992: "Northern Dynasties art",
  94676: "Northern Dynasties art",
  112858: "Rajput painting",
  113026: "Pahari painting",
  115987: "Pahari painting",
  114975: "Champa art",
  144058: "Indian Buddhist art",
  147449: "Chola art",
  123985: "Seljuq art",
  98300: "Seljuq art",
  94963: "Ilkhanid art",
  95149: "Ottoman art",
  97193: "Ottoman art",
  138881: "Teotihuacan art",
  143381: "Maya art",
  155499: "Akan art",
  163543: "Luba art",
  168747: "Songye art",
  94940: "Central African art",
};

/** Category corrections (museum 'type' is a cataloguing class, not always the right visual-art category). */
export const CATEGORY = {
  173263: "painting", // Toulouse-Lautrec: oil and tempera on millboard, catalogued as a drawing
  148697: "printmaking", // Hiroshige illustrated set of woodblock-printed books
};

/**
 * Public recognisability 0..4 (how likely a general art-curious player is to know THIS work,
 * not the artist). Only works where the default for the artist tier is clearly wrong are listed.
 *   4 = iconic, 3 = widely reproduced, 2 = known to enthusiasts, 1 = specialist, 0 = obscure.
 */
export const RECOGNIZABILITY = {
  97797: 4, // Rodin, The Thinker
  111654: 4, // Hokusai, South Wind, Clear Sky (Red Fuji)
  325449: 4, // Stieglitz, The Steerage
  136510: 3.4, // Monet, Water Lilies
  135185: 3.4, // Cézanne, Mount Sainte-Victoire
  172659: 3.4, // Degas, dancer bronze
  125249: 3.2, // Van Gogh, Large Plane Trees
  148758: 3, // Caravaggio, Crucifixion of St Andrew
  138464: 3, // David, Cupid and Psyche
  135382: 3, // Monet, The Red Kerchief
  106785: 3, // Daumier, Rue Transnonain
  114751: 3, // Rembrandt, Self-Portrait Drawing at a Window
  135706: 3, // Rembrandt, The Three Crosses
  126085: 3, // Van Gogh, Dr. Gachet etching
  136154: 3, // Munch, Evening, Melancholy I
  98627: 3, // Rodin, Age of Bronze
  141639: 2.6, // Church, Twilight in the Wilderness
  151904: 2.6, // Eakins, Biglin Brothers
  102578: 2.6, // Chase, Dora Wheeler
  151336: 2.6, // Munch, The Sin
  133653: 2.6, // Goya, Caprichos
  122918: 2.6, // Ingres, Odalisque
  120238: 2.6, // Hokusai, Nakahara
  108103: 2.6, // Dürer, St Jerome
  128072: 2.6, // Morisot, Reading
  121188: 2.6, // Renoir, Romaine Lacaux
  135299: 2.6, // Van Gogh, Adeline Ravoux
  125247: 2.6, // Rubens, Isabella Brant
  150389: 2.6, // Poussin, Holy Family on the Steps
  129386: 2.6, // El Greco, Christ on the Cross
  131819: 2.4, // Van Dyck, Genoese Lady
  106841: 2.4, // Table Fountain
  145925: 2.4, // Fayum-type portrait
  141643: 2.4, // Jonah Swallowed
  // obscure works by famous artists (sketches, studies, versos, minor prints)
  135286: 1, // Van Gogh, watercolour landscape
  128808: 0.8, // Degas, sheet of studies
  163547: 1.4, // Degas, self-portrait etching (generic title)
  140325: 0.8, // Géricault, sheet of sketches
  119616: 1.6, // Michelangelo, figure studies
  127561: 1.4, // Blake, Holy Family
  101646: 1.6, // Cassatt, After the Bath
  159988: 1.4, // Sargent, studies for Gassed
  124814: 1.8, // Sargent, The Patio
  74601: 1, // Delacroix, Two Boats
  95259: 1.4, // Delacroix, Greek Cavalry
  156646: 0.6,
  160078: 0.6,
  127235: 1,
  161273: 0.8,
  // famous-artist works whose title/composition is not distinctive
  129219: 1.2, // Crivelli, St Nicholas
  127571: 1.4, // Lotto portrait
  146469: 1.4, // Bronzino, Portrait of a Woman
  128394: 1.4, // Modigliani, Portrait of a Woman
  124092: 0.8, // ter Borch, Portrait of a Woman
};

/** Titles too generic to be a fair multiple-choice answer (the object type, not a title). */
export const TITLE_QUIZ_OFF = {
  163547: "'Self-Portrait' – many artists made one",
  110232: "'Sarcophagus' – object type, not a title",
  163543: "'Staff of Office' – object type",
  123616: "'Amphora Vase' – object type",
  134843: "'Brush Washer' – object type",
  114776: "'Horse Stable' – subject, not a distinctive title",
  144058: "'Standing Buddha' – very many works share it",
  97193: "'Matchlock Musket' – object type",
};

/** Artists whose typical medium is not painting (a painting by them is 'typical', other media are not). */
export const TYPICAL_MEDIA = {
  "Katsushika Hokusai": ["printmaking"],
  "Utagawa Hiroshige": ["printmaking"],
  "Utagawa Kuniyoshi": ["printmaking"],
  "Kitagawa Utamaro": ["printmaking"],
  "Suzuki Harunobu": ["printmaking"],
  "Tōshūsai Sharaku": ["printmaking"],
  "Albrecht Dürer": ["printmaking", "drawing", "painting"],
  "Lucas van Leyden": ["printmaking"],
  "Hendrick Goltzius": ["printmaking", "drawing"],
  "Andrea Mantegna": ["printmaking", "painting"],
  "Rembrandt van Rijn": ["painting", "printmaking", "drawing"],
  "Honoré Daumier": ["printmaking", "painting"],
  "Edvard Munch": ["painting", "printmaking"],
  "Henri de Toulouse-Lautrec": ["painting", "printmaking"],
  "Francisco de Goya": ["painting", "printmaking"],
  "Giovanni Battista Piranesi": ["printmaking"],
  "Auguste Rodin": ["sculpture"],
  "Edgar Degas": ["painting", "sculpture", "drawing"],
  "Michelangelo Buonarroti": ["drawing", "sculpture"],
  "Antonio Canova": ["sculpture"],
  "Jean-Antoine Houdon": ["sculpture"],
  "Clodion": ["sculpture"],
  "Antoine-Louis Barye": ["sculpture"],
  "Jean-Baptiste Carpeaux": ["sculpture"],
  "Tilman Riemenschneider": ["sculpture"],
  "Aristide Maillol": ["sculpture"],
  "Alfred Stieglitz": ["photography"],
  "Eugène Atget": ["photography"],
  "Nadar": ["photography"],
  "Julia Margaret Cameron": ["photography"],
  "Gustave Le Gray": ["photography"],
  "Roger Fenton": ["photography"],
  "William Henry Fox Talbot": ["photography"],
  "Gertrude Käsebier": ["photography"],
};

/** Artist fame (1 household name … 3 specialist), from the seed tiers. Used for the Artist mode. */
export const ARTIST_FAME = { 1: 3.2, 2: 2.0, 3: 0.8 };

/**
 * Verbatim museum text where the automatic sentence splitter cut a description at an initial ("J. M. W. Turner").
 * Source: the museum record's `description` field (first two sentences).
 */
export const DESCRIPTION_FIX = {
  117915:
    "Thomas Moran is especially well known for his sweeping views of remote areas in the American West. A gifted watercolorist who was deeply influenced by J. M. W. Turner, Moran found a realistic equivalent for the Englishman’s art in the strange hues of the mountains of Wyoming and Nevada, the bubbling springs and vaporous geysers of Yellowstone, and the fantastic rock formations of Arizona.",
};

/** Verbatim museum "did you know" text where the sentence splitter cut at initials ("J. H. Wade"). */
export const FACT_FIX = {
  123985: ["This is known as the Wade Cup, after J. H. Wade who bequeathed the funds for its acquisition"],
};
