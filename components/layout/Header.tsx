import Link from "next/link";

import { AdminLogoutButton } from "@/components/layout/AdminLogoutButton";
import { cn } from "@/lib/utils";

interface HeaderProps {
  className?: string;
  showAdmin?: boolean;
}

export function Header({ className, showAdmin = false }: HeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur-md",
        className
      )}
    >
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="group flex items-center gap-2 text-sm font-semibold tracking-tight transition-opacity hover:opacity-80"
        >
          <span className="flex size-7 items-center justify-center rounded-md border border-border bg-secondary text-xs font-bold">
            Q
          </span>
          <span className="hidden sm:inline">Quiz Platform</span>
        </Link>

        {showAdmin && (
          <nav className="flex items-center gap-2 text-sm sm:gap-4">
            <Link
              href="/admin"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            <Link
              href="/admin/import"
              className="text-muted-foreground transition-colors hover:text-foreground"
            >
              Import
            </Link>
            <AdminLogoutButton />
          </nav>
        )}
      </div>
    </header>
  );
}
