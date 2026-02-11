import Ajv from "ajv";

const ajv = new Ajv({ allErrors: true });

export type ValidationOk<T> = { ok: true; data: T };
export type ValidationErr = { ok: false; error: string; details?: any };

export function parseJsonStrict(text: string): ValidationOk<any> | ValidationErr {
  try {
    const trimmed = text.trim();
    const obj = JSON.parse(trimmed);
    return { ok: true, data: obj };
  } catch (e: any) {
    return { ok: false, error: "Invalid JSON", details: e?.message || String(e) };
  }
}

export function validateWithSchema<T>(
  schema: object,
  data: any
): ValidationOk<T> | ValidationErr {
  const validate = ajv.compile(schema);
  const ok = validate(data);
  if (!ok) {
    return { ok: false, error: "Schema validation failed", details: validate.errors };
  }
  return { ok: true, data: data as T };
}
