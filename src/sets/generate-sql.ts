import { z } from "zod";
import type { Logger } from "../types";

const BATCH_SIZE = 500;

const COLUMNS = [
  "name",
  "slug",
  "set_code",
  "release_date",
  "categories",
  "created_at",
  "updated_at",
] as const;

const UPDATE_COLUMNS = COLUMNS.filter(
  (col) => col !== "slug" && col !== "created_at",
);

const RawSetSchema = z.object({
  name: z.string().nonempty(),
  slug: z.string().nonempty(),
  setNumber: z.string().nonempty(),
  releaseEu: z.string().nullable(),
  releaseNa: z.string().nullable(),
});

type RawSet = z.infer<typeof RawSetSchema>;

interface TransformedSet {
  name: string;
  slug: string;
  setCode: string;
  releaseDate: string | null;
}

function isEuropeanRelease(name: string): boolean {
  return name.toLowerCase().includes("european release");
}

function transformSets(raw: RawSet): TransformedSet[] {
  const results: TransformedSet[] = [];
  const isExplicitEu = isEuropeanRelease(raw.name);

  if (isExplicitEu) {
    // Explicit European release entry - create EU version only
    const name = raw.name.replace(/\s*\(European[- ]release\)/i, " EU").trim();
    const slug = raw.slug.replace(/-european-release$/, "-eu");

    results.push({
      name,
      slug,
      setCode: raw.setNumber,
      releaseDate: raw.releaseEu,
    });
  } else {
    // Determine release date (prefer NA, fallback to EU)
    const releaseDate = raw.releaseNa ?? raw.releaseEu;

    results.push({
      name: raw.name,
      slug: raw.slug,
      setCode: raw.setNumber,
      releaseDate,
    });
  }

  return results;
}

const parse = (set: RawSet, logger: Logger | undefined): RawSet | null => {
  const result = RawSetSchema.safeParse(set);
  if (result.success) {
    return result.data;
  } else {
    logger?.log(`Set name ${set.name} excluded`);
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
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return "'{}'";
    }
    const elements = value.map((v) => `"${escapeString(String(v))}"`).join(",");
    return `'{${elements}}'`;
  }
  return "NULL";
}

function setToValues(set: TransformedSet, categories: string[]): string {
  const values = [
    sqlValue(set.name),
    sqlValue(set.slug),
    sqlValue(set.setCode),
    sqlValue(set.releaseDate),
    sqlValue(categories),
    "NOW()",
    "NOW()",
  ];

  return `  (${values.join(", ")})`;
}

function generateBatchInsert(
  sets: TransformedSet[],
  categories: string[],
): string {
  const columnList = COLUMNS.join(", ");
  const valueRows = sets.map((s) => setToValues(s, categories)).join(",\n");

  const onConflictSet = UPDATE_COLUMNS.map(
    (col) => `    ${col} = EXCLUDED.${col}`,
  ).join(",\n");

  return [
    `INSERT INTO card_sets (${columnList})`,
    `VALUES`,
    valueRows,
    `ON CONFLICT (slug) DO UPDATE SET`,
    `${onConflictSet};`,
  ].join("\n");
}

export function generateSetsSql(
  rawSets: RawSet[],
  categories: string[],
  logger: Logger | undefined,
): string {
  const transformedSets = rawSets
    .flat()
    .map((v) => parse(v, logger))
    .filter((s) => !!s)
    .flatMap(transformSets);
  logger?.log(`Transformed into ${transformedSets.length} sets`);

  if (transformedSets.length === 0) {
    return "-- No sets to insert\n";
  }

  const batches: TransformedSet[][] = [];
  for (let i = 0; i < transformedSets.length; i += BATCH_SIZE) {
    batches.push(transformedSets.slice(i, i + BATCH_SIZE));
  }

  const statements: string[] = [
    `-- Generated SQL for ${transformedSets.length} sets in ${batches.length} batch(es) of up to ${BATCH_SIZE}`,
    "",
  ];

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    statements.push(
      `-- Batch ${i + 1}/${batches.length} (${batch.length} sets)`,
    );
    statements.push("BEGIN;");
    statements.push("");
    statements.push(generateBatchInsert(batch, categories));
    statements.push("");
    statements.push("COMMIT;");
    statements.push("");
  }

  return statements.join("\n");
}
