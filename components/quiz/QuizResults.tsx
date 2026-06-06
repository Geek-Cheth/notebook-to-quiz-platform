"use client";

import { CheckCircle2, XCircle } from "lucide-react";

import { MathText } from "@/components/quiz/MathText";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { QuestionResult, SubmitResult } from "@/lib/types";
import { cn } from "@/lib/utils";

interface QuizResultsProps {
  result: SubmitResult;
  studentName: string;
  quizTitle: string;
}

function ResultItem({ item }: { item: QuestionResult }) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-colors",
        item.isCorrect
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-destructive/30 bg-destructive/5"
      )}
    >
      <div className="mb-3 flex items-start gap-2">
        {item.isCorrect ? (
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-400" />
        ) : (
          <XCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
        )}
        <div className="space-y-1">
          <MathText
            text={item.text}
            as="p"
            className="text-sm font-medium leading-relaxed"
          />
          <Badge variant={item.isCorrect ? "success" : "destructive"}>
            {item.isCorrect ? "Correct" : "Incorrect"}
          </Badge>
        </div>
      </div>

      <div className="ml-6 space-y-2 text-sm">
        {item.selectedIndex !== null && (
          <p className="text-muted-foreground">
            Your answer:{" "}
            <MathText
              text={item.options[item.selectedIndex]}
              className={cn(!item.isCorrect && "text-destructive")}
            />
          </p>
        )}
        {!item.isCorrect && (
          <p className="text-muted-foreground">
            Correct answer:{" "}
            <MathText text={item.correctAnswer} className="text-emerald-400" />
          </p>
        )}
        {item.rationale && (
          <MathText
            text={item.rationale}
            as="p"
            className="text-muted-foreground/80 text-xs leading-relaxed italic"
          />
        )}
      </div>
    </div>
  );
}

export function QuizResults({
  result,
  studentName,
  quizTitle,
}: QuizResultsProps) {
  const passed = result.percentage >= 70;

  return (
    <div className="animate-fade-in space-y-6">
      <Card className="border-border/80">
        <CardHeader className="text-center">
          <CardDescription>{quizTitle}</CardDescription>
          <CardTitle className="text-2xl sm:text-3xl">
            {result.score} / {result.total}
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            {studentName} scored {result.percentage}%
          </p>
          <Badge
            variant={passed ? "success" : "secondary"}
            className="mx-auto mt-2"
          >
            {passed ? "Great job!" : "Keep practicing"}
          </Badge>
        </CardHeader>
      </Card>

      <div className="space-y-3">
        <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
          Review
        </h3>
        <div className="space-y-3">
          {result.results.map((item) => (
            <ResultItem key={item.number} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
