import { createRequire } from "module";
import { chromium } from "playwright";
import type { ExtractedQuiz, QuizQuestionInput } from "./db-types";
import { preprocessMathText } from "./math-text";

const require = createRequire(import.meta.url);
const parseBatchexecute = require("../scripts/parse-batchexecute.js") as {
  parseQuizFromRaw: (raw: string, meta?: { title?: string; sourceUrl?: string }) => ExtractedQuiz;
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function captureBatchexecuteRaw(sourceUrl: string): Promise<string> {
  const browser = await chromium.launch({ headless: true });
  let batchexecuteBody: string | null = null;

  try {
    const context = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    page.on("response", async (response) => {
      const url = response.url();
      if (url.includes("batchexecute") && url.includes("v9rmvd")) {
        try {
          batchexecuteBody = await response.text();
        } catch {
          /* ignore read errors */
        }
      }
    });

    await page.goto(sourceUrl, { waitUntil: "domcontentloaded", timeout: 60000 });
    await sleep(8000);

    if (!batchexecuteBody) {
      throw new Error(
        "Failed to capture NotebookLM batchexecute response. Ensure the URL is a public quiz artifact."
      );
    }

    return batchexecuteBody;
  } finally {
    await browser.close();
  }
}

export function parseNotebookLmRaw(
  raw: string,
  meta?: { title?: string; sourceUrl?: string }
): ExtractedQuiz {
  return parseBatchexecute.parseQuizFromRaw(raw, meta);
}

export async function importQuizFromNotebookLmUrl(
  sourceUrl: string,
  title?: string
): Promise<ExtractedQuiz> {
  const raw = await captureBatchexecuteRaw(sourceUrl);
  const parsed = parseNotebookLmRaw(raw, {
    title: title?.trim() || "Imported Quiz",
    sourceUrl,
  });

  parsed.questions = parsed.questions.map(normalizeQuestion);
  return parsed;
}

export function normalizeQuestion(q: QuizQuestionInput): QuizQuestionInput {
  return {
    text: preprocessMathText(q.text.trim()),
    options: q.options.map((o) => preprocessMathText(o.trim())),
    correctIndex: q.correctIndex,
    rationale: q.rationale ? preprocessMathText(q.rationale.trim()) : null,
  };
}

export function parseSeedFile(data: {
  title: string;
  sourceUrl?: string;
  questions: Array<{
    text: string;
    options: string[];
    correctIndex: number;
    rationale?: string | null;
  }>;
}): ExtractedQuiz {
  return {
    title: data.title,
    sourceUrl: data.sourceUrl ?? null,
    questions: data.questions.map(normalizeQuestion),
  };
}
