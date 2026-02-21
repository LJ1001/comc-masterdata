import { readFile, writeFile, mkdir, readdir } from "fs/promises";
import { existsSync } from "fs";
import { join } from "path";
import { Logger } from "../types";

interface SetData {
  data: {
    prints: { card: { slug: string } }[];
  };
}

interface CardData {
  data: { slug: string };
}

export async function readSlugsFromSets(setsDir: string): Promise<Set<string>> {
  const slugs = new Set<string>();

  if (!existsSync(setsDir)) {
    return slugs;
  }

  const files = (await readdir(setsDir)).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const setData: SetData = JSON.parse(
      await readFile(join(setsDir, file), "utf-8"),
    );
    for (const print of setData.data?.prints ?? []) {
      if (print.card?.slug) {
        slugs.add(print.card.slug);
      }
    }
  }

  return slugs;
}

async function readExistingSlugs(outputDir: string): Promise<Set<string>> {
  const slugs = new Set<string>();

  if (!existsSync(outputDir)) {
    return slugs;
  }

  const files = (await readdir(outputDir)).filter((f) => f.endsWith(".json"));
  for (const file of files) {
    const cards: CardData[] = JSON.parse(
      await readFile(join(outputDir, file), "utf-8"),
    );
    for (const card of cards) {
      if (card.data?.slug) {
        slugs.add(card.data.slug);
      }
    }
  }

  return slugs;
}

async function readExistingCardsForPrefix(
  prefix: string,
  outputDir: string,
): Promise<CardData[]> {
  const filePath = join(outputDir, `${prefix}.json`);
  if (!existsSync(filePath)) {
    return [];
  }
  return JSON.parse(await readFile(filePath, "utf-8"));
}

async function fetchCards(
  slugs: string[],
  fetchFn: typeof fetch = fetch,
  logger: Logger | undefined,
): Promise<CardData[]> {
  const cards: CardData[] = [];

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i];
    logger?.log(`Fetching card ${i + 1}/${slugs.length}: ${slug}`);

    const response = await fetchFn(`https://cardcluster.com/api/cards/${slug}`);
    if (!response.ok) {
      logger?.warn(`Failed to fetch card ${slug}: ${response.statusText}`);
      continue;
    }

    cards.push(await response.json());
  }

  return cards;
}

export async function fetchAllCards(
  prefix: string,
  setsDir: string,
  outputDir: string,
  logger: Logger = console,
): Promise<void> {
  logger?.log(`Reading all card slugs from sets...`);
  const allSlugs = await readSlugsFromSets(setsDir);
  logger?.log(`Found ${allSlugs.size} unique card slugs`);

  logger?.log(`Reading existing cards...`);
  const existingSlugs = await readExistingSlugs(outputDir);
  logger?.log(`Found ${existingSlugs.size} existing cards`);

  const slugs: string[] = [];
  for (const slug of allSlugs) {
    if (slug.charAt(0) === prefix) {
      slugs.push(slug);
    }
  }

  logger?.log(`Found ${slugs.length} cards with prefix "${prefix}"`);
  await mkdir(outputDir, { recursive: true });

  const newSlugs = slugs.filter((slug) => !existingSlugs.has(slug));

  if (newSlugs.length === 0) {
    logger?.log(`Prefix "${prefix}": all ${slugs.length} cards already exist`);
    return;
  }

  logger?.log(
    `Processing prefix "${prefix}": ${newSlugs.length} new cards (${slugs.length - newSlugs.length} already exist)`,
  );

  const newCards = await fetchCards(newSlugs, fetch, logger);
  const existingCards = await readExistingCardsForPrefix(prefix, outputDir);
  const allCards = [...existingCards, ...newCards];

  await writeFile(
    join(outputDir, `${prefix}.json`),
    JSON.stringify(allCards, null, 2),
  );
  logger?.log(`Saved ${allCards.length} cards to ${prefix}.json`);

  logger?.log(`Done fetching all cards`);
}
