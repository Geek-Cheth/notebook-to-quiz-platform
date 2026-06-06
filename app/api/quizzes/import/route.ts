import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { importQuizFromNotebookLmUrl } from "@/lib/notebooklm-import";
import { createQuiz, toImportResult } from "@/lib/quiz";

export const runtime = "nodejs";
export const maxDuration = 120;

interface ImportBody {
  url?: string;
  sourceUrl?: string;
  title?: string;
}

export async function POST(request: NextRequest) {
  const authError = await requireAdminAuth();
  if (authError) return authError;

  try {
    const body = (await request.json()) as ImportBody;
    const sourceUrl = (body?.sourceUrl || body?.url)?.trim();

    if (!sourceUrl) {
      return jsonError("url is required");
    }

    const extracted = await importQuizFromNotebookLmUrl(sourceUrl, body.title);
    const quiz = await createQuiz(extracted);
    return NextResponse.json(toImportResult(quiz), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
