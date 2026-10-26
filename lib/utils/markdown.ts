export type MarkdownBlock =
  | { type: "heading"; text: string }
  | { type: "list"; items: string[] }
  | { type: "paragraph"; text: string };

/**
 * Parses the small markdown subset used in listing text: "## headings",
 * "- bullets" and paragraphs. Inline **bold** is handled by `splitBold`.
 */
export function parseMarkdown(source: string): MarkdownBlock[] {
  const blocks: MarkdownBlock[] = [];
  let paragraph: string[] = [];
  let items: string[] = [];

  const flush = () => {
    if (paragraph.length) blocks.push({ type: "paragraph", text: paragraph.join(" ") });
    if (items.length) blocks.push({ type: "list", items });
    paragraph = [];
    items = [];
  };

  for (const raw of source.split(/\r?\n/)) {
    const line = raw.trim();
    const heading = /^#{1,6}\s+(.+)$/.exec(line);
    const bullet = /^[-*•]\s+(.+)$/.exec(line);
    if (!line) flush();
    else if (heading) {
      flush();
      blocks.push({ type: "heading", text: heading[1] });
    } else if (bullet) {
      if (paragraph.length) flush();
      items.push(bullet[1]);
    } else {
      if (items.length) flush();
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}

/** Splits text on **bold** markers so it can be rendered without raw HTML. */
export function splitBold(text: string): Array<{ text: string; bold: boolean }> {
  return text
    .split(/\*\*(.+?)\*\*/g)
    .map((part, index) => ({ text: part, bold: index % 2 === 1 }))
    .filter((part) => part.text);
}
