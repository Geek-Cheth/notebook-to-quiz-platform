import Link from "next/link";

import { Logo } from "@/components/layout/Logo";
import { cn } from "@/lib/utils";

type BrandLinkProps = {
  className?: string;
  showLabel?: boolean | "responsive";
};

export function BrandLink({ className, showLabel = "responsive" }: BrandLinkProps) {
  return (
    <Link
      href="/"
      className={cn(
        "group flex items-center gap-2 text-sm font-semibold tracking-tight transition-opacity hover:opacity-80",
        className
      )}
    >
      <Logo className="size-7" />
      {showLabel !== false && (
        <span className={showLabel === "responsive" ? "hidden sm:inline" : undefined}>
          C Quiz
        </span>
      )}
    </Link>
  );
}
