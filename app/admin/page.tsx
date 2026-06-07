"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  Check,
  ExternalLink,
  Key,
  Link2,
  Loader2,
  Plus,
  RefreshCw,
  Users,
} from "lucide-react";

import { DeleteQuizButton } from "@/components/admin/DeleteQuizButton";
import { CountryLockEditor } from "@/components/admin/CountryLockEditor";
import { Header } from "@/components/layout/Header";
import { QuizTitleEditor } from "@/components/admin/QuizTitleEditor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fetchAdminQuizzes } from "@/lib/api";
import type { QuizSummary } from "@/lib/types";

function CopyButton({
  text,
  label,
  icon: Icon,
  iconOnly = false,
}: {
  text: string;
  label: string;
  icon: LucideIcon;
  iconOnly?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [text]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={copy}
      aria-label={iconOnly ? label : undefined}
      className={iconOnly ? "size-7 p-0" : "h-7 gap-1.5 px-2 text-xs"}
    >
      {copied ? (
        iconOnly ? (
          <Check className="size-3" />
        ) : (
          <>
            <Check className="size-3" />
            Copied
          </>
        )
      ) : iconOnly ? (
        <Icon className="size-3" />
      ) : (
        <>
          <Icon className="size-3" />
          {label}
        </>
      )}
    </Button>
  );
}

export default function AdminDashboardPage() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadQuizzes = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminQuizzes();
      setQuizzes(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load quizzes.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuizzes();
  }, [loadQuizzes]);

  const handleTitleUpdated = useCallback((slug: string, title: string) => {
    setQuizzes((prev) =>
      prev.map((quiz) => (quiz.slug === slug ? { ...quiz, title } : quiz))
    );
  }, []);

  const handleQuizDeleted = useCallback((slug: string) => {
    setQuizzes((prev) => prev.filter((quiz) => quiz.slug !== slug));
  }, []);

  const handleCountryLockUpdated = useCallback(
    (slug: string, allowedCountries: string[] | null) => {
      setQuizzes((prev) =>
        prev.map((quiz) =>
          quiz.slug === slug ? { ...quiz, allowedCountries } : quiz
        )
      );
    },
    []
  );

  const origin =
    typeof window !== "undefined" ? window.location.origin : "";

  return (
    <>
      <Header showAdmin />
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="animate-fade-in mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Admin dashboard
            </h1>
            <p className="text-muted-foreground mt-1 text-sm">
              Manage quizzes, share links, and view submission stats
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={loadQuizzes} disabled={loading}>
              <RefreshCw className={`size-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button asChild size="sm">
              <Link href="/admin/import">
                <Plus className="size-4" />
                Import quiz
              </Link>
            </Button>
          </div>
        </div>

        {loading && quizzes.length === 0 ? (
          <div className="flex justify-center py-20">
            <Loader2 className="text-muted-foreground size-8 animate-spin" />
          </div>
        ) : error ? (
          <Card className="border-destructive/30">
            <CardContent className="py-8 text-center">
              <p className="text-destructive mb-4 text-sm">{error}</p>
              <Button variant="outline" onClick={loadQuizzes}>
                Try again
              </Button>
            </CardContent>
          </Card>
        ) : quizzes.length === 0 ? (
          <Card className="border-border/80">
            <CardHeader className="text-center">
              <CardTitle>No quizzes yet</CardTitle>
              <CardDescription>
                Import your first quiz to get started
              </CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center pb-6">
              <Button asChild>
                <Link href="/admin/import">
                  <Plus className="size-4" />
                  Import quiz
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="animate-slide-up border-border/80">
            <CardContent className="pt-6">
              <div className="hidden lg:block">
                <Table className="table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[30%]">Title</TableHead>
                      <TableHead className="w-[12%]">Region</TableHead>
                      <TableHead className="w-[12%]">Password</TableHead>
                      <TableHead className="w-[8%]">Questions</TableHead>
                      <TableHead className="w-[10%]">Submissions</TableHead>
                      <TableHead className="w-[10%]">Avg. score</TableHead>
                      <TableHead className="w-[18%] text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {quizzes.map((quiz) => {
                      const shareUrl = `${origin}/q/${quiz.slug}`;
                      return (
                        <TableRow key={quiz.slug}>
                          <TableCell className="max-w-0 whitespace-normal font-medium">
                            <QuizTitleEditor
                              slug={quiz.slug}
                              title={quiz.title}
                              onUpdated={handleTitleUpdated}
                            />
                          </TableCell>
                          <TableCell className="whitespace-normal">
                            <CountryLockEditor
                              slug={quiz.slug}
                              allowedCountries={quiz.allowedCountries}
                              onUpdated={handleCountryLockUpdated}
                              compact
                            />
                          </TableCell>
                          <TableCell className="whitespace-normal">
                            <code className="rounded bg-secondary px-2 py-0.5 font-mono text-xs">
                              {quiz.password}
                            </code>
                          </TableCell>
                          <TableCell>{quiz.questionCount}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">
                              {quiz.submissionCount}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {quiz.averageScore !== null
                              ? `${Math.round(quiz.averageScore)}%`
                              : "—"}
                          </TableCell>
                          <TableCell className="whitespace-normal text-right">
                            <div className="flex items-center justify-end gap-0.5">
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="size-7 p-0"
                              >
                                <Link
                                  href={`/admin/quizzes/${quiz.slug}/submissions`}
                                  aria-label="View submissions"
                                >
                                  <Users className="size-3" />
                                </Link>
                              </Button>
                              <CopyButton
                                text={quiz.password}
                                label="Copy password"
                                icon={Key}
                                iconOnly
                              />
                              <CopyButton
                                text={shareUrl}
                                label="Copy share link"
                                icon={Link2}
                                iconOnly
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                asChild
                                className="size-7 p-0"
                              >
                                <Link
                                  href={`/q/${quiz.slug}`}
                                  target="_blank"
                                  aria-label="Open quiz preview"
                                >
                                  <ExternalLink className="size-3" />
                                </Link>
                              </Button>
                              <DeleteQuizButton
                                slug={quiz.slug}
                                title={quiz.title}
                                onDeleted={handleQuizDeleted}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              <div className="space-y-4 lg:hidden">
                {quizzes.map((quiz) => {
                  const shareUrl = `${origin}/q/${quiz.slug}`;
                  return (
                    <div
                      key={quiz.slug}
                      className="space-y-3 rounded-lg border border-border p-4"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <QuizTitleEditor
                          slug={quiz.slug}
                          title={quiz.title}
                          onUpdated={handleTitleUpdated}
                          className="flex-1"
                        />
                        <Badge variant="secondary">
                          {quiz.submissionCount} submissions
                        </Badge>
                      </div>
                      <div className="text-muted-foreground grid grid-cols-2 gap-2 text-xs">
                        <div className="col-span-2">
                          <CountryLockEditor
                            slug={quiz.slug}
                            allowedCountries={quiz.allowedCountries}
                            onUpdated={handleCountryLockUpdated}
                          />
                        </div>
                        <div>
                          Password:{" "}
                          <code className="text-foreground font-mono">
                            {quiz.password}
                          </code>
                        </div>
                        <div>{quiz.questionCount} questions</div>
                        <div>
                          Avg:{" "}
                          {quiz.averageScore !== null
                            ? `${Math.round(quiz.averageScore)}%`
                            : "—"}
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        <Button variant="ghost" size="sm" asChild className="h-7 px-2">
                          <Link href={`/admin/quizzes/${quiz.slug}/submissions`}>
                            <Users className="size-3" />
                            Submissions
                          </Link>
                        </Button>
                        <CopyButton
                          text={quiz.password}
                          label="Password"
                          icon={Key}
                        />
                        <CopyButton text={shareUrl} label="Link" icon={Link2} />
                        <Button variant="ghost" size="sm" asChild className="h-7 px-2">
                          <Link href={`/q/${quiz.slug}`} target="_blank">
                            <ExternalLink className="size-3" />
                            Preview
                          </Link>
                        </Button>
                        <DeleteQuizButton
                          slug={quiz.slug}
                          title={quiz.title}
                          onDeleted={handleQuizDeleted}
                          className="size-7 p-0 text-destructive hover:text-destructive"
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

      </main>
    </>
  );
}
