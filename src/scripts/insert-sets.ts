import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const connectionString = "postgresql://comc:comc@localhost:5432/comc";
const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });

import { insertSets } from "../sets/insert";

const __dirname = dirname(fileURLToPath(import.meta.url));

const sets = [
  { folder: "core", categories: ["core"] },
  { folder: "structure-decks", categories: ["decks", "structure-decks"] },
  { folder: "starter-decks", categories: ["decks", "starter-decks"] },
  { folder: "tournament", categories: ["tournament"] },
];

async function main() {
  for (const { folder, categories } of sets) {
    const setsPath = join(__dirname, "../data/sets", folder, "sets.json");
    console.log(`\nInserting sets for ${folder}...`);
    await insertSets(prisma, setsPath, categories, console);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
