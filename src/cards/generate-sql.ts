import type { CardMappedData } from "./map-cards";

const BATCH_SIZE = 500;

const COLUMNS = [
  "name_en",
  "name_de",
  "slug",
  "text_en",
  "text_de",
  "card_type",
  "passcode",
  "spell_trap_attribute",
  "image_path",
  "category",
  "categories",
  "monster_type",
  "attribute",
  "atk",
  "def",
  "level",
  "rank",
  "link",
  "link_arrows",
  "pendulum_text_en",
  "pendulum_text_de",
  "pendulum_scale",
  "created_at",
  "updated_at",
] as const;

const UPDATE_COLUMNS = COLUMNS.filter(
  (col) => col !== "slug" && col !== "created_at",
);

function escapeString(value: string): string {
  return value.replace(/'/g, "''").replace(/\\/g, "\\\\");
}

function sqlValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "NULL";
  }
  if (typeof value === "number") {
    return String(value);
  }
  if (typeof value === "string") {
    return `'${escapeString(value)}'`;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "'{}'";
    }
    const elements = value.map((v) => `"${escapeString(String(v))}"`).join(",");
    return `'{${elements}}'`;
  }
  return "NULL";
}

function cardToValues(card: CardMappedData): string {
  const values = [
    sqlValue(card.nameEn),
    sqlValue(card.nameDe ?? null),
    sqlValue(card.slug),
    sqlValue(card.textEn),
    sqlValue(card.textDe ?? null),
    sqlValue(card.cardType),
    sqlValue(card.passcode ?? null),
    sqlValue(card.spellTrapAttribute ?? null),
    sqlValue(card.imagePath ?? null),
    sqlValue(card.category ?? null),
    sqlValue(card.categories),
    sqlValue(card.monsterType ?? null),
    sqlValue(card.attribute ?? null),
    sqlValue(card.atk ?? null),
    sqlValue(card.def ?? null),
    sqlValue(card.level ?? null),
    sqlValue(card.rank ?? null),
    sqlValue(card.link ?? null),
    sqlValue(card.linkArrows),
    sqlValue(card.pendulumTextEn ?? null),
    sqlValue(card.pendulumTextDe ?? null),
    sqlValue(card.pendulumScale ?? null),
    "NOW()",
    "NOW()",
  ];

  return `  (${values.join(", ")})`;
}

function generateBatchInsert(cards: CardMappedData[]): string {
  const columnList = COLUMNS.join(", ");
  const valueRows = cards.map(cardToValues).join(",\n");

  const onConflictSet = UPDATE_COLUMNS.map(
    (col) => `    ${col} = EXCLUDED.${col}`,
  ).join(",\n");

  return [
    `INSERT INTO cards (${columnList})`,
    `VALUES`,
    valueRows,
    `ON CONFLICT (slug) DO UPDATE SET`,
    `${onConflictSet};`,
  ].join("\n");
}

export function generateCardsSql(cards: CardMappedData[]): string {
  if (cards.length === 0) {
    return "-- No cards to insert\n";
  }

  const batches: CardMappedData[][] = [];
  for (let i = 0; i < cards.length; i += BATCH_SIZE) {
    batches.push(cards.slice(i, i + BATCH_SIZE));
  }

  const statements: string[] = [
    `-- Generated SQL for ${cards.length} cards in ${batches.length} batch(es) of up to ${BATCH_SIZE}`,
    "",
  ];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    statements.push(
      `-- Batch ${i + 1}/${batches.length} (${batch.length} cards)`,
    );
    statements.push("BEGIN;");
    statements.push("");
    statements.push(generateBatchInsert(batch));
    statements.push("");
    statements.push("COMMIT;");
    statements.push("");
  }

  return statements.join("\n");
}
