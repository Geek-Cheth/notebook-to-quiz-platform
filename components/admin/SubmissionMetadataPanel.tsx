"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, Globe } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { countryFlagEmoji } from "@/lib/request-metadata";
import type { ClientMetadata } from "@/lib/types";
import { cn } from "@/lib/utils";

type SubmissionMetadataPanelProps = {
  metadata: ClientMetadata | null | undefined;
  submittedAt: string;
};

type MetadataFieldProps = {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
  className?: string;
};

function MetadataField({ label, value, mono, className }: MetadataFieldProps) {
  const display = value?.trim() ? value : "—";

  return (
    <div className={cn("space-y-1", className)}>
      <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
        {label}
      </dt>
      <dd
        className={cn(
          "text-sm break-words",
          mono && "font-mono text-xs sm:text-sm"
        )}
      >
        {display}
      </dd>
    </div>
  );
}

function formatSubmittedAt(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function SubmissionMetadataPanel({
  metadata,
  submittedAt,
}: SubmissionMetadataPanelProps) {
  const [uaExpanded, setUaExpanded] = useState(false);

  const userAgent = metadata?.userAgent;
  const uaTruncated =
    userAgent && userAgent.length > 72
      ? `${userAgent.slice(0, 72)}…`
      : userAgent;

  const countryCode = metadata?.country?.toUpperCase() ?? null;
  const flag = countryFlagEmoji(countryCode);

  return (
    <Card className="border-border/80">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <Globe className="text-muted-foreground size-4" />
          Client metadata
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <MetadataField label="IP address" value={metadata?.ip} mono />
          <MetadataField
            label="Country"
            value={
              countryCode
                ? `${flag ? `${flag} ` : ""}${countryCode}`
                : null
            }
          />
          <MetadataField label="City" value={metadata?.city} />
          <MetadataField label="Region" value={metadata?.region} />
          <MetadataField label="Timezone" value={metadata?.timezone} mono />
          <MetadataField label="ISP" value={metadata?.isp} />
          <MetadataField label="Browser" value={metadata?.browser} />
          <MetadataField label="OS" value={metadata?.os} />
          <MetadataField label="Device" value={metadata?.device} />
          <MetadataField
            label="Accept-Language"
            value={metadata?.acceptLanguage}
            mono
            className="sm:col-span-2"
          />
          <MetadataField
            label="Submitted"
            value={formatSubmittedAt(submittedAt)}
          />
        </dl>

        <div className="mt-4 space-y-1 border-t border-border/60 pt-4">
          <dt className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
            User-Agent
          </dt>
          <dd className="font-mono text-xs leading-relaxed break-all">
            {userAgent ? (
              <>
                {uaExpanded ? userAgent : uaTruncated}
                {userAgent.length > 72 && (
                  <button
                    type="button"
                    onClick={() => setUaExpanded((v) => !v)}
                    className="text-primary mt-2 flex items-center gap-1 text-xs font-sans hover:underline"
                  >
                    {uaExpanded ? (
                      <>
                        <ChevronUp className="size-3" />
                        Show less
                      </>
                    ) : (
                      <>
                        <ChevronDown className="size-3" />
                        Show full user-agent
                      </>
                    )}
                  </button>
                )}
              </>
            ) : (
              <span className="font-sans text-sm">—</span>
            )}
          </dd>
        </div>
      </CardContent>
    </Card>
  );
}
