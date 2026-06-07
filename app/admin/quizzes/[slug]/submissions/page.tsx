"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2, RefreshCw } from "lucide-react";

import { SubmissionList } from "@/components/admin/SubmissionList";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { fetchQuizSubmissions } from "@/lib/api";
import type { SubmissionSummary } from "@/lib/types";

type SubmissionsPageProps = {
  params: Promise<{ slug: string }>;
};

export default function QuizSubmissionsPage({
  params,
}: SubmissionsPageProps) {
  const [slug, setSlug] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => setSlug(p.slug));
  }, [params]);

  const loadSubmissions = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchQuizSubmissions(slug);
      setSubmissions(data.submissions);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load submissions."
      );
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    loadSubmissions();
  }, [loadSubmissions]);

  return (
    <>
      <Header showAdmin />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="animate-fade-in mb-8 space-y-4">
          <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
            <Link href="/admin">
              <ArrowLeft className="size-4" />
              Back to dashboard
            </Link>
          </Button>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Submissions
              </h1>
              <p className="text-muted-foreground mt-1 text-sm">
                {slug ? (
                  <>
                    Review student attempts for quiz{" "}
                    <code className="text-foreground font-mono text-xs">
                      {slug}
                    </code>
                  </>
                ) : (
                  "Loading quiz…"
                )}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadSubmissions}
              disabled={loading || !slug}
            >
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {loading && submissions.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="text-muted-foreground size-8 animate-spin" />
          </div>
        ) : error ? (
          <Card className="border-destructive/30">
            <CardContent className="py-8 text-center">
              <p className="text-destructive mb-4 text-sm">{error}</p>
              <Button variant="outline" onClick={loadSubmissions}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="animate-slide-up border-border/80">
            <CardHeader>
              <CardTitle className="text-lg">
                {submissions.length} submission
                {submissions.length === 1 ? "" : "s"}
              </CardTitle>
              <CardDescription>
                Click a row to review answers question by question
              </CardDescription>
            </CardHeader>
            <CardContent>
              {slug && <SubmissionList slug={slug} submissions={submissions} />}
            </CardContent>
          </Card>
        )}
      </main>
    </>
  );
}
