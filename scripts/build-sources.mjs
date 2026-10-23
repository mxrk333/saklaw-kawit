/**
 * Reads data/rawsources.md and writes data/generated/raw-sources.json.
 * Runs before `dev` and `build` so edits to the markdown file show up.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseRawSources } from "./parse-raw-sources.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const input = resolve(root, "data/rawsources.md");
const output = resolve(root, "data/generated/raw-sources.json");

const { sources, warnings } = parseRawSources(readFileSync(input, "utf8"));
for (const warning of warnings) process.stderr.write(`[build-sources] ${warning}\n`);

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify({ generatedAt: new Date().toISOString(), sources }, null, 2)}\n`);
process.stdout.write(`[build-sources] ${sources.length} sources -> data/generated/raw-sources.json\n`);
