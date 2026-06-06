"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, ArrowRight, Loader2, Send } from "lucide-react";

import { Header } from "@/components/layout/Header";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import { QuizProgress } from "@/components/quiz/QuizProgress";
import { QuizResults } from "@/components/quiz/QuizResults";
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
import { fetchQuizBySlug, submitQuiz } from "@/lib/api";
import type { Quiz, SubmitResult } from "@/lib/types";

type QuizPhase = "name" | "quiz" | "submitting" | "results";

export default function QuizPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [phase, setPhase] = useState<QuizPhase>("name");
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [studentName, setStudentName] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);

  useEffect(() => {
    async function loadQuiz() {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchQuizBySlug(slug);
        setQuiz(data);
        setAnswers(new Array(data.questions.length).fill(null));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load quiz.");
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadQuiz();
    }
  }, [slug]);

  const handleSelect = useCallback((index: number) => {
    setAnswers((prev) => {
      const next = [...prev];
      next[currentIndex] = index;
      return next;
    });
  }, [currentIndex]);

  async function handleSubmit() {
    if (!quiz) return;

    setPhase("submitting");
    try {
      const result = await submitQuiz(slug, {
        studentName: studentName.trim(),
        answers,
      });
      setSubmitResult(result);
      setPhase("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submission failed.");
      setPhase("quiz");
    }
  }

  const answeredCount = answers.filter((a) => a !== null).length;
  const currentQuestion = quiz?.questions[currentIndex];
  const isLastQuestion = quiz ? currentIndex === quiz.questions.length - 1 : false;
  const allAnswered = quiz ? answeredCount === quiz.questions.length : false;

  if (loading) {
    return (
      <>
        <Header />
        <main className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
        </main>
      </>
    );
  }

  if (error && !quiz) {
    return (
      <>
        <Header />
        <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-lg flex-col items-center justify-center px-4 text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            Back to home
          </Button>
        </main>
      </>
    );
  }

  if (!quiz) return null;

  return (
    <>
      <Header />
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        {phase === "name" && (
          <div className="animate-slide-up mx-auto max-w-md">
            <Card className="border-border/80">
              <CardHeader>
                <CardTitle>{quiz.title}</CardTitle>
                <CardDescription>
                  {quiz.questionCount} questions · Enter your name to begin
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (studentName.trim()) setPhase("quiz");
                  }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Your name</Label>
                    <Input
                      id="name"
                      placeholder="Jane Doe"
                      value={studentName}
                      onChange={(e) => setStudentName(e.target.value)}
                      autoFocus
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={!studentName.trim()}>
                    Start quiz
                    <ArrowRight className="size-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}

        {(phase === "quiz" || phase === "submitting") && currentQuestion && (
          <div className="animate-fade-in space-y-8">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-muted-foreground text-sm">{quiz.title}</p>
                <p className="text-muted-foreground text-sm">{studentName}</p>
              </div>
              <QuizProgress
                current={answeredCount}
                total={quiz.questions.length}
              />
            </div>

            <QuestionCard
              key={currentIndex}
              question={currentQuestion}
              questionIndex={currentIndex}
              totalQuestions={quiz.questions.length}
              selectedIndex={answers[currentIndex]}
              onSelect={handleSelect}
              disabled={phase === "submitting"}
            />

            <div className="flex items-center justify-between gap-4 pt-2">
              <Button
                variant="ghost"
                onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                disabled={currentIndex === 0 || phase === "submitting"}
              >
                <ArrowLeft className="size-4" />
                Previous
              </Button>

              {isLastQuestion ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!allAnswered || phase === "submitting"}
                >
                  {phase === "submitting" ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Submitting…
                    </>
                  ) : (
                    <>
                      Submit
                      <Send className="size-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentIndex((i) => i + 1)}
                  disabled={answers[currentIndex] === null || phase === "submitting"}
                >
                  Next
                  <ArrowRight className="size-4" />
                </Button>
              )}
            </div>

            {error && (
              <p className="text-destructive text-center text-sm">{error}</p>
            )}
          </div>
        )}

        {phase === "results" && submitResult && (
          <QuizResults
            result={submitResult}
            studentName={studentName}
            quizTitle={quiz.title}
          />
        )}
      </main>
    </>
  );
}
