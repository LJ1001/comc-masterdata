import { readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { generateVariantsSql } from "../variants/generate-sql";

const __dirname = dirname(fileURLToPath(import.meta.url));
const VARIANTS_PATH = join(
  __dirname,
  "../data/variants",
  "all-mapped-variants.json",
);
const OUTPUT_PATH = join(__dirname, "../data/variants/insert-variants.sql");

async function main() {
  console.log("Reading variants from", VARIANTS_PATH);
  const rawVariants = JSON.parse(await readFile(VARIANTS_PATH, "utf-8"));
  console.log(`Found ${rawVariants.length} raw variants`);

  const sql = generateVariantsSql(rawVariants, console);

  await writeFile(OUTPUT_PATH, sql, "utf-8");
  console.log(`Written SQL to ${OUTPUT_PATH}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
