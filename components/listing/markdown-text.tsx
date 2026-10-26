import { parseMarkdown, splitBold } from "@/lib/utils/markdown";

function Inline({ text }: { text: string }) {
  return (
    <>
      {splitBold(text).map((part, index) =>
        part.bold ? <strong key={index} className="font-semibold text-foreground">{part.text}</strong> : part.text,
      )}
    </>
  );
}

/** Renders listing markdown as React elements (never raw HTML). */
export function MarkdownText({ source }: { source: string }) {
  return (
    <div className="space-y-2.5 text-sm leading-relaxed">
      {parseMarkdown(source).map((block, index) => {
        if (block.type === "heading") {
          return (
            <h3 key={index} className="pt-1.5 text-sm font-semibold">
              <Inline text={block.text} />
            </h3>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={index} className="list-disc space-y-1 pl-5 text-muted-foreground marker:text-primary">
              {block.items.map((item, i) => (
                <li key={i}>
                  <Inline text={item} />
                </li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="text-muted-foreground">
            <Inline text={block.text} />
          </p>
        );
      })}
    </div>
  );
}
