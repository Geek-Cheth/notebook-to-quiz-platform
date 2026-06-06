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

/** Collapse NotebookLM double-escapes: \\cdot → \cdot (repeat until stable). */
export function normalizeMathLatex(latex: string): string {
  let prev = "";
  let cur = latex;
  while (cur !== prev) {
    prev = cur;
    cur = cur.replace(/\\{2,}([a-zA-Z@]+)/g, "\\$1");
  }
  return cur;
}

function containsLatexMath(text: string): boolean {
  return (
    /\\+[a-zA-Z@]+/.test(text) ||
    /\^/.test(text) ||
    /_[{0-9]/.test(text)
  );
}

/** True when the string looks like prose rather than a compact math expression. */
function containsProseWords(text: string): boolean {
  const stripped = text
    .replace(/\\+[a-zA-Z@]+(\{[^{}]*\})?/g, " ")
    .replace(/[_^{}+\-*/=()[\].,;:!?'"]/g, " ")
    .replace(/\d+/g, " ")
    .trim();

  return /\b[a-z]{4,}\b/i.test(stripped);
}

function isFullyMathDelimited(text: string): boolean {
  return /^\$[\s\S]+\$$/.test(text);
}

function wrapInlineMath(text: string): string {
  return text
    .replace(/\\+[a-zA-Z@]+(\{[^{}]*\})?/g, (match) => `$${match}$`)
    .replace(/\b[0-9A-Za-z]+_\{[0-9]+\}/g, (match) => `$${match}$`)
    .replace(/\b[0-9A-Za-z]+_[0-9]\b/g, (match) => `$${match}$`)
    .replace(/\b[0-9A-Za-z]+(\^\{[^{}]*\}|\^[0-9A-Za-z]+)/g, (match) => `$${match}$`);
}

function wrapBareMath(text: string): string {
  if (!containsLatexMath(text)) {
    return text;
  }

  if (!containsProseWords(text)) {
    return `$${text}$`;
  }

  return wrapInlineMath(text);
}

/**
 * Normalize NotebookLM math strings so KaTeX can render them.
 * - Collapses double-escaped commands (\\cdot → \cdot)
 * - Wraps bare LaTeX in $...$ when delimiters are missing
 */
export function preprocessMathText(text: string): string {
  const trimmed = normalizeMathLatex(text.trim());
  if (!trimmed) {
    return trimmed;
  }

  if (isFullyMathDelimited(trimmed)) {
    return trimmed;
  }

  if (trimmed.includes("$")) {
    return trimmed;
  }

  return wrapBareMath(trimmed);
}
