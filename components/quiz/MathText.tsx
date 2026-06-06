"use client";

import katex from "katex";

import {
  normalizeMathLatex,
  preprocessMathText,
  splitMathSegments,
} from "@/lib/math-text";
import { cn } from "@/lib/utils";

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
  const segments = splitMathSegments(preprocessMathText(text));

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
  return splitMathSegments(preprocessMathText(text))
    .map((segment) => segment.content)
    .join("");
}
