import { populateIndex } from "../meilisearch/populate-index";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client";
import { Logger } from "../types";

const connectionString = "postgresql://comc:comc@localhost:5432/comc";
const adapter = new PrismaPg({ connectionString });
export const prisma = new PrismaClient({ adapter });

const MEILI_MASTER_KEY =
  process.env.MEILI_MASTER_KEY || "comc-meilisearch-master-key";

async function main(logger: Logger | undefined) {
  logger?.log("Fetching variants including cards from database...");
  const variants = await prisma.cardVariant.findMany({
    include: { card: true },
  });
  logger?.log(`Found ${variants.length} variants`);

  await populateIndex("cardVariants", variants, MEILI_MASTER_KEY, logger);
}

main(console)
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
