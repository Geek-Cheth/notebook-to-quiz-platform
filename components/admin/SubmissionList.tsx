"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { countryFlagEmoji, truncateIp } from "@/lib/request-metadata";
import type { ClientMetadata, SubmissionSummary } from "@/lib/types";
import { cn } from "@/lib/utils";

type SubmissionListProps = {
  slug: string;
  submissions: SubmissionSummary[];
};

function formatSubmittedAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function percentage(score: number, total: number): number {
  return total > 0 ? Math.round((score / total) * 100) : 0;
}

function ScoreBadge({ score, total }: { score: number; total: number }) {
  const pct = percentage(score, total);
  return (
    <Badge variant={pct >= 70 ? "success" : "secondary"}>
      {pct}%
    </Badge>
  );
}

function ClientOriginBadge({
  metadata,
}: {
  metadata: ClientMetadata | null | undefined;
}) {
  const country = metadata?.country?.toUpperCase() ?? null;
  const ip = metadata?.ip;

  if (!country && !ip) {
    return <span className="text-muted-foreground text-xs">—</span>;
  }

  const flag = countryFlagEmoji(country);

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {country && (
        <Badge variant="outline" className="font-mono text-[10px] uppercase">
          {flag ? `${flag} ` : ""}
          {country}
        </Badge>
      )}
      {ip && (
        <span className="text-muted-foreground font-mono text-xs">
          {truncateIp(ip)}
        </span>
      )}
    </div>
  );
}

function SubmissionRowLink({
  slug,
  submission,
  className,
}: {
  slug: string;
  submission: SubmissionSummary;
  className?: string;
}) {
  return (
    <Link
      href={`/admin/quizzes/${slug}/submissions/${submission.id}`}
      className={cn(
        "group flex items-center justify-between gap-3 rounded-lg border border-border p-4 transition-colors hover:border-border/80 hover:bg-secondary/30",
        className
      )}
    >
      <div className="min-w-0 space-y-1">
        <p className="truncate font-medium">{submission.studentName}</p>
        <p className="text-muted-foreground text-xs">
          {formatSubmittedAt(submission.submittedAt)}
        </p>
        <ClientOriginBadge metadata={submission.clientMetadata} />
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="text-sm tabular-nums">
          {submission.score}/{submission.total}
        </span>
        <ScoreBadge score={submission.score} total={submission.total} />
        <ChevronRight className="text-muted-foreground size-4 transition-transform group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

export function SubmissionList({ slug, submissions }: SubmissionListProps) {
  if (submissions.length === 0) {
    return (
      <p className="text-muted-foreground py-12 text-center text-sm">
        No submissions yet.
      </p>
    );
  }

  return (
    <>
      <div className="hidden sm:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Student</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Percentage</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map((submission) => (
              <TableRow key={submission.id} className="group">
                <TableCell className="font-medium">
                  {submission.studentName}
                </TableCell>
                <TableCell>
                  <ClientOriginBadge metadata={submission.clientMetadata} />
                </TableCell>
                <TableCell className="tabular-nums">
                  {submission.score}/{submission.total}
                </TableCell>
                <TableCell>
                  <ScoreBadge
                    score={submission.score}
                    total={submission.total}
                  />
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatSubmittedAt(submission.submittedAt)}
                </TableCell>
                <TableCell>
                  <Link
                    href={`/admin/quizzes/${slug}/submissions/${submission.id}`}
                    className="text-muted-foreground hover:text-foreground inline-flex items-center justify-center"
                    aria-label={`Review ${submission.studentName}'s submission`}
                  >
                    <ChevronRight className="size-4" />
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="space-y-3 sm:hidden">
        {submissions.map((submission) => (
          <SubmissionRowLink
            key={submission.id}
            slug={slug}
            submission={submission}
          />
        ))}
      </div>
    </>
  );
}
