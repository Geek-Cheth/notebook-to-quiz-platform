"use client";

import { MathText, mathTextToPlain } from "@/components/quiz/MathText";
import { cn } from "@/lib/utils";
import type { QuizQuestion } from "@/lib/types";

interface QuestionCardProps {
  question: QuizQuestion;
  questionIndex: number;
  totalQuestions: number;
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  disabled?: boolean;
  showCorrect?: boolean;
  correctIndex?: number;
}

export function QuestionCard({
  question,
  questionIndex,
  totalQuestions,
  selectedIndex,
  onSelect,
  disabled = false,
  showCorrect = false,
  correctIndex,
}: QuestionCardProps) {
  return (
    <div className="animate-slide-up space-y-6">
      <div className="space-y-1">
        <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
          Question {questionIndex + 1} of {totalQuestions}
        </p>
        <h2 className="text-lg leading-relaxed font-medium sm:text-xl">
          <MathText text={question.text} />
        </h2>
      </div>

      <div
        className="space-y-2"
        role="radiogroup"
        aria-label={mathTextToPlain(question.text)}
      >
        {question.options.map((option, index) => {
          const isSelected = selectedIndex === index;
          const isCorrect = showCorrect && correctIndex === index;
          const isWrong =
            showCorrect && isSelected && correctIndex !== undefined && correctIndex !== index;

          return (
            <button
              key={index}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() => onSelect(index)}
              className={cn(
                "group flex w-full items-start gap-3 rounded-lg border px-4 py-3.5 text-left text-sm transition-all duration-200",
                "hover:border-muted-foreground/40 hover:bg-accent/50",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                "disabled:cursor-default disabled:opacity-80",
                isSelected && !showCorrect && "border-foreground bg-accent",
                isCorrect && "border-emerald-500/50 bg-emerald-500/10",
                isWrong && "border-destructive/50 bg-destructive/10",
                !isSelected && !showCorrect && "border-border bg-card"
              )}
            >
              <span
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-xs font-medium transition-colors",
                  isSelected && !showCorrect && "border-foreground bg-foreground text-background",
                  isCorrect && "border-emerald-500 bg-emerald-500 text-white",
                  isWrong && "border-destructive bg-destructive text-white",
                  !isSelected && !showCorrect && "border-muted-foreground/40 text-muted-foreground group-hover:border-muted-foreground"
                )}
              >
                {String.fromCharCode(65 + index)}
              </span>
              <MathText text={option} className="leading-relaxed" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
