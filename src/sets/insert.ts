import { readFileSync } from "fs";
import { PrismaClient } from "../../generated/prisma/client";
import { z } from "zod";
import { Logger } from "../types";

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

export async function insertSets(
  primaClient: PrismaClient,
  setsPath: string,
  categories: string[],
  logger: Logger | undefined,
) {
  logger?.log("Reading sets from", setsPath);

  const rawSets: RawSet[] = JSON.parse(readFileSync(setsPath, "utf-8"));
  logger?.log(`Found ${rawSets.length} raw sets`);

  const transformedSets = rawSets
    .flat()
    .map((v) => parse(v, logger))
    .filter((s) => !!s)
    .flatMap(transformSets);
  logger?.log(`Transformed into ${transformedSets.length} sets`);

  logger?.log("Upserting sets...");

  // Bulk upsert using transaction
  await primaClient.$transaction(
    transformedSets.map((cardSet) =>
      primaClient.cardSet.upsert({
        where: { slug: cardSet.slug },
        update: {
          name: cardSet.name,
          setCode: cardSet.setCode,
          releaseDate: cardSet.releaseDate,
          categories: categories,
        },
        create: {
          name: cardSet.name,
          slug: cardSet.slug,
          setCode: cardSet.setCode,
          releaseDate: cardSet.releaseDate,
          categories: categories,
        },
      }),
    ),
  );

  logger?.log(`Upserted ${transformedSets.length} sets`);
}
