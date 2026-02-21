import { readFileSync } from "fs";
import { PrismaClient } from "../../generated/prisma/client";
import { z } from "zod";
import { Logger } from "../types";

const RawCardSchema = z.object({
  nameEn: z.string().nonempty(),
  nameDe: z.string().nullable().optional(),
  slug: z.string().nonempty(),
  textEn: z.string().default(""),
  textDe: z.string().nullable().optional(),
  cardType: z.string().nonempty(),
  passcode: z.string().nullable(),
  spellTrapAttribute: z.string().nullable().optional(),
  imagePath: z.string().nullable(),
  category: z.string().nullable(),
  categories: z.array(z.string()).default([]),
  monsterType: z.string().nullable().optional(),
  attribute: z.string().nullable().optional(),
  atk: z.string().nullable().optional(),
  def: z.string().nullable().optional(),
  level: z.number().nullable().optional(),
  rank: z.number().nullable().optional(),
  link: z.number().nullable().optional(),
  linkArrows: z.array(z.string()).default([]),
  pendulumTextEn: z.string().nullable().optional(),
  pendulumTextDe: z.string().nullable().optional(),
  pendulumScale: z.number().nullable().optional(),
});

type RawCard = z.infer<typeof RawCardSchema>;

const parse = (card: RawCard, logger: Logger | undefined): RawCard | null => {
  const result = RawCardSchema.safeParse(card);
  if (result.success) {
    return result.data;
  } else {
    logger?.log(`Card name ${card.nameEn} excluded:`, result.error.message);
    return null;
  }
};

export async function insertCards(
  prismaClient: PrismaClient,
  cardsPath: string,
  logger: Logger | undefined,
) {
  logger?.log("Reading cards from", cardsPath);

  const rawCards: RawCard[] = JSON.parse(readFileSync(cardsPath, "utf-8"));
  logger?.log(`Found ${rawCards.length} raw cards`);

  const validCards = rawCards
    .map((v) => parse(v, logger))
    .filter((c): c is RawCard => c !== null);
  logger?.log(`Validated ${validCards.length} cards`);

  logger?.log("Upserting cards...");

  await prismaClient.$transaction(
    validCards.map((card) =>
      prismaClient.card.upsert({
        where: { slug: card.slug },
        update: {
          nameEn: card.nameEn,
          nameDe: card.nameDe ?? null,
          textEn: card.textEn,
          textDe: card.textDe ?? null,
          cardType: card.cardType,
          passcode: card.passcode,
          spellTrapAttribute: card.spellTrapAttribute ?? null,
          imagePath: card.imagePath,
          category: card.category,
          categories: card.categories,
          monsterType: card.monsterType ?? null,
          attribute: card.attribute ?? null,
          atk: card.atk ?? null,
          def: card.def ?? null,
          level: card.level ?? null,
          rank: card.rank ?? null,
          link: card.link ?? null,
          linkArrows: card.linkArrows,
          pendulumTextEn: card.pendulumTextEn ?? null,
          pendulumTextDe: card.pendulumTextDe ?? null,
          pendulumScale: card.pendulumScale ?? null,
        },
        create: {
          nameEn: card.nameEn,
          nameDe: card.nameDe ?? null,
          slug: card.slug,
          textEn: card.textEn,
          textDe: card.textDe ?? null,
          cardType: card.cardType,
          passcode: card.passcode,
          spellTrapAttribute: card.spellTrapAttribute ?? null,
          imagePath: card.imagePath,
          category: card.category,
          categories: card.categories,
          monsterType: card.monsterType ?? null,
          attribute: card.attribute ?? null,
          atk: card.atk ?? null,
          def: card.def ?? null,
          level: card.level ?? null,
          rank: card.rank ?? null,
          link: card.link ?? null,
          linkArrows: card.linkArrows,
          pendulumTextEn: card.pendulumTextEn ?? null,
          pendulumTextDe: card.pendulumTextDe ?? null,
          pendulumScale: card.pendulumScale ?? null,
        },
      }),
    ),
  );

  logger?.log(`Upserted ${validCards.length} cards`);
}
