import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { updateQuizTitle } from "@/lib/quiz";

export const runtime = "nodejs";

type PatchBody = {
  title?: string;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const authError = await requireAdminAuth();
  if (authError) return authError;

  try {
    const { slug } = await params;
    const body = (await request.json()) as PatchBody;

    if (!body?.title?.trim()) {
      return jsonError("title is required");
    }

    const quiz = await updateQuizTitle(slug, body.title);
    return NextResponse.json({ slug: quiz.slug, title: quiz.title });
  } catch (err) {
    return handleApiError(err);
  }
}
