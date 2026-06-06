import { NextRequest, NextResponse } from "next/server";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { getQuizSlugByPassword } from "@/lib/quiz";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ password: string }> }
) {
  try {
    const { password } = await params;
    const slug = await getQuizSlugByPassword(password);

    if (!slug) {
      return jsonError("Quiz not found for this password", 404);
    }

    return NextResponse.json({ slug, shareUrl: `/q/${slug}` });
  } catch (err) {
    return handleApiError(err);
  }
}
