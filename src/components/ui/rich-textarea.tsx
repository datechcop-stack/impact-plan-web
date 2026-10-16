"use client";

import { useRef } from "react";
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

function handleListEnter(
  value: string,
  selectionStart: number,
): { nextValue: string; cursor: number } | null {
  const before = value.slice(0, selectionStart);
  const after = value.slice(selectionStart);
  const lineStart = before.lastIndexOf("\n") + 1;
  const currentLine = before.slice(lineStart);

  const bulletMatch = currentLine.match(/^(\s*)([-*•]\s)(.*)$/);
  if (bulletMatch) {
    const [, indent, , content] = bulletMatch;
    const trimmed = content.trim();
    if (!trimmed) {
      const nextValue = before.slice(0, lineStart) + indent + after;
      return { nextValue, cursor: lineStart + indent.length };
    }
    const insert = `\n${indent}• `;
    const nextValue = before + insert + after;
    return { nextValue, cursor: selectionStart + insert.length };
  }

  const numberMatch = currentLine.match(/^(\s*)(\d+)\.\s(.*)$/);
  if (numberMatch) {
    const [, indent, numText, content] = numberMatch;
    const trimmed = content.trim();
    if (!trimmed) {
      const nextValue = before.slice(0, lineStart) + indent + after;
      return { nextValue, cursor: lineStart + indent.length };
    }
    const nextNum = Number.parseInt(numText, 10) + 1;
    const insert = `\n${indent}${nextNum}. `;
    const nextValue = before + insert + after;
    return { nextValue, cursor: selectionStart + insert.length };
  }

  return null;
}

export function RichTextarea({ id, value, onChange, placeholder, className }: RichTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => onChange(value.trim() ? prefixLines(value, "• ") : "• ")}
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
              lines.length
                ? lines
                    .map((line, index) => {
                      const stripped = line.replace(/^(\d+\.|[-*•])\s*/, "").trimStart();
                      return `${index + 1}. ${stripped}`;
                    })
                    .join("\n")
                : "1. ",
            );
          }}
        >
          Number list
        </Button>
      </div>
      <Textarea
        ref={textareaRef}
        id={id}
        className={cn("min-h-[120px] font-mono text-sm leading-relaxed", className)}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter" || event.shiftKey) return;
          const result = handleListEnter(value, event.currentTarget.selectionStart);
          if (!result) return;
          event.preventDefault();
          onChange(result.nextValue);
          requestAnimationFrame(() => {
            const el = textareaRef.current;
            if (!el) return;
            el.focus();
            el.setSelectionRange(result.cursor, result.cursor);
          });
        }}
      />
    </div>
  );
}
