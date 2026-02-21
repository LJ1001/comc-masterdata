import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateSetsSql } from "../sets/generate-sql";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUTPUT_PATH = join(__dirname, "../data/sets/insert-sets.sql");

const sets = [
  { folder: "core", categories: ["core"] },
  { folder: "structure-decks", categories: ["decks", "structure-decks"] },
  { folder: "starter-decks", categories: ["decks", "starter-decks"] },
  { folder: "tournament", categories: ["tournament"] },
];

async function main() {
  const allSql: string[] = [];

  for (const { folder, categories } of sets) {
    const setsPath = join(__dirname, "../data/sets", folder, "sets.json");
    console.log(`\nGenerating SQL for ${folder}...`);
    const rawSets = JSON.parse(await readFile(setsPath, "utf-8"));
    const sql = generateSetsSql(rawSets, categories, console);
    allSql.push(sql);
  }

  await writeFile(OUTPUT_PATH, allSql.join("\n"), "utf-8");
  console.log(`\nWritten SQL to ${OUTPUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
