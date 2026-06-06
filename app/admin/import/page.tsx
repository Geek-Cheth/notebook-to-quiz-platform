"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Loader2, Upload } from "lucide-react";

import { Header } from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { importQuiz } from "@/lib/api";
import type { ImportResult } from "@/lib/types";

export default function AdminImportPage() {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setResult(null);

    const trimmed = url.trim();
    if (!trimmed) {
      setError("Enter a quiz URL to import.");
      return;
    }

    setLoading(true);
    try {
      const data = await importQuiz(trimmed);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header showAdmin />
      <main className="mx-auto max-w-lg px-4 py-8 sm:px-6 sm:py-12">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="text-muted-foreground mb-6 -ml-2"
        >
          <Link href="/admin">
            <ArrowLeft className="size-4" />
            Back to dashboard
          </Link>
        </Button>

        <div className="animate-fade-in mb-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            Import quiz
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Paste a quiz URL to import questions and generate a share link
          </p>
        </div>

        <Card className="animate-slide-up border-border/80">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Upload className="text-muted-foreground size-4" />
              <CardTitle className="text-base">Quiz URL</CardTitle>
            </div>
            <CardDescription>
              Paste the full URL of the quiz you want to import
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="url">Source URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading || !url.trim()}>
                {loading ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Importing…
                  </>
                ) : (
                  <>
                    Import quiz
                    <Upload className="size-4" />
                  </>
                )}
              </Button>
            </form>

            {error && (
              <p className="text-destructive mt-4 text-center text-sm">{error}</p>
            )}

            {result && (
              <div className="animate-fade-in mt-6 space-y-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-2 text-emerald-400">
                  <CheckCircle2 className="size-5" />
                  <span className="font-medium">Quiz imported</span>
                </div>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Title</dt>
                    <dd className="text-right font-medium">{result.title}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Password</dt>
                    <dd>
                      <code className="rounded bg-secondary px-2 py-0.5 font-mono">
                        {result.password}
                      </code>
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">Questions</dt>
                    <dd>{result.questionCount}</dd>
                  </div>
                </dl>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => router.push("/admin")}
                  >
                    View dashboard
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => router.push(`/q/${result.slug}`)}
                  >
                    Preview quiz
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
