import { readFile, writeFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { mapCard } from "../cards/map-cards";
import type { Logger } from "../types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CARDS_DIR = join(__dirname, "../data/cards");
const OUTPUT_PATH = join(CARDS_DIR, "all-mapped-cards.json");

interface CardData {
  data: {
    slug: string;
  };
}

async function main(logger: Logger | undefined): Promise<void> {
  const files = (await readdir(CARDS_DIR)).filter(
    (f) => f.endsWith(".json") && f !== "all-mapped-cards.json",
  );

  logger?.log(`Found ${files.length} card files`);

  const allMappedCards = [];

  for (const file of files) {
    const cards: CardData[] = JSON.parse(
      await readFile(join(CARDS_DIR, file), "utf-8"),
    );

    for (const card of cards) {
      allMappedCards.push(mapCard(card as Parameters<typeof mapCard>[0]));
    }

    logger?.log(`Processed ${file}: ${cards.length} cards`);
  }

  await writeFile(OUTPUT_PATH, JSON.stringify(allMappedCards, null, 2));
  logger?.log(`Saved ${allMappedCards.length} mapped cards to ${OUTPUT_PATH}`);
}

main(console);
