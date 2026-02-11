import dotenv from "dotenv";
dotenv.config({ path: "./.env" });

import OpenAI from "openai";

const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  throw new Error("Missing credentials. Set OPENAI_API_KEY in backend/.env");
}

const openai = new OpenAI({ apiKey });

export type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export async function callModel(messages: ChatMessage[]) {
  const resp = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    temperature: 0,
    messages
  });

  return resp.choices[0]?.message?.content ?? "";
}
