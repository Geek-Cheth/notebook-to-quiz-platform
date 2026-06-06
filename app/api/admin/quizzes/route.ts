import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { handleApiError } from "@/lib/api-utils";
import { listAllQuizzes, toAdminQuizSummaries } from "@/lib/quiz";

export const runtime = "nodejs";

export async function GET() {
  const authError = await requireAdminAuth();
  if (authError) return authError;

  try {
    const rows = await listAllQuizzes();
    return NextResponse.json(toAdminQuizSummaries(rows));
  } catch (err) {
    return handleApiError(err);
  }
}
