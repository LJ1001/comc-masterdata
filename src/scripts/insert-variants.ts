import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const connectionString = "postgresql://comc:comc@localhost:5432/comc";
const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });

import { insertVariants } from "../variants/insert";

const __dirname = dirname(fileURLToPath(import.meta.url));

const variantsPath = join(
  __dirname,
  "../data/variants",
  "all-mapped-variants.json",
);

async function main() {
  await insertVariants(prisma, variantsPath, console);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
