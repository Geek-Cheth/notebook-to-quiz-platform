import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { handleApiError } from "@/lib/api-utils";
import { listQuizSubmissions, toSubmissionSummaries } from "@/lib/quiz";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const authError = await requireAdminAuth();
  if (authError) return authError;

  try {
    const { slug } = await params;
    const submissions = await listQuizSubmissions(slug);

    return NextResponse.json({
      slug,
      submissions: toSubmissionSummaries(submissions),
    });
  } catch (err) {
    return handleApiError(err);
  }
}
