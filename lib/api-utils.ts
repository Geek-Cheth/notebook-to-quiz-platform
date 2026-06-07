import { NextResponse } from "next/server";

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export function handleApiError(err: unknown) {
  const message = err instanceof Error ? err.message : "Internal server error";
  const status =
    message.includes("not available in your region")
      ? 403
      : message.includes("not found") || message.includes("Not found")
      ? 404
      : message.includes("required") ||
          message.includes("Expected") ||
          message.includes("must be") ||
          message.includes("NotebookLM") ||
          message.includes("public quiz")
        ? 400
        : 500;

  if (status === 500) {
    console.error(err);
  }

  return jsonError(message, status);
}
