"use client";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type RichTextareaProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
};

function prefixLines(value: string, prefix: string): string {
  const lines = value.split("\n");
  const next = lines.map((line) => {
    const trimmed = line.trimStart();
    if (!trimmed) return line;
    if (/^(\d+\.|[-*•])\s/.test(trimmed)) return line;
    return `${line.startsWith(" ") ? line.slice(0, line.length - trimmed.length) : ""}${prefix}${trimmed}`;
  });
  return next.join("\n");
}

export function RichTextarea({ id, value, onChange, placeholder, className }: RichTextareaProps) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onChange(prefixLines(value, "• "))}
        >
          Bullet list
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => {
            const lines = value.split("\n").filter((line) => line.trim());
            onChange(
              lines
                .map((line, index) => {
                  const stripped = line.replace(/^(\d+\.|[-*•])\s*/, "").trimStart();
                  return `${index + 1}. ${stripped}`;
                })
                .join("\n"),
            );
          }}
        >
          Number list
        </Button>
      </div>
      <Textarea
        id={id}
        className={cn("min-h-[120px] font-mono text-sm leading-relaxed", className)}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
      />
    </div>
  );
}
