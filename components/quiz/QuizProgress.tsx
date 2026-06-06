"use client";

import { Progress } from "@/components/ui/progress";

interface QuizProgressProps {
  current: number;
  total: number;
  label?: string;
}

export function QuizProgress({ current, total, label }: QuizProgressProps) {
  const percentage = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{label ?? `${current} of ${total} answered`}</span>
        <span>{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-1" />
    </div>
  );
}
