import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { Logger } from "../types";

interface SetSummary {
  slug: string;
}

async function fetchSet(slug: string): Promise<unknown> {
  const url = `https://cardcluster.de/api/sets/${slug}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch set ${slug}: ${response.statusText}`);
  }
  return response.json();
}

export async function fetchSingleSets(
  setsPath: string,
  outputDir: string,
  logger: Logger | undefined,
) {
  logger?.log("Reading sets from", setsPath);

  const sets: SetSummary[] = JSON.parse(await readFile(setsPath, "utf-8"));
  logger?.log(`Found ${sets.length} sets`);

  // Ensure output directory exists
  await mkdir(outputDir, { recursive: true });

  for (let i = 0; i < sets.length; i++) {
    const set = sets[i];
    logger?.log(`Fetching set ${i + 1}/${sets.length}: ${set.slug}...`);

    const setData = await fetchSet(set.slug);
    const outputPath = join(outputDir, `${set.slug}.json`);
    await writeFile(outputPath, JSON.stringify(setData, null, 2));

    logger?.log(`Saved to ${outputPath}`);
  }

  logger?.log(`Fetched and saved ${sets.length} sets`);
}
