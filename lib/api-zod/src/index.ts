export * from "./generated/api";
// NOTE:
// `generated/api` already exports Zod schemas with names like `CreateProductBody`.
// Re-exporting `generated/types` here causes duplicate export names during TS build.
// Import generated TS types directly from `./generated/types` when needed.
