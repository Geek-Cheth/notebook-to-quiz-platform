"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Loader2 } from "lucide-react";

import { SubmissionReviewPanel } from "@/components/admin/SubmissionReview";
import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { fetchSubmissionReview } from "@/lib/api";
import type { SubmissionReview } from "@/lib/types";

type SubmissionDetailPageProps = {
  params: Promise<{ slug: string; id: string }>;
};

export default function SubmissionDetailPage({
  params,
}: SubmissionDetailPageProps) {
  const [slug, setSlug] = useState<string | null>(null);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [review, setReview] = useState<SubmissionReview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    params.then((p) => {
      setSlug(p.slug);
      setSubmissionId(p.id);
    });
  }, [params]);

  const loadReview = useCallback(async () => {
    if (!slug || !submissionId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSubmissionReview(slug, submissionId);
      setReview(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load submission."
      );
    } finally {
      setLoading(false);
    }
  }, [slug, submissionId]);

  useEffect(() => {
    loadReview();
  }, [loadReview]);

  return (
    <>
      <Header showAdmin />
      <main className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="animate-fade-in mb-8 space-y-4">
          {slug && (
            <Button variant="ghost" size="sm" asChild className="-ml-2 w-fit">
              <Link href={`/admin/quizzes/${slug}/submissions`}>
                <ArrowLeft className="size-4" />
                Back to submissions
              </Link>
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="text-muted-foreground size-8 animate-spin" />
          </div>
        ) : error ? (
          <Card className="border-destructive/30">
            <CardContent className="py-8 text-center">
              <p className="text-destructive mb-4 text-sm">{error}</p>
              <Button variant="outline" onClick={loadReview}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : review ? (
          <div className="animate-slide-up">
            <SubmissionReviewPanel review={review} />
          </div>
        ) : null}
      </main>
    </>
  );
}
