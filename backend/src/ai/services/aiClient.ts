import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function callModel(messages: any[]) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", 
    messages,
    temperature: 0
  });

  return response.choices[0].message.content;
}
