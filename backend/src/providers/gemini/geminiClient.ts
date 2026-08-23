import { GoogleGenAI } from "@google/genai";
import { env } from "../../config/env.js";
import { logger } from "../../utils/logger.js";

const MODEL = "gemini-3.6-flash";

let client: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  if (!client) client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  return client;
}

export async function generateStructured<T>(prompt: string, responseSchema: object): Promise<T> {
  const ai = getClient();
  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema,
    },
  });

  const text = response.text;
  if (!text) {
    logger.error({ response }, "Gemini returned no text content");
    throw new Error("Gemini returned an empty response");
  }
  return JSON.parse(text) as T;
}

export async function generateText(prompt: string): Promise<string> {
  const ai = getClient();
  const response = await ai.models.generateContent({ model: MODEL, contents: prompt });
  return response.text ?? "";
}
