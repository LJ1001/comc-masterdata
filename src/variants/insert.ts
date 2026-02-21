import { readFileSync } from "fs";
import { PrismaClient } from "../../generated/prisma/client";
import { z } from "zod";
import { Logger } from "../types";

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

async function buildLookupMaps(prismaClient: PrismaClient) {
  const [cards, sets] = await Promise.all([
    prismaClient.card.findMany({ select: { id: true, slug: true } }),
    prismaClient.cardSet.findMany({ select: { id: true, setCode: true } }),
  ]);

  const cardSlugToId = new Map(cards.map((c) => [c.slug, c.id]));
  const setCodeToId = new Map(sets.map((s) => [s.setCode, s.id]));

  return { cardSlugToId, setCodeToId };
}

export async function insertVariants(
  prismaClient: PrismaClient,
  variantsPath: string,
  logger: Logger | undefined,
) {
  logger?.log("Reading variants from", variantsPath);

  const rawVariants: RawVariant[] = JSON.parse(
    readFileSync(variantsPath, "utf-8"),
  );
  logger?.log(`Found ${rawVariants.length} raw variants`);

  const validVariants = rawVariants
    .map((v) => parse(v, logger))
    .filter((v): v is RawVariant => v !== null);
  logger?.log(`Validated ${validVariants.length} variants`);

  const { cardSlugToId, setCodeToId } = await buildLookupMaps(prismaClient);
  logger?.log(
    `Loaded lookup maps: ${cardSlugToId.size} cards, ${setCodeToId.size} sets`,
  );

  let skipped = 0;
  const resolved = validVariants
    .map((variant) => {
      const cardId = cardSlugToId.get(variant.cardSlug) ?? null;
      const cardSetId = setCodeToId.get(variant.cardSet) ?? null;

      if (!cardId) {
        logger?.log(
          `Variant ${variant.slug}: card slug "${variant.cardSlug}" not found, skipping`,
        );
        skipped++;
        return null;
      }
      if (!cardSetId) {
        logger?.log(
          `Variant ${variant.slug}: set code "${variant.cardSet}" not found, skipping`,
        );
        skipped++;
        return null;
      }

      return { ...variant, cardId, cardSetId };
    })
    .filter(<T>(v: T | null): v is T => v !== null);

  if (skipped > 0) {
    logger?.log(
      `Skipped ${skipped} variants due to missing card/set references`,
    );
  }

  const seen = new Set<string>();
  const duplicates: string[] = [];
  const unique = resolved.filter((variant) => {
    if (seen.has(variant.slugLanguage)) {
      duplicates.push(variant.slugLanguage);
      return false;
    }
    seen.add(variant.slugLanguage);
    return true;
  });

  if (duplicates.length > 0) {
    logger?.log(`Found ${duplicates.length} duplicate entries:`);
    for (const slug of duplicates) {
      logger?.log(`  Duplicate: ${slug}`);
    }
  }

  logger?.log(`Upserting ${unique.length} unique variants...`);

  const BATCH_SIZE = 500;
  for (let i = 0; i < unique.length; i += BATCH_SIZE) {
    const batch = unique.slice(i, i + BATCH_SIZE);

    await prismaClient.$transaction(
      batch.map((variant) =>
        prismaClient.cardVariant.upsert({
          where: { slugLanguage: variant.slugLanguage },
          update: {
            number: variant.number,
            language: variant.language,
            slug: variant.slug,
            rarity: variant.rarity,
            rarityCode: variant.rarityCode,
            cardId: variant.cardId,
            cardSetId: variant.cardSetId,
          },
          create: {
            number: variant.number,
            language: variant.language,
            slug: variant.slug,
            slugLanguage: variant.slugLanguage,
            rarity: variant.rarity,
            rarityCode: variant.rarityCode,
            cardId: variant.cardId,
            cardSetId: variant.cardSetId,
          },
        }),
      ),
    );

    logger?.log(
      `Upserted batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(unique.length / BATCH_SIZE)}`,
    );
  }

  logger?.log(`Upserted ${unique.length} variants`);
}
