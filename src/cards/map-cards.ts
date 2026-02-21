export interface CardMappedData {
  nameEn: string;
  nameDe?: string | null;
  slug: string;
  textEn: string;
  textDe?: string | null;
  cardType: string;
  passcode?: string | null;
  spellTrapAttribute?: string | null;
  imagePath: string | null;
  category?: string | null;
  categories: string[];
  monsterType?: string | null;
  attribute?: string | null;
  atk?: string | null;
  def?: string | null;
  level?: number | null;
  rank?: number | null;
  link?: number | null;
  linkArrows: string[];
  pendulumTextEn?: string | null;
  pendulumTextDe?: string | null;
  pendulumScale?: number | null;
}

export interface CardPrint {
  cardNumber: string;
  rarity: number;
  set: {
    setNumber: string;
    languages: {
      language: string;
    }[];
  };
}

export interface CardData {
  data: {
    name: string;
    nameDe: string | null;
    slug: string;
    cardEffect: string | null;
    cardEffectDe: string | null;
    cardTypeOrder: string;
    cardTypes: number[];
    passcode: string | null;
    monsterType: number | null;
    monsterAttribute: number | null;
    attack: number | null;
    defense: number | null;
    level: number | null;
    rank: number | null;
    link: number | null;
    linkArrows: boolean[] | null;
    pendulumEffect: string | null;
    pendulumEffectDe: string | null;
    pendulumScale: number | null;
    scale: number | null;
    prints: CardPrint[];
  };
}

// Card type IDs for monster subtypes
const CARD_TYPE = {
  NORMAL: 1,
  EFFECT: 2,
  XYZ: 6,
  PENDULUM: 7,
  LINK: 8,
} as const;

const MONSTER_TYPES: Record<number, string> = {
  1: "Aqua",
  2: "Beast",
  3: "Beast-Warrior",
  4: "Cyberse",
  5: "Dinosaur",
  6: "Divine-Beast",
  7: "Dragon",
  8: "Fairy",
  9: "Fiend",
  10: "Fish",
  11: "Insect",
  12: "Machine",
  13: "Plant",
  14: "Psychic",
  15: "Reptile",
  16: "Rock",
  17: "Sea Serpent",
  18: "Spellcaster",
  19: "Thunder",
  20: "Warrior",
  21: "Winged Beast",
  22: "Zombie",
  23: "Wyrm",
  24: "Creator God",
  25: "Pyro",
  26: "Illusion",
};

const MONSTER_ATTRIBUTES: Record<number, string> = {
  1: "DARK",
  2: "DIVINE",
  3: "EARTH",
  4: "FIRE",
  5: "LIGHT",
  6: "WATER",
  7: "WIND",
};

const SPELL_TRAP_CATEGORIES: Record<string, string> = {
  "31": "Normal",
  "32": "Field",
  "33": "Continuous",
  "34": "Quick-Play",
  "35": "Equip",
  "36": "Ritual",
  "41": "Normal",
  "42": "Continuous",
  "43": "Counter",
};

const MONSTER_CATEGORY_MAP: Record<number, string> = {
  1: "Normal",
  2: "Effect",
  3: "Ritual",
  4: "Fusion",
  5: "Synchro",
  6: "Xyz",
  7: "Pendulum",
  8: "Link",
  9: "Tuner",
  10: "Flip",
  12: "Spirit",
  13: "Union",
  14: "Gemini",
};

const LINK_ARROW_DIRECTIONS = ["TL", "T", "TR", "L", "R", "BL", "B", "BR"];
const LINK_ARROW_SORT_ORDER: Record<string, number> = {
  L: 0,
  R: 1,
  TL: 2,
  T: 3,
  TR: 4,
  BL: 5,
  B: 6,
  BR: 7,
};

function isMonsterCard(cardTypeOrder: string): boolean {
  return cardTypeOrder.startsWith("1") || cardTypeOrder.startsWith("2");
}

function getCardType(cardTypeOrder: string): string {
  if (isMonsterCard(cardTypeOrder)) return "Monster";
  if (cardTypeOrder.startsWith("3")) return "Spell";
  if (cardTypeOrder.startsWith("4")) return "Trap";
  return "Unknown";
}

function getSpellTrapAttribute(cardTypeOrder: string): string | null {
  return SPELL_TRAP_CATEGORIES[cardTypeOrder] ?? null;
}

function getCategory(data: CardData["data"]): string | null {
  if (!isMonsterCard(data.cardTypeOrder)) return null;
  if (data.cardTypes.includes(CARD_TYPE.XYZ)) return "xyz";
  if (data.cardTypes.includes(CARD_TYPE.LINK)) return "link";
  if (data.rank !== null && data.rank !== undefined) return "rank";
  if (data.link !== null && data.link !== undefined) return "link";
  if (data.level !== null && data.level !== undefined) return "level";
  return null;
}

function getMonsterCategories(cardTypes: number[]): string[] {
  // Card types >= 15 are spell/trap types
  const monsterTypes = cardTypes.filter((t) => t < 15);
  if (monsterTypes.length === 0) return [];

  const categories: string[] = [];
  const hasEffect = monsterTypes.includes(CARD_TYPE.EFFECT);
  const hasNormal = monsterTypes.includes(CARD_TYPE.NORMAL);

  // Add "Normal" for cards without explicit Normal or Effect types
  // (e.g., Normal Ritual, Normal Fusion Tuner)
  if (!hasEffect && !hasNormal) {
    categories.push("Normal");
  }

  for (const type of monsterTypes) {
    const mapped = MONSTER_CATEGORY_MAP[type];
    if (mapped) categories.push(mapped);
  }

  return categories;
}

function formatLinkArrows(linkArrows: boolean[] | null): string[] {
  if (!linkArrows || linkArrows.length !== 8) return [];

  return linkArrows
    .map((active, i) => (active ? LINK_ARROW_DIRECTIONS[i] : null))
    .filter((d): d is string => d !== null)
    .sort((a, b) => LINK_ARROW_SORT_ORDER[a] - LINK_ARROW_SORT_ORDER[b]);
}

export function mapCard(cardData: CardData): CardMappedData {
  const { data } = cardData;

  const hasType = (type: number) => data.cardTypes.includes(type);
  const isXyz = hasType(CARD_TYPE.XYZ);
  const isLink = hasType(CARD_TYPE.LINK);
  const isPendulum = hasType(CARD_TYPE.PENDULUM);
  const isMonster = isMonsterCard(data.cardTypeOrder);

  return {
    nameEn: data.name,
    nameDe: data.nameDe ?? null,
    slug: data.slug,
    textEn: data.cardEffect ?? "",
    textDe: data.cardEffectDe ?? null,
    cardType: getCardType(data.cardTypeOrder),
    passcode: data.passcode,
    spellTrapAttribute: isLink
      ? undefined
      : getSpellTrapAttribute(data.cardTypeOrder),
    imagePath: null,
    category: getCategory(data),
    categories: getMonsterCategories(data.cardTypes),
    monsterType: isMonster
      ? (MONSTER_TYPES[data.monsterType ?? -1] ?? null)
      : undefined,
    attribute: isMonster
      ? (MONSTER_ATTRIBUTES[data.monsterAttribute ?? -1] ?? null)
      : undefined,
    atk: isMonster ? (data.attack?.toString() ?? null) : undefined,
    def: isMonster && !isLink ? (data.defense?.toString() ?? null) : undefined,
    level: isMonster && !isXyz && !isLink ? data.level : undefined,
    rank: isMonster && isXyz ? data.level : undefined,
    link: isMonster && isLink ? data.level : undefined,
    linkArrows: formatLinkArrows(data.linkArrows),
    pendulumTextEn:
      isMonster && !isLink ? (data.pendulumEffect ?? null) : undefined,
    pendulumTextDe:
      isMonster && !isLink ? (data.pendulumEffectDe ?? null) : undefined,
    pendulumScale:
      isMonster && !isLink && isPendulum
        ? (data.scale ?? data.pendulumScale)
        : undefined,
  };
}
