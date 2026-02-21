import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { generateCardsSql } from "../cards/generate-sql";
import type { CardMappedData } from "../cards/map-cards";
import type { Logger } from "../types";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CARDS_PATH = join(__dirname, "../data/cards/all-mapped-cards.json");
const OUTPUT_PATH = join(__dirname, "../data/cards/insert-cards.sql");

async function main(logger: Logger | undefined): Promise<void> {
  const cards: CardMappedData[] = JSON.parse(
    await readFile(CARDS_PATH, "utf-8"),
  );
  logger?.log(`Loaded ${cards.length} cards`);

  const sql = generateCardsSql(cards);

  await writeFile(OUTPUT_PATH, sql, "utf-8");
  logger?.log(`Written SQL to ${OUTPUT_PATH}`);
}

main(console);
