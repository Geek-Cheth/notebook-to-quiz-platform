"use client";

import katex from "katex";

import { cn } from "@/lib/utils";

type Segment =
  | { type: "text"; content: string }
  | { type: "math"; content: string };

/** Split a string into plain-text and inline-math ($...$) segments. */
export function splitMathSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  let buffer = "";
  let i = 0;

  while (i < text.length) {
    if (text[i] === "\\" && text[i + 1] === "$") {
      buffer += "$";
      i += 2;
      continue;
    }

    if (text[i] === "$") {
      if (buffer) {
        segments.push({ type: "text", content: buffer });
        buffer = "";
      }

      i++;
      let mathContent = "";
      let closed = false;

      while (i < text.length) {
        if (text[i] === "\\" && text[i + 1] === "$") {
          mathContent += "$";
          i += 2;
        } else if (text[i] === "$") {
          closed = true;
          i++;
          break;
        } else {
          mathContent += text[i];
          i++;
        }
      }

      if (closed && mathContent.length > 0) {
        segments.push({ type: "math", content: mathContent });
      } else {
        buffer += "$" + mathContent;
      }
      continue;
    }

    buffer += text[i];
    i++;
  }

  if (buffer) {
    segments.push({ type: "text", content: buffer });
  }

  return segments;
}

/** NotebookLM JSON often double-escapes LaTeX: \\cdot → \cdot */
function normalizeMathLatex(latex: string): string {
  return latex.replace(/\\\\([a-zA-Z@]+)/g, "\\$1");
}

function renderMathHtml(latex: string): string | null {
  try {
    return katex.renderToString(normalizeMathLatex(latex.trim()), {
      throwOnError: true,
      displayMode: false,
      strict: "ignore",
    });
  } catch {
    return null;
  }
}

function MathInline({ latex }: { latex: string }) {
  const html = renderMathHtml(latex);

  if (html) {
    return (
      <span
        className="math-inline [&_.katex]:text-[1em]"
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  return <span className="math-fallback">${latex}$</span>;
}

export interface MathTextProps {
  /** String that may contain inline math delimited by $...$ */
  text: string;
  className?: string;
  as?: "span" | "p" | "div";
}

export function MathText({ text, className, as: Tag = "span" }: MathTextProps) {
  const segments = splitMathSegments(text);

  return (
    <Tag className={cn("math-text", className)}>
      {segments.map((segment, index) =>
        segment.type === "text" ? (
          <span key={index}>{segment.content}</span>
        ) : (
          <MathInline key={index} latex={segment.content} />
        )
      )}
    </Tag>
  );
}

/** Plain text for aria-labels (strips $ delimiters, keeps math content). */
export function mathTextToPlain(text: string): string {
  return splitMathSegments(text)
    .map((segment) => segment.content)
    .join("");
}
