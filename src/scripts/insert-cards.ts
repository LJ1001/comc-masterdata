import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";

const connectionString = "postgresql://comc:comc@localhost:5432/comc";
const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });

import { insertCards } from "../cards/insert";

const __dirname = dirname(fileURLToPath(import.meta.url));
const CARDS_PATH = join(__dirname, "../data/cards/all-mapped-cards.json");

insertCards(prisma, CARDS_PATH, console)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
