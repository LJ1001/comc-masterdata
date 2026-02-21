import { fetchAllCards } from "../cards/fetch-all";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const setType = process.argv[2];
if (!setType) {
  console.error("Usage: fetch-cards <set-type> (e.g. structure-decks, core)");
  process.exit(1);
}

const SETS_DIR = join(__dirname, "../data/sets", setType);
const CARDS_OUTPUT_DIR = join(__dirname, "../data/cards");

const characters = "abcdefghijklmnopqrstuvwxyz0123456789".split("");

async function main() {
  for (const char of characters) {
    await fetchAllCards(char, SETS_DIR, CARDS_OUTPUT_DIR, console);
  }
}

main().catch(console.error);
