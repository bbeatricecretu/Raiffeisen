export const TASKS = {
  nl_to_query: "nl_to_query",
  merchant_identity: "merchant_identity_resolution"
} as const;

export type TaskName = (typeof TASKS)[keyof typeof TASKS];

type TaskDef = {
  name: TaskName;
  promptFile: string;
  schemaFile: string;
  type: "json";
};

export const TASK_REGISTRY: Record<TaskName, TaskDef> = {
  nl_to_query: {
    name: "nl_to_query",
    promptFile: "nl_to_query.txt",
    schemaFile: "nl_to_query.schema.json",
    type: "json"
  },
  merchant_identity_resolution: {
    name: "merchant_identity_resolution",
    promptFile: "merchant_identity.txt",
    schemaFile: "merchant_identity.schema.json",
    type: "json"
  }
};
