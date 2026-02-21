import { readdirSync } from "fs";
import { writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { filterSetNumbers } from "../variants/map-variants";

const __dirname = dirname(fileURLToPath(import.meta.url));
const setsDir = join(__dirname, "../data/sets");
const outputPath = join(setsDir, "sets.json");

const folders = readdirSync(setsDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name);

const allSetNumbers = [
  ...new Set(
    folders.flatMap((folder) => {
      const setsPath = join(setsDir, folder, "sets.json");
      return filterSetNumbers(setsPath);
    }),
  ),
];

const output = allSetNumbers.map((setNumber) => ({ setNumber }));
writeFileSync(outputPath, JSON.stringify(output, null, 2) + "\n");
console.log(
  `Wrote ${allSetNumbers.length} set numbers from ${folders.length} folders to ${outputPath}`,
);
