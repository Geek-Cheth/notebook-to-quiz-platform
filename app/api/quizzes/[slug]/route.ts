import { NextRequest, NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { getQuizBySlug, toPublicQuizResponse } from "@/lib/quiz";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const quiz = await getQuizBySlug(slug);

    if (!quiz) {
      return jsonError("Quiz not found", 404);
    }

    return NextResponse.json(toPublicQuizResponse(quiz));
  } catch (err) {
    return handleApiError(err);
  }
}
