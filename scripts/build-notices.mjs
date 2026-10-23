/**
 * Writes THIRD_PARTY_NOTICES.md: the licence text of every direct dependency, copied from
 * node_modules, so the copyright and permission notices ship with the project.
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const pkg = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const LICENSE_FILES = ["LICENSE", "LICENSE.md", "LICENSE.txt", "license", "License", "LICENCE", "LICENSE-MIT"];

const sections = Object.keys(pkg.dependencies ?? {})
  .sort()
  .map((name) => {
    const dir = join(root, "node_modules", name);
    const meta = JSON.parse(readFileSync(join(dir, "package.json"), "utf8"));
    const file = LICENSE_FILES.map((f) => join(dir, f)).find(existsSync);
    const text = file ? readFileSync(file, "utf8").trim() : `(No licence file shipped. Declared licence: ${meta.license}.)`;
    return `## ${name} ${meta.version} (${meta.license})\n\n\`\`\`text\n${text}\n\`\`\``;
  });

const header =
  "# Third-party notices\n\nSAKLAW uses the open-source packages below. Their licence texts are reproduced as required.\nMap data, imagery and fonts are credited on the in-app About page (data/credits.ts).\n\n";
writeFileSync(join(root, "THIRD_PARTY_NOTICES.md"), `${header}${sections.join("\n\n")}\n`);
console.log(`[build-notices] ${sections.length} packages -> THIRD_PARTY_NOTICES.md`);
