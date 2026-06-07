import { NextRequest, NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { COUNTRY_RESTRICTED_MESSAGE, isCountryAllowed } from "@/lib/country-lock";
import { getQuizBySlug, toPublicQuizResponse } from "@/lib/quiz";
import { buildClientMetadata } from "@/lib/request-metadata";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const quiz = await getQuizBySlug(slug);

    if (!quiz) {
      return jsonError("Quiz not found", 404);
    }

    const metadata = await buildClientMetadata(request);
    if (
      !isCountryAllowed(
        quiz.allowed_countries,
        metadata.geo?.countryCode ?? null
      )
    ) {
      return jsonError(COUNTRY_RESTRICTED_MESSAGE, 403);
    }

    return NextResponse.json(toPublicQuizResponse(quiz));
  } catch (err) {
    return handleApiError(err);
  }
}
