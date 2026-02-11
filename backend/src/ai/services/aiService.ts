import fs from "fs";
import path from "path";

import { callModel, ChatMessage } from "./aiClient";
import { TaskName, TASK_REGISTRY } from "../taskRegistry";
import { parseJsonStrict, validateWithSchema } from "../utils/jsonValidator";

type RunOptions = {
  allowFallback?: boolean;
};

type JsonRunResult<T> = {
  ok: boolean;
  data: T;
  meta: {
    task: TaskName;
    attempts: number;
    usedFallback: boolean;
    validationError?: any;
    parseError?: any;
  };
};

// Load system prompt once
const systemPrompt = fs.readFileSync(
  path.join(process.cwd(), "src/ai/prompts/system_ro.txt"),
  "utf-8"
);

function loadPrompt(promptFile: string) {
  return fs.readFileSync(
    path.join(process.cwd(), `src/ai/prompts/${promptFile}`),
    "utf-8"
  );
}

function loadSchema(schemaFile: string) {
  const raw = fs.readFileSync(
    path.join(process.cwd(), `src/ai/schemas/${schemaFile}`),
    "utf-8"
  );
  return JSON.parse(raw);
}

function render(template: string, vars: Record<string, string>) {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{{${k}}}`, v);
  }
  return out;
}

function defaultFallback(task: TaskName) {
  if (task === "nl_to_query") {
    return {
      time_range: "all_time",
      custom_range: null,
      city: null,
      merchant: null,
      service_type: null,
      limit: 20,
      sort: "recent"
    };
  }

  if (task === "merchant_identity_resolution") {
    return {
      canonical_merchant: "Unknown",
      clean_display_name: "Unknown",
      confidence: 0.0,
      service_type: "Altele",
      pos_explanation: "Nu am suficiente informații pentru a identifica comerciantul."
    };
  }

  return {};
}

/**
 * Runs a JSON task:
 * - builds messages with system prompt
 * - calls model
 * - parses JSON
 * - validates with schema
 * - retries once with repair prompt
 * - fallback if still invalid (optional)
 */
export async function runJsonTask<T>(
  task: TaskName,
  input: Record<string, any>,
  options: RunOptions = {}
): Promise<JsonRunResult<T>> {
  const def = TASK_REGISTRY[task];
  const schema = loadSchema(def.schemaFile);
  const taskPromptTpl = loadPrompt(def.promptFile);

  const vars: Record<string, string> = {};

  // Fill template vars per task
  if (task === "nl_to_query") {
    vars["QUERY_RO"] = String(input.query_ro ?? "");
    vars["TODAY"] = String(input.today ?? "");
  }

  if (task === "merchant_identity_resolution") {
    vars["POS_TEXT"] = String(input.pos_text ?? "");
    vars["MCC"] = String(input.mcc ?? "");
    vars["CITY"] = String(input.city ?? "");
    vars["COUNTRY"] = String(input.country ?? "");
    vars["KNOWN_MERCHANTS_JSON"] = JSON.stringify(input.known_merchants ?? [], null, 2);
  }

  const userPrompt = render(taskPromptTpl, vars);

  // Attempt 1
  const messages1: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt }
  ];

  const out1 = await callModel(messages1);
  const parsed1 = parseJsonStrict(out1);
  if (parsed1.ok) {
    const valid1 = validateWithSchema<T>(schema, parsed1.data);
    if (valid1.ok) {
      return {
        ok: true,
        data: valid1.data,
        meta: { task, attempts: 1, usedFallback: false }
      };
    }
  }

  // Attempt 2 (repair)
  const repairPrompt =
    `The previous output was invalid or did not match the schema.\n\n` +
    `Return ONLY valid JSON that matches this schema exactly:\n` +
    `${JSON.stringify(schema, null, 2)}\n\n` +
    `Previous output:\n` +
    `${out1}\n\n` +
    `Return ONLY JSON.`;

  const messages2: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: repairPrompt }
  ];

  const out2 = await callModel(messages2);
  const parsed2 = parseJsonStrict(out2);
  if (parsed2.ok) {
    const valid2 = validateWithSchema<T>(schema, parsed2.data);
    if (valid2.ok) {
      return {
        ok: true,
        data: valid2.data,
        meta: { task, attempts: 2, usedFallback: false }
      };
    }

    // fallback
    if (options.allowFallback) {
      return {
        ok: true,
        data: defaultFallback(task) as T,
        meta: { task, attempts: 2, usedFallback: true, validationError: valid2.details }
      };
    }

    return {
      ok: false,
      data: defaultFallback(task) as T,
      meta: { task, attempts: 2, usedFallback: false, validationError: valid2.details }
    };
  }

  // parse failed on retry too
  if (options.allowFallback) {
    return {
      ok: true,
      data: defaultFallback(task) as T,
      meta: { task, attempts: 2, usedFallback: true, parseError: parsed2.details }
    };
  }

  return {
    ok: false,
    data: defaultFallback(task) as T,
    meta: { task, attempts: 2, usedFallback: false, parseError: parsed2.details }
  };
}
