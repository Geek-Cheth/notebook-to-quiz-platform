import type {
  ApiError,
  ImportResult,
  Quiz,
  QuizSubmissionsResponse,
  QuizSummary,
  SubmissionReview,
  SubmitPayload,
  SubmitResult,
} from "./types";

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error((data as ApiError).error || "Something went wrong");
  }
  return data as T;
}

export async function fetchQuizBySlug(slug: string): Promise<Quiz> {
  const res = await fetch(`/api/quizzes/${slug}`, { cache: "no-store" });
  return handleResponse<Quiz>(res);
}

export async function fetchQuizByPassword(password: string): Promise<{ slug: string }> {
  const res = await fetch(`/api/quizzes/by-password/${password}`, {
    cache: "no-store",
  });
  return handleResponse<{ slug: string }>(res);
}

export async function submitQuiz(
  slug: string,
  payload: SubmitPayload
): Promise<SubmitResult> {
  const res = await fetch(`/api/quizzes/${slug}/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return handleResponse<SubmitResult>(res);
}

export async function importQuiz(url: string): Promise<ImportResult> {
  const res = await fetch("/api/quizzes/import", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  return handleResponse<ImportResult>(res);
}

export async function fetchAdminQuizzes(): Promise<QuizSummary[]> {
  const res = await fetch("/api/admin/quizzes", { cache: "no-store" });
  return handleResponse<QuizSummary[]>(res);
}

export async function updateAdminQuizTitle(
  slug: string,
  title: string
): Promise<{ slug: string; title: string }> {
  const res = await fetch(`/api/admin/quizzes/${slug}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  return handleResponse<{ slug: string; title: string }>(res);
}

export async function updateAdminQuizCountryLock(
  slug: string,
  allowedCountries: string[] | null
): Promise<{ slug: string; allowedCountries: string[] | null }> {
  const res = await fetch(`/api/admin/quizzes/${slug}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ allowedCountries }),
  });
  return handleResponse<{ slug: string; allowedCountries: string[] | null }>(
    res
  );
}

export async function deleteQuiz(slug: string): Promise<void> {
  const res = await fetch(`/api/admin/quizzes/${slug}`, {
    method: "DELETE",
  });
  await handleResponse<{ ok: boolean }>(res);
}

export async function fetchQuizSubmissions(
  slug: string
): Promise<QuizSubmissionsResponse> {
  const res = await fetch(`/api/quizzes/${slug}/submissions`, {
    cache: "no-store",
  });
  return handleResponse<QuizSubmissionsResponse>(res);
}

export async function fetchSubmissionReview(
  slug: string,
  submissionId: string
): Promise<SubmissionReview> {
  const res = await fetch(`/api/quizzes/${slug}/submissions/${submissionId}`, {
    cache: "no-store",
  });
  return handleResponse<SubmissionReview>(res);
}
