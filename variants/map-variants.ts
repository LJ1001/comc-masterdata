import { readFileSync } from "fs";
import { CardData } from "../cards/map-cards";

export interface CardVariant {
  number: string;
  language: string;
  slug: string;
  slugLanguage: string;
  rarity: string;
  rarityCode: string;
  cardSlug: string;
  cardSet: string;
}

const RARITY_MAP: Record<number, { name: string; code: string }> = {
  1: { name: "Common", code: "C" },
  3: { name: "Rare", code: "R" },
  4: { name: "Super Rare", code: "SR" },
  5: { name: "Ultra Rare", code: "UR" },
  6: { name: "Ultimate Rare", code: "UMR" },
  7: { name: "Secret Rare", code: "SCR" },
};

const SUPPORTED_LANGUAGES = ["en", "de"];

export function filterSetNumbers(setsPath: string): string[] {
  const sets: { setNumber: string }[] = JSON.parse(
    readFileSync(setsPath, "utf-8"),
  );
  return sets.map((s) => s.setNumber);
}

export function mapVariants(
  cardData: CardData,
  allowedSets: string[],
): CardVariant[] {
  const { slug, prints } = cardData.data;
  const allowedSetNumbers = new Set(allowedSets);

  return prints
    .filter(
      (print) =>
        allowedSetNumbers.has(print.set.setNumber) &&
        print.rarity in RARITY_MAP,
    )
    .flatMap((print) => {
      const { name: rarity, code: rarityCode } = RARITY_MAP[print.rarity];
      if (!rarity) throw Error(`unknown rarity ${rarity}`);
      const setNumber = print.set.setNumber;
      const number = print.cardNumber;
      const rc = rarityCode.toLowerCase();
      const variantSlug = `${slug}-${setNumber}-${number}-${rc}`.toLowerCase();

      return print.set.languages
        .filter((l) => SUPPORTED_LANGUAGES.includes(l.language))
        .map((l) => {
          const lang = l.language.toUpperCase();
          const langSlug =
            `${slug}-${setNumber}-${l.language}${number}-${rc}`.toLowerCase();

          return {
            number,
            language: lang,
            slug: variantSlug,
            slugLanguage: langSlug,
            rarity,
            rarityCode,
            cardSlug: slug,
            cardSet: setNumber,
          };
        });
    });
}
