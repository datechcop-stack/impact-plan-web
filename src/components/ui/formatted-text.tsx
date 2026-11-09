import { cn } from "@/lib/utils";

type Block = { kind: "ul" | "ol"; items: string[] } | { kind: "p"; text: string };

const BULLET = /^\s*[-*•]\s+(.*)$/;
const NUMBERED = /^\s*\d+[.)]\s+(.*)$/;

/** "• one • two" typed on a single line becomes two bullet lines. */
function splitInlineBullets(line: string): string[] {
  if (!/^\s*•/.test(line) || line.split("•").length <= 2) return [line];
  return line
    .split("•")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `• ${part}`);
}

export function parseFormattedText(text: string): Block[] {
  const lines = text.replace(/\r\n?/g, "\n").split("\n").flatMap(splitInlineBullets);
  const blocks: Block[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const bullet = line.match(BULLET);
    const numbered = bullet ? null : line.match(NUMBERED);
    const kind = bullet ? "ul" : numbered ? "ol" : "p";
    const content = (bullet?.[1] ?? numbered?.[1] ?? line).trim();
    const last = blocks.at(-1);
    if (kind !== "p" && last && last.kind === kind) {
      last.items.push(content);
    } else if (kind === "p") {
      blocks.push({ kind, text: content });
    } else {
      blocks.push({ kind, items: [content] });
    }
  }
  return blocks;
}

type FormattedTextProps = {
  text: string | null | undefined;
  className?: string;
  /** Shown when the text is empty. */
  fallback?: string;
};

/** Renders saved plain text with its line breaks, bullet lists and numbered lists intact. */
export function FormattedText({ text, className, fallback = "—" }: FormattedTextProps) {
  const blocks = text ? parseFormattedText(text) : [];
  if (!blocks.length) {
    return <p className={cn("text-sm text-muted", className)}>{fallback}</p>;
  }
  return (
    <div className={cn("space-y-1.5 text-sm", className)}>
      {blocks.map((block, index) =>
        block.kind === "p" ? (
          <p key={index} className="break-words">
            {block.text}
          </p>
        ) : block.kind === "ul" ? (
          <ul key={index} className="list-disc space-y-1 pl-5">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="break-words">
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <ol key={index} className="list-decimal space-y-1 pl-5">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="break-words">
                {item}
              </li>
            ))}
          </ol>
        ),
      )}
    </div>
  );
}

/** Small uppercase label used above each section of a submitted entry. */
export function FieldHeading({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <p className={cn("text-[11px] font-bold uppercase tracking-wide text-muted", className)}>
      {children}
    </p>
  );
}
