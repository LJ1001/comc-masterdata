import {
  createAndConfigureIndex,
  IndexConfig,
} from "../meilisearch/create-search-index";
import { wait } from "../meilisearch/wait";
import { Logger } from "../types";

const masterKey = process.env.MEILI_MASTER_KEY || "comc-meilisearch-master-key";

const cardSetsConfig: IndexConfig = {
  primaryKey: "id",
  searchableAttributes: ["name", "setCode", "slug"],
  sortableAttributes: ["name", "releaseDate", "categories"],
  displayedAttributes: [
    "id",
    "name",
    "slug",
    "setCode",
    "releaseDate",
    "categories",
  ],
};

const cardsConfig: IndexConfig = {
  primaryKey: "id",
  searchableAttributes: ["nameEn", "passcode"],
  filterableAttributes: [
    "cardType",
    "spellTrapAttribute",
    "category",
    "categories",
    "monsterType",
    "attribute",
    "level",
    "rank",
    "link",
    "linkArrows",
  ],
  sortableAttributes: ["nameEn", "atk", "def", "level", "rank", "link"],
  displayedAttributes: [
    "id",
    "nameEn",
    "nameDe",
    "slug",
    "textEn",
    "textDe",
    "cardType",
    "passcode",
    "spellTrapAttribute",
    "imagePath",
    "category",
    "categories",
    "monsterType",
    "attribute",
    "atk",
    "def",
    "level",
    "rank",
    "link",
    "linkArrows",
    "pendulumTextEn",
    "pendulumTextDe",
    "pendulumScale",
  ],
};

const cardsVariantsConfig: IndexConfig = {
  primaryKey: "id",
  searchableAttributes: ["card.nameEn", "card.passcode"],
  filterableAttributes: [
    "rarityCode",
    "rarity",
    "language",
    "cardSet",
    "card.cardType",
    "card.spellTrapAttribute",
    "card.category",
    "card.categories",
    "card.monsterType",
    "card.attribute",
    "card.level",
    "card.rank",
    "card.link",
    "card.linkArrows",
  ],
  sortableAttributes: [
    "rarityCode",
    "rarity",
    "card.nameEn",
    "card.atk",
    "card.def",
    "card.level",
    "card.rank",
    "card.link",
  ],
  displayedAttributes: [
    "id",
    "number",
    "language",
    "slug",
    "rarity",
    "rarityCode",
    "imagePath",
    "cardId",
    "cardSetId",
    "card.id",
    "card.nameEn",
    "card.nameDe",
    "card.slug",
    "card.textEn",
    "card.textDe",
    "card.cardType",
    "card.passcode",
    "card.spellTrapAttribute",
    "card.imagePath",
    "card.category",
    "card.categories",
    "card.monsterType",
    "card.attribute",
    "card.atk",
    "card.def",
    "card.level",
    "card.rank",
    "card.link",
    "card.linkArrows",
    "card.pendulumTextEn",
    "card.pendulumTextDe",
    "card.pendulumScale",
  ],
};

async function main(logger: Logger | undefined) {
  await createAndConfigureIndex("cardSets", cardSetsConfig, masterKey, logger);
  await wait(masterKey, console);
  await createAndConfigureIndex("cards", cardsConfig, masterKey, logger);
  await wait(masterKey, console);
  await createAndConfigureIndex(
    "cardVariants",
    cardsVariantsConfig,
    masterKey,
    logger,
  );
  await wait(masterKey, console);
  logger?.log("All indices created successfully");
}

main(console).catch((e) => {
  console.error(e);
  process.exit(1);
});
