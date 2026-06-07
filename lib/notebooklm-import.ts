import { createRequire } from "module";
import type { ExtractedQuiz, QuizQuestionInput } from "./db-types";
import { preprocessMathText } from "./math-text";

const require = createRequire(import.meta.url);
const parseBatchexecute = require("../scripts/parse-batchexecute.js") as {
  parseQuizFromRaw: (raw: string, meta?: { title?: string; sourceUrl?: string }) => ExtractedQuiz;
};

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

const NOTEBOOKLM_ORIGIN = "https://notebooklm.google.com";

interface ParsedNotebookLmUrl {
  notebookId: string;
  artifactId: string;
  sourcePath: string;
}

function parseNotebookLmUrl(sourceUrl: string): ParsedNotebookLmUrl {
  let parsed: URL;
  try {
    parsed = new URL(sourceUrl);
  } catch {
    throw new Error(
      "Invalid NotebookLM URL. Paste a public quiz link like https://notebooklm.google.com/notebook/…/artifact/…"
    );
  }

  if (parsed.hostname !== "notebooklm.google.com") {
    throw new Error(
      "URL must be a notebooklm.google.com public quiz artifact link."
    );
  }

  const notebookId = parsed.pathname.match(/\/notebook\/([^/]+)/)?.[1];
  const artifactId = parsed.pathname.match(/\/artifact\/([^/?#]+)/)?.[1];

  if (!notebookId || !artifactId) {
    throw new Error(
      "Invalid NotebookLM quiz URL. Expected /notebook/{id}/artifact/{id} in the path."
    );
  }

  return {
    notebookId,
    artifactId,
    sourcePath: `/notebook/${notebookId}/artifact/${artifactId}`,
  };
}

function parseWizGlobalData(html: string): { bl: string; fSid: string } {
  const wizMatch = html.match(/window\.WIZ_global_data\s*=\s*(\{[\s\S]*?\});/);
  if (!wizMatch) {
    return { bl: "", fSid: "" };
  }

  try {
    const wiz = JSON.parse(wizMatch[1].replace(/,\s*(\}|\])/g, "$1")) as Record<
      string,
      unknown
    >;
    return {
      bl: typeof wiz.cfb2h === "string" ? wiz.cfb2h : "",
      fSid: wiz.FdrFJe != null ? String(wiz.FdrFJe) : "",
    };
  } catch {
    return { bl: "", fSid: "" };
  }
}

function buildV9rmvdRequestBody(artifactId: string, notebookId: string): string {
  const innerPayload = JSON.stringify([
    artifactId,
    null,
    notebookId,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    1,
  ]);
  return JSON.stringify([[["v9rmvd", innerPayload, null, "generic"]]]);
}

function batchexecuteHasQuizPayload(raw: string): boolean {
  if (raw.includes("data-app-data")) return true;
  // Successful v9rmvd responses embed a large JSON string; errors return null payload + [3].
  const match = raw.match(/\["wrb\.fr","v9rmvd","/);
  return Boolean(match);
}

async function postBatchexecute(
  sourceUrl: string,
  artifactId: string,
  notebookId: string,
  sourcePath: string,
  meta: { bl?: string; fSid?: string; at?: string }
): Promise<string> {
  const reqId = Math.floor(Math.random() * 900000) + 100000;
  const params = new URLSearchParams({
    rpcids: "v9rmvd",
    "source-path": sourcePath,
    bl: meta.bl ?? "",
    "f.sid": meta.fSid ?? "",
    hl: "en",
    "soc-app": "1",
    "soc-platform": "1",
    "soc-device": "1",
    _reqid: String(reqId),
    rt: "c",
  });

  const endpoint = `${NOTEBOOKLM_ORIGIN}/_/LabsTailwindUi/data/batchexecute?${params}`;
  const fReq = buildV9rmvdRequestBody(artifactId, notebookId);
  const body = `f.req=${encodeURIComponent(fReq)}${meta.at ? `&at=${encodeURIComponent(meta.at)}` : ""}`;

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      Accept: "*/*",
      Origin: NOTEBOOKLM_ORIGIN,
      Referer: sourceUrl,
      "X-Same-Domain": "1",
    },
    body,
  });

  if (!res.ok) {
    throw new Error(
      `NotebookLM API returned HTTP ${res.status}. The quiz may be private or unavailable.`
    );
  }

  const raw = await res.text();
  if (!batchexecuteHasQuizPayload(raw)) {
    throw new Error(
      "Failed to fetch quiz content from NotebookLM. Ensure the URL is a public quiz artifact (not a private notebook link)."
    );
  }

  return raw;
}

export async function captureBatchexecuteRaw(sourceUrl: string): Promise<string> {
  const { notebookId, artifactId, sourcePath } = parseNotebookLmUrl(sourceUrl);

  let meta: { bl?: string; fSid?: string; at?: string } = {};

  try {
    const pageRes = await fetch(sourceUrl, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });

    if (pageRes.ok) {
      const html = await pageRes.text();
      const wiz = parseWizGlobalData(html);
      meta = {
        bl: wiz.bl || undefined,
        fSid: wiz.fSid || undefined,
        at:
          html.match(/"SNlM0e"\s*:\s*"([^"]+)"/)?.[1] ||
          html.match(/"at"\s*:\s*"([^"]+)"/)?.[1],
      };
    }
  } catch {
    /* POST-only fallback below */
  }

  try {
    return await postBatchexecute(
      sourceUrl,
      artifactId,
      notebookId,
      sourcePath,
      meta
    );
  } catch (firstErr) {
    if (meta.bl || meta.fSid || meta.at) {
      try {
        return await postBatchexecute(
          sourceUrl,
          artifactId,
          notebookId,
          sourcePath,
          {}
        );
      } catch {
        /* fall through */
      }
    }

    const detail =
      firstErr instanceof Error ? firstErr.message : "network error";
    throw new Error(
      `Failed to fetch NotebookLM quiz data (${detail}). Ensure the URL is a public quiz artifact.`
    );
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
  let parsed: ExtractedQuiz;

  try {
    parsed = parseNotebookLmRaw(raw, {
      title: title?.trim() || "Imported Quiz",
      sourceUrl,
    });
  } catch (err) {
    const detail = err instanceof Error ? err.message : "parse error";
    throw new Error(
      `NotebookLM returned data but quiz parsing failed (${detail}). The artifact may not be a quiz.`
    );
  }

  if (!parsed.questions.length) {
    throw new Error(
      "No questions found in the NotebookLM quiz. Check that the URL points to a quiz artifact."
    );
  }

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
