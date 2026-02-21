import { readFile, writeFile, readdir } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { Logger } from "../types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CARDS_DIR = join(__dirname, "../data/cards");
const OUTPUT_DIR = join(__dirname, "../../tests/masterdata/test_data/cards");

interface CardData {
  data: { slug: string };
}

async function findCardBySlug(slug: string): Promise<CardData | null> {
  const files = (await readdir(CARDS_DIR)).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const cards: CardData[] = JSON.parse(
      await readFile(join(CARDS_DIR, file), "utf-8"),
    );

    const found = cards.find((card) => card.data?.slug === slug);
    if (found) {
      return found;
    }
  }

  return null;
}

async function main(logger: Logger | undefined): Promise<void> {
  const slug = process.argv[2];

  if (!slug) {
    logger?.error("Usage: pnpx tsx extract-card.ts <slug>");
    process.exit(1);
  }

  logger?.log(`Searching for card with slug: ${slug}`);

  const card = await findCardBySlug(slug);

  if (!card) {
    logger?.error(`Card with slug "${slug}" not found`);
    process.exit(1);
  }

  const outputPath = join(OUTPUT_DIR, `${slug}.json`);
  await writeFile(outputPath, JSON.stringify([card], null, 2));
  logger?.log(`Saved card to ${outputPath}`);
}

main(console);
