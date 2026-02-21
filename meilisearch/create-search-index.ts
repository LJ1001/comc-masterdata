import { Logger } from "../types";

const MEILI_URL = process.env.MEILI_URL || "http://localhost:7700";

type IndexConfig = {
  primaryKey?: string;
  searchableAttributes?: string[];
  filterableAttributes?: string[];
  sortableAttributes?: string[];
  displayedAttributes?: string[];
};

export async function createAndConfigureIndex(
  indexName: string,
  indexConfig: IndexConfig,
  masterKey: string,
  logger: Logger | undefined,
) {
  logger?.log(`Creating index "${indexName}"...`);

  // Create the index
  const createResponse = await fetch(`${MEILI_URL}/indexes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${masterKey}`,
    },
    body: JSON.stringify({
      uid: indexName,
      primaryKey: indexConfig.primaryKey,
    }),
  });

  if (!createResponse.ok && createResponse.status !== 202) {
    throw new Error(
      `Failed to create index ${indexName}: ${createResponse.statusText}`,
    );
  }

  logger?.log(`Index "${indexName}" creation task enqueued`);

  // Configure all settings in one request
  const { primaryKey, ...settings } = indexConfig;
  logger?.log(`Configuring settings for "${indexName}"...`);

  const settingsResponse = await fetch(
    `${MEILI_URL}/indexes/${indexName}/settings`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${masterKey}`,
      },
      body: JSON.stringify(settings),
    },
  );

  if (!settingsResponse.ok && settingsResponse.status !== 202) {
    throw new Error(
      `Failed to configure index ${indexName}: ${settingsResponse.statusText}`,
    );
  }

  logger?.log(`Index "${indexName}" configured`);
}

export type { IndexConfig };
