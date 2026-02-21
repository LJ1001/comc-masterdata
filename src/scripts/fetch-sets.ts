import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { fetchSets } from "../sets/fetch-all";

const __dirname = dirname(fileURLToPath(import.meta.url));

const [category, category2, setType] = process.argv.slice(2);
if (!category || !category2 || !setType) {
  console.error(
    "Usage: fetch-sets <category> <category2> <set-type>\n" +
      "Example: fetch-sets decks structure-decks structure-decks",
  );
  process.exit(1);
}

const outputPath = join(__dirname, "../data/sets", setType, "sets.json");

fetchSets(category, category2, outputPath, console).catch(console.error);
