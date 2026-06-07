import { NextRequest, NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { handleApiError, jsonError } from "@/lib/api-utils";
import { deleteQuiz, updateQuizCountryLock, updateQuizTitle } from "@/lib/quiz";

export const runtime = "nodejs";

type PatchBody = {
  title?: string;
  allowedCountries?: string[] | null;
};

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const authError = await requireAdminAuth();
  if (authError) return authError;

  try {
    const { slug } = await params;
    await deleteQuiz(slug);
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleApiError(err);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const authError = await requireAdminAuth();
  if (authError) return authError;

  try {
    const { slug } = await params;
    const body = (await request.json()) as PatchBody;
    const hasTitle = body.title !== undefined;
    const hasCountries = body.allowedCountries !== undefined;

    if (!hasTitle && !hasCountries) {
      return jsonError("title or allowedCountries is required");
    }

    const response: {
      slug: string;
      title?: string;
      allowedCountries?: string[] | null;
    } = { slug };

    if (hasTitle) {
      if (!body.title?.trim()) {
        return jsonError("title cannot be empty");
      }
      const quiz = await updateQuizTitle(slug, body.title);
      response.title = quiz.title;
    }

    if (hasCountries) {
      const lock = await updateQuizCountryLock(slug, body.allowedCountries ?? null);
      response.allowedCountries = lock.allowedCountries;
    }

    return NextResponse.json(response);
  } catch (err) {
    return handleApiError(err);
  }
}
