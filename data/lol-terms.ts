export type WordDifficulty = "easy" | "medium" | "hard";

export type WordCategory =
  | "objective"
  | "map"
  | "vision"
  | "combat"
  | "macro"
  | "role"
  | "economy"
  | "item"
  | "status";

export type WordEntry = {
  word: string;
  category: WordCategory;
  difficulty: WordDifficulty;
  tags: string[];
};

export type WordPoolLocale = "en" | "fr";

const wordPoolEn: WordEntry[] = [
  { word: "Baron", category: "objective", difficulty: "easy", tags: ["epic", "monster"] },
  { word: "Dragon", category: "objective", difficulty: "easy", tags: ["epic", "monster"] },
  { word: "Herald", category: "objective", difficulty: "easy", tags: ["epic", "monster"] },
  { word: "Nexus", category: "objective", difficulty: "easy", tags: ["structure", "wincon"] },
  { word: "Turret", category: "objective", difficulty: "easy", tags: ["structure"] },
  { word: "Inhibitor", category: "objective", difficulty: "medium", tags: ["structure"] },
  { word: "Minion", category: "role", difficulty: "easy", tags: ["lane", "unit"] },
  { word: "Jungle", category: "map", difficulty: "easy", tags: ["terrain", "macro"] },
  { word: "River", category: "map", difficulty: "easy", tags: ["terrain"] },
  { word: "Brush", category: "map", difficulty: "easy", tags: ["terrain", "vision"] },
  { word: "Pit", category: "map", difficulty: "easy", tags: ["terrain", "objective"] },
  { word: "Tribush", category: "map", difficulty: "medium", tags: ["terrain", "vision"] },
  { word: "Lane", category: "map", difficulty: "easy", tags: ["macro"] },
  { word: "Top Lane", category: "map", difficulty: "easy", tags: ["lane"] },
  { word: "Mid Lane", category: "map", difficulty: "easy", tags: ["lane"] },
  { word: "Bot Lane", category: "map", difficulty: "easy", tags: ["lane"] },
  { word: "Base", category: "map", difficulty: "easy", tags: ["structure"] },
  { word: "Fountain", category: "map", difficulty: "easy", tags: ["structure", "spawn"] },
  { word: "Wall", category: "map", difficulty: "easy", tags: ["terrain"] },
  { word: "Camp", category: "map", difficulty: "easy", tags: ["jungle", "resource"] },
  { word: "Scuttle", category: "objective", difficulty: "medium", tags: ["jungle", "vision"] },
  { word: "Blue Buff", category: "objective", difficulty: "easy", tags: ["jungle", "buff"] },
  { word: "Red Buff", category: "objective", difficulty: "easy", tags: ["jungle", "buff"] },
  { word: "Soul", category: "objective", difficulty: "medium", tags: ["dragon", "wincon"] },
  { word: "Elder", category: "objective", difficulty: "medium", tags: ["dragon", "buff"] },
  { word: "Ward", category: "vision", difficulty: "easy", tags: ["tool", "support"] },
  { word: "Vision", category: "vision", difficulty: "easy", tags: ["macro"] },
  { word: "Oracle", category: "vision", difficulty: "medium", tags: ["tool", "sweep"] },
  { word: "Totem", category: "vision", difficulty: "easy", tags: ["ward", "tool"] },
  { word: "Sweep", category: "vision", difficulty: "easy", tags: ["deny", "vision"] },
  { word: "Control Ward", category: "vision", difficulty: "medium", tags: ["ward", "deny"] },
  { word: "Fog", category: "vision", difficulty: "medium", tags: ["vision", "map"] },
  { word: "Ambush", category: "vision", difficulty: "medium", tags: ["combat", "pick"] },
  { word: "Gank", category: "combat", difficulty: "easy", tags: ["action", "jungle"] },
  { word: "Roam", category: "macro", difficulty: "easy", tags: ["action", "map"] },
  { word: "Recall", category: "macro", difficulty: "easy", tags: ["action", "tempo"] },
  { word: "Teleport", category: "macro", difficulty: "easy", tags: ["spell", "movement"] },
  { word: "Smite", category: "combat", difficulty: "easy", tags: ["spell", "jungle"] },
  { word: "Ignite", category: "combat", difficulty: "easy", tags: ["spell", "damage"] },
  { word: "Flash", category: "combat", difficulty: "easy", tags: ["spell", "mobility"] },
  { word: "Exhaust", category: "combat", difficulty: "medium", tags: ["spell", "utility"] },
  { word: "Heal", category: "combat", difficulty: "easy", tags: ["spell", "support"] },
  { word: "Cleanse", category: "combat", difficulty: "medium", tags: ["spell", "utility"] },
  { word: "Barrier", category: "combat", difficulty: "easy", tags: ["spell", "defense"] },
  { word: "Ghost", category: "combat", difficulty: "easy", tags: ["spell", "mobility"] },
  { word: "Trade", category: "combat", difficulty: "easy", tags: ["lane", "action"] },
  { word: "Burst", category: "combat", difficulty: "easy", tags: ["damage"] },
  { word: "Peel", category: "combat", difficulty: "medium", tags: ["defense", "support"] },
  { word: "Dive", category: "combat", difficulty: "medium", tags: ["action", "tower"] },
  { word: "Siege", category: "combat", difficulty: "medium", tags: ["objective", "push"] },
  { word: "Outplay", category: "combat", difficulty: "medium", tags: ["skill", "duel"] },
  { word: "Kiting", category: "combat", difficulty: "medium", tags: ["movement", "damage"] },
  { word: "Skirmish", category: "combat", difficulty: "medium", tags: ["fight", "small"] },
  { word: "Pick", category: "combat", difficulty: "medium", tags: ["fight", "catch"] },
  { word: "Engage", category: "combat", difficulty: "easy", tags: ["fight", "initiation"] },
  { word: "Disengage", category: "combat", difficulty: "medium", tags: ["fight", "reset"] },
  { word: "Combo", category: "combat", difficulty: "easy", tags: ["skill", "damage"] },
  { word: "Poke", category: "combat", difficulty: "easy", tags: ["range", "damage"] },
  { word: "Harass", category: "combat", difficulty: "medium", tags: ["lane", "pressure"] },
  { word: "All-In", category: "combat", difficulty: "medium", tags: ["fight", "commit"] },
  { word: "Zone", category: "combat", difficulty: "medium", tags: ["space", "control"] },
  { word: "CC", category: "status", difficulty: "easy", tags: ["control", "combat"] },
  { word: "Stun", category: "status", difficulty: "easy", tags: ["control"] },
  { word: "Root", category: "status", difficulty: "easy", tags: ["control"] },
  { word: "Silence", category: "status", difficulty: "medium", tags: ["control"] },
  { word: "Slow", category: "status", difficulty: "easy", tags: ["control"] },
  { word: "Knockup", category: "status", difficulty: "medium", tags: ["control"] },
  { word: "Charm", category: "status", difficulty: "medium", tags: ["control"] },
  { word: "Taunt", category: "status", difficulty: "medium", tags: ["control"] },
  { word: "Fear", category: "status", difficulty: "medium", tags: ["control"] },
  { word: "Shield", category: "status", difficulty: "easy", tags: ["defense", "support"] },
  { word: "Passive", category: "status", difficulty: "easy", tags: ["kit"] },
  { word: "Ultimate", category: "status", difficulty: "easy", tags: ["ability", "power"] },
  { word: "Cooldown", category: "status", difficulty: "easy", tags: ["timing"] },
  { word: "Scaling", category: "macro", difficulty: "medium", tags: ["tempo", "late"] },
  { word: "Snowball", category: "macro", difficulty: "medium", tags: ["lead", "tempo"] },
  { word: "Tempo", category: "macro", difficulty: "medium", tags: ["timing", "pressure"] },
  { word: "Pressure", category: "macro", difficulty: "easy", tags: ["map", "lane"] },
  { word: "Priority", category: "macro", difficulty: "medium", tags: ["lane", "tempo"] },
  { word: "Freeze", category: "macro", difficulty: "medium", tags: ["wave", "lane"] },
  { word: "Push", category: "macro", difficulty: "easy", tags: ["wave", "objective"] },
  { word: "Shove", category: "macro", difficulty: "medium", tags: ["wave", "lane"] },
  { word: "Waveclear", category: "macro", difficulty: "medium", tags: ["lane", "minion"] },
  { word: "Split Push", category: "macro", difficulty: "medium", tags: ["lane", "pressure"] },
  { word: "Rotation", category: "macro", difficulty: "medium", tags: ["map", "movement"] },
  { word: "Collapse", category: "macro", difficulty: "hard", tags: ["map", "catch"] },
  { word: "Flank", category: "macro", difficulty: "medium", tags: ["positioning", "fight"] },
  { word: "Setup", category: "macro", difficulty: "easy", tags: ["objective", "vision"] },
  { word: "Reset", category: "macro", difficulty: "easy", tags: ["tempo", "recall"] },
  { word: "Contest", category: "macro", difficulty: "medium", tags: ["objective", "fight"] },
  { word: "Secure", category: "macro", difficulty: "easy", tags: ["objective", "finish"] },
  { word: "Objective", category: "macro", difficulty: "easy", tags: ["macro", "goal"] },
  { word: "Teamfight", category: "macro", difficulty: "easy", tags: ["fight", "group"] },
  { word: "Gold", category: "economy", difficulty: "easy", tags: ["resource"] },
  { word: "Farm", category: "economy", difficulty: "easy", tags: ["resource", "lane"] },
  { word: "CS", category: "economy", difficulty: "easy", tags: ["farm", "lane"] },
  { word: "Bounty", category: "economy", difficulty: "medium", tags: ["reward", "kill"] },
  { word: "Shutdown", category: "economy", difficulty: "medium", tags: ["reward", "kill"] },
  { word: "Lead", category: "economy", difficulty: "easy", tags: ["advantage"] },
  { word: "Spike", category: "economy", difficulty: "medium", tags: ["power", "timing"] },
  { word: "Scaling Pick", category: "economy", difficulty: "hard", tags: ["draft", "late"] },
  { word: "Potion", category: "item", difficulty: "easy", tags: ["consumable"] },
  { word: "Boots", category: "item", difficulty: "easy", tags: ["movement"] },
  { word: "Elixir", category: "item", difficulty: "medium", tags: ["consumable", "late"] },
  { word: "Rune", category: "item", difficulty: "easy", tags: ["loadout"] },
  { word: "Keystone", category: "item", difficulty: "medium", tags: ["loadout"] },
  { word: "Zhonyas", category: "item", difficulty: "medium", tags: ["armor", "stasis"] },
  { word: "Infinity Edge", category: "item", difficulty: "medium", tags: ["crit", "damage"] },
  { word: "Last Whisper", category: "item", difficulty: "medium", tags: ["armor pen"] },
  { word: "Banshee", category: "item", difficulty: "medium", tags: ["shield", "mage"] },
  { word: "Guardian Angel", category: "item", difficulty: "medium", tags: ["revive", "defense"] },
  { word: "Quicksilver", category: "item", difficulty: "hard", tags: ["cleanse", "utility"] },
  { word: "Support", category: "role", difficulty: "easy", tags: ["class", "lane"] },
  { word: "Carry", category: "role", difficulty: "easy", tags: ["class", "damage"] },
  { word: "Tank", category: "role", difficulty: "easy", tags: ["class", "frontline"] },
  { word: "Bruiser", category: "role", difficulty: "easy", tags: ["class", "fighter"] },
  { word: "Mage", category: "role", difficulty: "easy", tags: ["class", "damage"] },
  { word: "Assassin", category: "role", difficulty: "easy", tags: ["class", "burst"] },
  { word: "Marksman", category: "role", difficulty: "medium", tags: ["class", "ranged"] },
  { word: "Enchanter", category: "role", difficulty: "medium", tags: ["class", "support"] },
  { word: "Frontline", category: "role", difficulty: "medium", tags: ["fight", "tank"] },
  { word: "Backline", category: "role", difficulty: "medium", tags: ["fight", "ranged"] },
  { word: "ADC", category: "role", difficulty: "easy", tags: ["class", "lane"] },
  { word: "Duel", category: "combat", difficulty: "easy", tags: ["fight", "1v1"] },
  { word: "Vision Trap", category: "vision", difficulty: "hard", tags: ["bait", "setup"] },
  { word: "Crossmap", category: "macro", difficulty: "hard", tags: ["trade", "objective"] },
  { word: "Power Spike", category: "economy", difficulty: "medium", tags: ["timing", "item"] },
  { word: "Win Condition", category: "macro", difficulty: "hard", tags: ["strategy", "goal"] },
  { word: "Draft", category: "macro", difficulty: "medium", tags: ["champ select", "strategy"] },
  { word: "Counterpick", category: "macro", difficulty: "hard", tags: ["draft", "lane"] },
  { word: "Side Lane", category: "map", difficulty: "medium", tags: ["macro", "lane"] },
  { word: "Anchor", category: "macro", difficulty: "hard", tags: ["positioning", "support"] },
  { word: "Discipline", category: "macro", difficulty: "hard", tags: ["concept", "teamplay"] },
  { word: "Momentum", category: "economy", difficulty: "medium", tags: ["tempo", "concept"] },
];

const wordPoolFr: WordEntry[] = [
  { word: "Baron", category: "objective", difficulty: "easy", tags: ["epique", "monstre"] },
  { word: "Dragon", category: "objective", difficulty: "easy", tags: ["epique", "monstre"] },
  { word: "Heraut", category: "objective", difficulty: "easy", tags: ["epique", "monstre"] },
  { word: "Nexus", category: "objective", difficulty: "easy", tags: ["structure", "victoire"] },
  { word: "Tourelle", category: "objective", difficulty: "easy", tags: ["structure"] },
  { word: "Inhibiteur", category: "objective", difficulty: "medium", tags: ["structure"] },
  { word: "Sbire", category: "role", difficulty: "easy", tags: ["lane", "unite"] },
  { word: "Jungle", category: "map", difficulty: "easy", tags: ["terrain", "macro"] },
  { word: "Riviere", category: "map", difficulty: "easy", tags: ["terrain"] },
  { word: "Buisson", category: "map", difficulty: "easy", tags: ["terrain", "vision"] },
  { word: "Fosse", category: "map", difficulty: "easy", tags: ["terrain", "objectif"] },
  { word: "Tribush", category: "map", difficulty: "medium", tags: ["terrain", "vision"] },
  { word: "Ligne", category: "map", difficulty: "easy", tags: ["macro"] },
  { word: "Top", category: "map", difficulty: "easy", tags: ["lane"] },
  { word: "Mid", category: "map", difficulty: "easy", tags: ["lane"] },
  { word: "Bot", category: "map", difficulty: "easy", tags: ["lane"] },
  { word: "Base", category: "map", difficulty: "easy", tags: ["structure"] },
  { word: "Fontaine", category: "map", difficulty: "easy", tags: ["structure", "spawn"] },
  { word: "Mur", category: "map", difficulty: "easy", tags: ["terrain"] },
  { word: "Camp", category: "map", difficulty: "easy", tags: ["jungle", "ressource"] },
  { word: "Crabe", category: "objective", difficulty: "medium", tags: ["jungle", "vision"] },
  { word: "Buff bleu", category: "objective", difficulty: "easy", tags: ["jungle", "buff"] },
  { word: "Buff rouge", category: "objective", difficulty: "easy", tags: ["jungle", "buff"] },
  { word: "Ame", category: "objective", difficulty: "medium", tags: ["dragon", "victoire"] },
  { word: "Elder", category: "objective", difficulty: "medium", tags: ["dragon", "buff"] },
  { word: "Ward", category: "vision", difficulty: "easy", tags: ["outil", "support"] },
  { word: "Vision", category: "vision", difficulty: "easy", tags: ["macro"] },
  { word: "Oracle", category: "vision", difficulty: "medium", tags: ["outil", "sweep"] },
  { word: "Totem", category: "vision", difficulty: "easy", tags: ["ward", "outil"] },
  { word: "Sweep", category: "vision", difficulty: "easy", tags: ["deny", "vision"] },
  { word: "Control Ward", category: "vision", difficulty: "medium", tags: ["ward", "deny"] },
  { word: "Brouillard", category: "vision", difficulty: "medium", tags: ["vision", "map"] },
  { word: "Embuscade", category: "vision", difficulty: "medium", tags: ["combat", "pick"] },
  { word: "Gank", category: "combat", difficulty: "easy", tags: ["action", "jungle"] },
  { word: "Roam", category: "macro", difficulty: "easy", tags: ["action", "map"] },
  { word: "Recall", category: "macro", difficulty: "easy", tags: ["action", "tempo"] },
  { word: "Teleportation", category: "macro", difficulty: "easy", tags: ["sort", "mouvement"] },
  { word: "Smite", category: "combat", difficulty: "easy", tags: ["sort", "jungle"] },
  { word: "Ignite", category: "combat", difficulty: "easy", tags: ["sort", "degats"] },
  { word: "Flash", category: "combat", difficulty: "easy", tags: ["sort", "mobilite"] },
  { word: "Exhaust", category: "combat", difficulty: "medium", tags: ["sort", "utilite"] },
  { word: "Soin", category: "combat", difficulty: "easy", tags: ["sort", "support"] },
  { word: "Cleanse", category: "combat", difficulty: "medium", tags: ["sort", "utilite"] },
  { word: "Barriere", category: "combat", difficulty: "easy", tags: ["sort", "defense"] },
  { word: "Ghost", category: "combat", difficulty: "easy", tags: ["sort", "mobilite"] },
  { word: "Trade", category: "combat", difficulty: "easy", tags: ["lane", "action"] },
  { word: "Burst", category: "combat", difficulty: "easy", tags: ["degats"] },
  { word: "Peel", category: "combat", difficulty: "medium", tags: ["defense", "support"] },
  { word: "Dive", category: "combat", difficulty: "medium", tags: ["action", "tower"] },
  { word: "Siege", category: "combat", difficulty: "medium", tags: ["objectif", "push"] },
  { word: "Outplay", category: "combat", difficulty: "medium", tags: ["skill", "duel"] },
  { word: "Kiting", category: "combat", difficulty: "medium", tags: ["mouvement", "degats"] },
  { word: "Escarmouche", category: "combat", difficulty: "medium", tags: ["fight", "small"] },
  { word: "Pick", category: "combat", difficulty: "medium", tags: ["fight", "catch"] },
  { word: "Engage", category: "combat", difficulty: "easy", tags: ["fight", "initiation"] },
  { word: "Desengage", category: "combat", difficulty: "medium", tags: ["fight", "reset"] },
  { word: "Combo", category: "combat", difficulty: "easy", tags: ["skill", "degats"] },
  { word: "Poke", category: "combat", difficulty: "easy", tags: ["distance", "degats"] },
  { word: "Harcèlement", category: "combat", difficulty: "medium", tags: ["lane", "pression"] },
  { word: "All-In", category: "combat", difficulty: "medium", tags: ["fight", "commit"] },
  { word: "Zone", category: "combat", difficulty: "medium", tags: ["espace", "controle"] },
  { word: "CC", category: "status", difficulty: "easy", tags: ["controle", "combat"] },
  { word: "Stun", category: "status", difficulty: "easy", tags: ["controle"] },
  { word: "Root", category: "status", difficulty: "easy", tags: ["controle"] },
  { word: "Silence", category: "status", difficulty: "medium", tags: ["controle"] },
  { word: "Slow", category: "status", difficulty: "easy", tags: ["controle"] },
  { word: "Knockup", category: "status", difficulty: "medium", tags: ["controle"] },
  { word: "Charme", category: "status", difficulty: "medium", tags: ["controle"] },
  { word: "Provocation", category: "status", difficulty: "medium", tags: ["controle"] },
  { word: "Fear", category: "status", difficulty: "medium", tags: ["controle"] },
  { word: "Bouclier", category: "status", difficulty: "easy", tags: ["defense", "support"] },
  { word: "Passif", category: "status", difficulty: "easy", tags: ["kit"] },
  { word: "Ultime", category: "status", difficulty: "easy", tags: ["ability", "power"] },
  { word: "Cooldown", category: "status", difficulty: "easy", tags: ["timing"] },
  { word: "Scaling", category: "macro", difficulty: "medium", tags: ["tempo", "late"] },
  { word: "Snowball", category: "macro", difficulty: "medium", tags: ["lead", "tempo"] },
  { word: "Tempo", category: "macro", difficulty: "medium", tags: ["timing", "pression"] },
  { word: "Pression", category: "macro", difficulty: "easy", tags: ["map", "lane"] },
  { word: "Priorite", category: "macro", difficulty: "medium", tags: ["lane", "tempo"] },
  { word: "Freeze", category: "macro", difficulty: "medium", tags: ["wave", "lane"] },
  { word: "Push", category: "macro", difficulty: "easy", tags: ["wave", "objectif"] },
  { word: "Shove", category: "macro", difficulty: "medium", tags: ["wave", "lane"] },
  { word: "Waveclear", category: "macro", difficulty: "medium", tags: ["lane", "minion"] },
  { word: "Split Push", category: "macro", difficulty: "medium", tags: ["lane", "pression"] },
  { word: "Rotation", category: "macro", difficulty: "medium", tags: ["map", "mouvement"] },
  { word: "Collapse", category: "macro", difficulty: "hard", tags: ["map", "catch"] },
  { word: "Flank", category: "macro", difficulty: "medium", tags: ["position", "fight"] },
  { word: "Setup", category: "macro", difficulty: "easy", tags: ["objectif", "vision"] },
  { word: "Reset", category: "macro", difficulty: "easy", tags: ["tempo", "recall"] },
  { word: "Contest", category: "macro", difficulty: "medium", tags: ["objectif", "fight"] },
  { word: "Secure", category: "macro", difficulty: "easy", tags: ["objectif", "finish"] },
  { word: "Objectif", category: "macro", difficulty: "easy", tags: ["macro", "goal"] },
  { word: "Teamfight", category: "macro", difficulty: "easy", tags: ["fight", "group"] },
  { word: "Or", category: "economy", difficulty: "easy", tags: ["ressource"] },
  { word: "Farm", category: "economy", difficulty: "easy", tags: ["ressource", "lane"] },
  { word: "CS", category: "economy", difficulty: "easy", tags: ["farm", "lane"] },
  { word: "Prime", category: "economy", difficulty: "medium", tags: ["reward", "kill"] },
  { word: "Shutdown", category: "economy", difficulty: "medium", tags: ["reward", "kill"] },
  { word: "Avance", category: "economy", difficulty: "easy", tags: ["advantage"] },
  { word: "Spike", category: "economy", difficulty: "medium", tags: ["power", "timing"] },
  { word: "Pick scaling", category: "economy", difficulty: "hard", tags: ["draft", "late"] },
  { word: "Potion", category: "item", difficulty: "easy", tags: ["consommable"] },
  { word: "Bottes", category: "item", difficulty: "easy", tags: ["movement"] },
  { word: "Elixir", category: "item", difficulty: "medium", tags: ["consommable", "late"] },
  { word: "Rune", category: "item", difficulty: "easy", tags: ["loadout"] },
  { word: "Keystone", category: "item", difficulty: "medium", tags: ["loadout"] },
  { word: "Zhonyas", category: "item", difficulty: "medium", tags: ["armor", "stasis"] },
  { word: "Infinity Edge", category: "item", difficulty: "medium", tags: ["crit", "damage"] },
  { word: "Last Whisper", category: "item", difficulty: "medium", tags: ["armor pen"] },
  { word: "Banshee", category: "item", difficulty: "medium", tags: ["shield", "mage"] },
  { word: "Guardian Angel", category: "item", difficulty: "medium", tags: ["revive", "defense"] },
  { word: "Quicksilver", category: "item", difficulty: "hard", tags: ["cleanse", "utilite"] },
  { word: "Support", category: "role", difficulty: "easy", tags: ["class", "lane"] },
  { word: "Carry", category: "role", difficulty: "easy", tags: ["class", "damage"] },
  { word: "Tank", category: "role", difficulty: "easy", tags: ["class", "frontline"] },
  { word: "Bruiser", category: "role", difficulty: "easy", tags: ["class", "fighter"] },
  { word: "Mage", category: "role", difficulty: "easy", tags: ["class", "damage"] },
  { word: "Assassin", category: "role", difficulty: "easy", tags: ["class", "burst"] },
  { word: "Marksman", category: "role", difficulty: "medium", tags: ["class", "ranged"] },
  { word: "Enchanter", category: "role", difficulty: "medium", tags: ["class", "support"] },
  { word: "Frontline", category: "role", difficulty: "medium", tags: ["fight", "tank"] },
  { word: "Backline", category: "role", difficulty: "medium", tags: ["fight", "ranged"] },
  { word: "ADC", category: "role", difficulty: "easy", tags: ["class", "lane"] },
  { word: "Duel", category: "combat", difficulty: "easy", tags: ["fight", "1v1"] },
  { word: "Piege vision", category: "vision", difficulty: "hard", tags: ["bait", "setup"] },
  { word: "Crossmap", category: "macro", difficulty: "hard", tags: ["trade", "objectif"] },
  { word: "Power Spike", category: "economy", difficulty: "medium", tags: ["timing", "item"] },
  { word: "Condition de victoire", category: "macro", difficulty: "hard", tags: ["strategie", "goal"] },
  { word: "Draft", category: "macro", difficulty: "medium", tags: ["champ select", "strategie"] },
  { word: "Counterpick", category: "macro", difficulty: "hard", tags: ["draft", "lane"] },
  { word: "Side Lane", category: "map", difficulty: "medium", tags: ["macro", "lane"] },
  { word: "Ancrage", category: "macro", difficulty: "hard", tags: ["position", "support"] },
  { word: "Discipline", category: "macro", difficulty: "hard", tags: ["concept", "teamplay"] },
  { word: "Momentum", category: "economy", difficulty: "medium", tags: ["tempo", "concept"] },
];

const DIFFICULTY_TARGETS: Record<WordDifficulty, number> = {
  easy: 12,
  medium: 10,
  hard: 3,
};

const wordPools: Record<WordPoolLocale, WordEntry[]> = {
  en: wordPoolEn,
  fr: wordPoolFr,
};

function shuffle<T>(items: T[]): T[] {
  const cloned = [...items];

  for (let index = cloned.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [cloned[index], cloned[randomIndex]] = [cloned[randomIndex], cloned[index]];
  }

  return cloned;
}

function takeUniqueWords(
  source: WordEntry[],
  count: number,
  usedWords: Set<string>,
) {
  const selected: WordEntry[] = [];

  for (const entry of shuffle(source)) {
    if (selected.length >= count) {
      break;
    }

    if (usedWords.has(entry.word)) {
      continue;
    }

    usedWords.add(entry.word);
    selected.push(entry);
  }

  return selected;
}

export function getStructuredWordPool(locale: WordPoolLocale = "en") {
  return wordPools[locale];
}

export function getRandomBoardWordEntries(
  boardSize: number,
  locale: WordPoolLocale = "en",
): WordEntry[] {
  const pool = wordPools[locale];
  const usedWords = new Set<string>();
  const selections: WordEntry[] = [];

  (["easy", "medium", "hard"] as const).forEach((difficulty) => {
    selections.push(
      ...takeUniqueWords(
        pool.filter((entry) => entry.difficulty === difficulty),
        Math.min(DIFFICULTY_TARGETS[difficulty], boardSize - selections.length),
        usedWords,
      ),
    );
  });

  if (selections.length < boardSize) {
    selections.push(...takeUniqueWords(pool, boardSize - selections.length, usedWords));
  }

  return shuffle(selections).slice(0, boardSize);
}

export const lolTerms = wordPoolEn.map((entry) => entry.word) as readonly string[];
