import { tavily } from "@tavily/core";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

let client: ReturnType<typeof tavily> | null = null;

function getClient() {
  if (!client) client = tavily({ apiKey: env.TAVILY_API_KEY });
  return client;
}

export async function searchSupplemental(query: string, maxResults = 5): Promise<string[]> {
  try {
    const result = await getClient().search(query, { searchDepth: "basic", maxResults });
    return result.results.map((r) => `${r.title}: ${r.content}`.slice(0, 400));
  } catch (err) {
    logger.warn({ err, query }, "Tavily supplemental search failed, continuing without it");
    return [];
  }
}
