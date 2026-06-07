import { NextRequest, NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { submitQuizAnswers, toSubmitResponse } from "@/lib/quiz";
import { buildClientMetadata } from "@/lib/request-metadata";

export const runtime = "nodejs";

interface SubmitBody {
  studentName: string;
  answers: (number | null)[];
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const body = (await request.json()) as SubmitBody;

    if (!body?.studentName?.trim()) {
      return jsonError("studentName is required");
    }
    if (!Array.isArray(body.answers)) {
      return jsonError("answers array is required");
    }

    const metadata = await buildClientMetadata(request);
    const result = await submitQuizAnswers(
      slug,
      body.studentName,
      body.answers,
      metadata
    );
    return NextResponse.json(toSubmitResponse(result));
  } catch (err) {
    return handleApiError(err);
  }
}
