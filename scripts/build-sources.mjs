/**
 * Reads data/rawsources.md and writes data/generated/raw-sources.json.
 * Runs before `dev` and `build` so edits to the markdown file show up.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parsePlaces } from "./parse-places.mjs";
import { parseRawSources } from "./parse-raw-sources.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const input = resolve(root, "data/rawsources.md");
const output = resolve(root, "data/generated/raw-sources.json");

const { sources, warnings } = parseRawSources(readFileSync(input, "utf8"));
for (const warning of warnings) process.stderr.write(`[build-sources] ${warning}\n`);

mkdirSync(dirname(output), { recursive: true });
writeFileSync(output, `${JSON.stringify({ generatedAt: new Date().toISOString(), sources }, null, 2)}\n`);
process.stdout.write(`[build-sources] ${sources.length} sources -> data/generated/raw-sources.json\n`);

const placesInput = resolve(root, "data/places.md");
const placesOutput = resolve(root, "data/generated/curated-places.json");
const { places, warnings: placeWarnings } = parsePlaces(readFileSync(placesInput, "utf8"));
for (const warning of placeWarnings) process.stderr.write(`[build-sources] places.md: ${warning}\n`);
writeFileSync(placesOutput, `${JSON.stringify({ generatedAt: new Date().toISOString(), places }, null, 2)}\n`);
process.stdout.write(`[build-sources] ${places.length} places -> data/generated/curated-places.json\n`);
