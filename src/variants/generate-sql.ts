import { z } from "zod";
import type { Logger } from "../types";

const BATCH_SIZE = 500;

const COLUMNS = [
  "number",
  "language",
  "slug",
  "slug_language",
  "rarity",
  "rarity_code",
  "card_id",
  "card_set_id",
  "created_at",
  "updated_at",
] as const;

const UPDATE_COLUMNS = COLUMNS.filter(
  (col) => col !== "slug_language" && col !== "created_at",
);

const RawVariantSchema = z.object({
  number: z.string().nonempty(),
  language: z.string().nonempty(),
  slug: z.string().nonempty(),
  slugLanguage: z.string().nonempty(),
  rarity: z.string().nonempty(),
  rarityCode: z.string().nonempty(),
  cardSlug: z.string().nonempty(),
  cardSet: z.string().nonempty(),
});

type RawVariant = z.infer<typeof RawVariantSchema>;

const parse = (
  variant: RawVariant,
  logger: Logger | undefined,
): RawVariant | null => {
  const result = RawVariantSchema.safeParse(variant);
  if (result.success) {
    return result.data;
  } else {
    logger?.log(`Variant slug ${variant.slug} excluded:`, result.error.message);
    return null;
  }
};

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
  return "NULL";
}

function variantToValues(variant: RawVariant): string {
  const values = [
    sqlValue(variant.number),
    sqlValue(variant.language),
    sqlValue(variant.slug),
    sqlValue(variant.slugLanguage),
    sqlValue(variant.rarity),
    sqlValue(variant.rarityCode),
    `(SELECT id FROM cards WHERE slug = ${sqlValue(variant.cardSlug)})`,
    `(SELECT id FROM card_sets WHERE set_code = ${sqlValue(variant.cardSet)})`,
    "NOW()",
    "NOW()",
  ];

  return `  (${values.join(", ")})`;
}

function generateBatchInsert(variants: RawVariant[]): string {
  const columnList = COLUMNS.join(", ");
  const valueRows = variants.map(variantToValues).join(",\n");

  const onConflictSet = UPDATE_COLUMNS.map(
    (col) => `    ${col} = EXCLUDED.${col}`,
  ).join(",\n");

  return [
    `INSERT INTO card_variants (${columnList})`,
    `VALUES`,
    valueRows,
    `ON CONFLICT (slug_language) DO UPDATE SET`,
    `${onConflictSet};`,
  ].join("\n");
}

export function generateVariantsSql(
  rawVariants: RawVariant[],
  logger: Logger | undefined,
): string {
  const validVariants = rawVariants
    .map((v) => parse(v, logger))
    .filter((v): v is RawVariant => v !== null);
  logger?.log(`Validated ${validVariants.length} variants`);

  const seen = new Set<string>();
  const duplicates: string[] = [];
  const unique = validVariants.filter((variant) => {
    if (seen.has(variant.slugLanguage)) {
      duplicates.push(variant.slugLanguage);
      return false;
    }
    seen.add(variant.slugLanguage);
    return true;
  });

  if (duplicates.length > 0) {
    logger?.log(`Found ${duplicates.length} duplicate entries`);
  }

  if (unique.length === 0) {
    return "-- No variants to insert\n";
  }

  const batches: RawVariant[][] = [];
  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    batches.push(unique.slice(i, i + BATCH_SIZE));
  }

  const statements: string[] = [
    `-- Generated SQL for ${unique.length} variants in ${batches.length} batch(es) of up to ${BATCH_SIZE}`,
    "",
  ];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    statements.push(
      `-- Batch ${i + 1}/${batches.length} (${batch.length} variants)`,
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
