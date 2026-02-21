import { readFile, writeFile, readdir } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { mapVariants, filterSetNumbers } from "../variants/map-variants";
import { CardData } from "../cards/map-cards";
import { Logger } from "../types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CARDS_DIR = join(__dirname, "../data/cards");
const SETS_PATH = join(__dirname, "../data/sets/sets.json");
const OUTPUT_PATH = join(
  __dirname,
  "../data/variants/all-mapped-variants.json",
);

async function main(logger: Logger | undefined): Promise<void> {
  const allowedSets = filterSetNumbers(SETS_PATH);
  logger?.log(`Loaded ${allowedSets.length} allowed sets`);

  const files = (await readdir(CARDS_DIR)).filter(
    (f) => f.endsWith(".json") && f !== "all-mapped-cards.json",
  );

  logger?.log(`Found ${files.length} card files`);

  const allMappedVariants = [];

  for (const file of files) {
    const cards: CardData[] = JSON.parse(
      await readFile(join(CARDS_DIR, file), "utf-8"),
    );

    for (const card of cards) {
      allMappedVariants.push(...mapVariants(card, allowedSets));
    }

    logger?.log(`Processed ${file}: ${cards.length} cards`);
  }

  await writeFile(OUTPUT_PATH, JSON.stringify(allMappedVariants, null, 2));
  logger?.log(
    `Saved ${allMappedVariants.length} mapped variants to ${OUTPUT_PATH}`,
  );
}

main(console);
