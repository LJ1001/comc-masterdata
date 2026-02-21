import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { fetchSingleSets } from "../sets/fetch-single";

const __dirname = dirname(fileURLToPath(import.meta.url));

const setType = process.argv[2];
if (!setType) {
  console.error(
    "Usage: fetch-single-sets <set-type>\n" +
      "Example: fetch-single-sets structure-decks",
  );
  process.exit(1);
}

const setsPath = join(__dirname, "../data/sets", setType, "sets.json");
const outputDir = join(__dirname, "../data/sets", setType);

fetchSingleSets(setsPath, outputDir, console).catch(console.error);
