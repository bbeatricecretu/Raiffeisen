import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { runJsonTask } from "./ai/services/aiService";
import { TASKS } from "./ai/taskRegistry";

dotenv.config({ path: "./.env" });

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT ? Number(process.env.PORT) : 3001;

// Health
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Basic AI connectivity test (doesn't require schema)
app.get("/test-ai", async (req, res) => {
  try {
    const out = await runJsonTask(
      TASKS.nl_to_query,
      {
        query_ro: "arată-mi plățile la benzinării din Cluj săptămâna trecută",
        today: new Date().toISOString().slice(0, 10)
      },
      { allowFallback: true }
    );

    res.json({ ok: true, sampleParsedQuery: out.data, meta: out.meta });
  } catch (err: any) {
    res.status(500).json({ ok: false, error: err?.message || String(err) });
  }
});

/**
 * REAL endpoint: NL -> JSON query (validated, retry, fallback)
 * Body: { query: string, today?: "YYYY-MM-DD" }
 */
app.post("/search/parse", async (req, res) => {
  try {
    const query = String(req.body?.query ?? "").trim();
    if (!query) {
      return res.status(400).json({ error: "Missing 'query' in body." });
    }

    const today = String(req.body?.today ?? new Date().toISOString().slice(0, 10));

    const out = await runJsonTask(
      TASKS.nl_to_query,
      { query_ro: query, today },
      { allowFallback: true }
    );

    res.json(out);
  } catch (err: any) {
    res.status(500).json({ error: err?.message || String(err) });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health: http://localhost:${PORT}/health`);
});
