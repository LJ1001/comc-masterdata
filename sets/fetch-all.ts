import { writeFileSync, mkdirSync } from "fs";
import { dirname } from "path";
import { Logger } from "../types";

interface Set {
  image: string | null;
  format: number;
  name: string;
  releaseEu: string | null;
  releaseEuDayUnknown: boolean;
  releaseEuMonthUnknown: boolean;
  releaseNa: string | null;
  releaseNaDayUnknown: boolean;
  releaseNaMonthUnknown: boolean;
  tcgNotConfirmed: boolean;
  setNumber: string;
  slug: string;
  cardSlugs: string[] | null;
  artworkIds: number[] | null;
  printsCount: number | null;
  spoilerTotalPrints: number | null;
}

interface ApiResponse {
  data: Set[];
  meta: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

async function fetchPage(
  category: string,
  category2: string,
  page: number,
): Promise<ApiResponse> {
  const url = `https://cardcluster.com/api/sets?category=${encodeURIComponent(category)}&category2=${encodeURIComponent(category2)}&sortBy=releaseAsc&page=${page}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch page ${page}: ${response.statusText}`);
  }
  return response.json();
}

async function fetchAllSets(
  category: string,
  category2: string,
  logger: Logger | undefined,
): Promise<Set[]> {
  const allSets: Set[] = [];

  // Fetch first page to get total pages
  const firstPage = await fetchPage(category, category2, 1);
  allSets.push(...firstPage.data);
  const totalPages = firstPage.meta.last_page;

  logger?.log(
    `Total pages: ${totalPages}, Total sets: ${firstPage.meta.total}`,
  );

  // Fetch remaining pages
  for (let page = 2; page <= totalPages; page++) {
    logger?.log(`Fetching page ${page}/${totalPages}...`);
    const pageData = await fetchPage(category, category2, page);
    allSets.push(...pageData.data);
  }

  return allSets;
}

export async function fetchSets(
  category: string,
  category2: string,
  outputPath: string,
  logger: Logger | undefined,
) {
  logger?.log(
    `Fetching sets from cardcluster.com (category=${category}, category2=${category2})...`,
  );

  const allSets = await fetchAllSets(category, category2, logger);

  const now = new Date();
  const sets = allSets.filter((set) => {
    const releaseDate = set.releaseEu ?? set.releaseNa;
    return releaseDate && new Date(releaseDate) <= now;
  });

  logger?.log(
    `Fetched ${allSets.length} sets, ${sets.length} already released`,
  );

  // Ensure directory exists
  mkdirSync(dirname(outputPath), { recursive: true });

  // Write to file
  writeFileSync(outputPath, JSON.stringify(sets, null, 2));

  logger?.log(`Saved to ${outputPath}`);
}
