"use client";

import { CheckCircle2, XCircle } from "lucide-react";

import { SubmissionMetadataPanel } from "@/components/admin/SubmissionMetadataPanel";
import { MathText } from "@/components/quiz/MathText";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { QuestionResult, SubmissionReview } from "@/lib/types";
import { cn } from "@/lib/utils";

function ReviewItem({ item }: { item: QuestionResult }) {
  const skipped = item.selectedIndex === null;

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
          <Badge
            variant={
              item.isCorrect
                ? "success"
                : skipped
                  ? "secondary"
                  : "destructive"
            }
          >
            {item.isCorrect ? "Correct" : skipped ? "Skipped" : "Incorrect"}
          </Badge>
        </div>
      </div>

      <div className="ml-6 space-y-2 text-sm">
        {item.selectedIndex !== null ? (
          <p className="text-muted-foreground">
            Student answer:{" "}
            <MathText
              text={item.options[item.selectedIndex]}
              className={cn(!item.isCorrect && "text-destructive")}
            />
          </p>
        ) : (
          <p className="text-muted-foreground italic">No answer selected</p>
        )}
        {!item.isCorrect && (
          <p className="text-muted-foreground">
            Correct answer:{" "}
            <MathText text={item.correctAnswer} className="text-emerald-400" />
          </p>
        )}
        {!item.isCorrect && item.rationale && (
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

type SubmissionReviewProps = {
  review: SubmissionReview;
};

export function SubmissionReviewPanel({ review }: SubmissionReviewProps) {
  const passed = review.percentage >= 70;

  return (
    <div className="animate-fade-in space-y-6">
      <Card className="border-border/80">
        <CardHeader className="text-center">
          <CardDescription>{review.quizTitle}</CardDescription>
          <CardTitle className="text-2xl sm:text-3xl">
            {review.score} / {review.total}
          </CardTitle>
          <p className="text-muted-foreground text-sm">
            {review.studentName} scored {review.percentage}%
          </p>
          <p className="text-muted-foreground text-xs">
            Submitted{" "}
            {new Date(review.submittedAt).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
          <Badge
            variant={passed ? "success" : "secondary"}
            className="mx-auto mt-2"
          >
            {passed ? "Passing" : "Below 70%"}
          </Badge>
        </CardHeader>
      </Card>

      <SubmissionMetadataPanel
        metadata={review.clientMetadata}
        submittedAt={review.submittedAt}
      />

      <div className="space-y-3">
        <h3 className="text-muted-foreground text-sm font-medium uppercase tracking-wider">
          Question review
        </h3>
        <div className="space-y-3">
          {review.results.map((item) => (
            <ReviewItem key={item.number} item={item} />
          ))}
        </div>
      </div>
    </div>
  );
}
