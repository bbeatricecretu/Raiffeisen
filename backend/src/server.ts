// backend/src/server.ts
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import OpenAI from "openai";

dotenv.config({ path: "./.env" }); // important: ca sa citeasca backend/.env

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Validate API key early (but do NOT log the key itself)
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error(
    "Missing OPENAI_API_KEY. Add it to backend/.env as OPENAI_API_KEY=sk-..."
  );
}

// Create OpenAI client (only if key exists)
const openai = apiKey ? new OpenAI({ apiKey }) : null;

// Test AI endpoint
app.get("/test-ai", async (req, res) => {
  try {
    if (!openai) {
      return res.status(500).json({
        error:
          "OPENAI_API_KEY is missing. Add it to backend/.env and restart the server.",
      });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: "Raspunde concis si in limba romana." },
        { role: "user", content: "Spune salut in romana." },
      ],
    });

    const result = response.choices[0]?.message?.content ?? "";
    res.json({ result });
  } catch (err: any) {
    console.error("test-ai error:", err?.message || err);
    res.status(500).json({
      error: "AI call failed",
      details: err?.message || String(err),
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
