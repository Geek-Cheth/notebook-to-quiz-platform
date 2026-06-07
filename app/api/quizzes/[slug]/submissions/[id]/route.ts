import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { getSubmissionReview, toSubmissionReview } from "@/lib/quiz";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; id: string }> }
) {
  const authError = await requireAdminAuth();
  if (authError) return authError;

  try {
    const { slug, id } = await params;
    const submission = await getSubmissionReview(slug, id);

    if (!submission) {
      return jsonError("Submission not found", 404);
    }

    return NextResponse.json(toSubmissionReview(submission));
  } catch (err) {
    return handleApiError(err);
  }
}
