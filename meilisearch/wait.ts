import { Logger } from "../types";

const MEILI_URL = process.env.MEILI_URL || "http://localhost:7700";

interface Task {
  uid: number;
  status: "enqueued" | "processing" | "succeeded" | "failed" | "canceled";
}

interface TasksResponse {
  results: Task[];
}

async function getPendingTasks(masterKey: string): Promise<Task[]> {
  const response = await fetch(
    `${MEILI_URL}/tasks?statuses=enqueued,processing`,
    {
      headers: {
        Authorization: `Bearer ${masterKey}`,
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to fetch tasks: ${response.statusText}`);
  }
  const data: TasksResponse = await response.json();
  return data.results;
}

export async function wait(masterKey: string, logger: Logger | undefined) {
  logger?.log("Waiting for all Meilisearch tasks to complete...");

  while (true) {
    const pendingTasks = await getPendingTasks(masterKey);

    if (pendingTasks.length === 0) {
      logger?.log("All tasks completed");
      break;
    }

    logger?.log(`${pendingTasks.length} tasks still pending...`);
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}
