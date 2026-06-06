import { NextRequest, NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { createQuiz, toImportResult } from "@/lib/quiz";
import type { QuizQuestionInput } from "@/lib/db-types";

export const runtime = "nodejs";

interface CreateQuizBody {
  title: string;
  sourceUrl?: string | null;
  questions: QuizQuestionInput[];
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CreateQuizBody;

    if (!body?.title?.trim()) {
      return jsonError("title is required");
    }
    if (!Array.isArray(body.questions) || body.questions.length === 0) {
      return jsonError("questions array is required");
    }

    const quiz = await createQuiz({
      title: body.title.trim(),
      sourceUrl: body.sourceUrl ?? null,
      questions: body.questions,
    });

    return NextResponse.json(toImportResult(quiz), { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
