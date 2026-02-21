import { wait } from "./wait";
import { Logger } from "../types";

const MEILI_URL = process.env.MEILI_URL || "http://localhost:7700";

export async function populateIndex<T>(
  indexName: string,
  documents: T[],
  masterKey: string,
  logger: Logger | undefined,
): Promise<void> {
  logger?.log(`Indexing ${documents.length} documents in "${indexName}"...`);

  const response = await fetch(`${MEILI_URL}/indexes/${indexName}/documents`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${masterKey}`,
    },
    body: JSON.stringify(documents),
  });

  if (!response.ok && response.status !== 202) {
    throw new Error(
      `Failed to index documents in ${indexName}: ${response.statusText}`,
    );
  }

  logger?.log(`Indexing task enqueued for "${indexName}"`);

  await wait(masterKey, logger);

  logger?.log(`"${indexName}" indexed successfully`);
}
