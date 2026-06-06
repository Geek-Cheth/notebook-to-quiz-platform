"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Loader2, Shield } from "lucide-react";

import { BrandLink } from "@/components/layout/BrandLink";
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

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = passcode.trim();
    if (!/^\d{8}$/.test(trimmed)) {
      setError("Enter a valid 8-digit admin passcode.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: trimmed }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Invalid passcode.");
      }

      const returnUrl = searchParams.get("returnUrl");
      const destination =
        returnUrl?.startsWith("/admin") && returnUrl !== "/admin/login"
          ? returnUrl
          : "/admin";
      router.push(destination);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-4 py-12 sm:px-6">
      <div className="animate-fade-in mb-10 text-center">
        <BrandLink className="mb-8 inline-flex" showLabel />
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Admin access
        </h1>
        <p className="text-muted-foreground mt-2 text-sm sm:text-base">
          Enter the admin passcode to manage quizzes.
        </p>
      </div>

      <Card className="animate-slide-up border-border/80">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="text-muted-foreground size-4" />
            <CardTitle className="text-base">Admin passcode</CardTitle>
          </div>
          <CardDescription>8-digit code for authorized administrators</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="passcode" className="sr-only">
                Admin passcode
              </Label>
              <Input
                id="passcode"
                inputMode="numeric"
                pattern="\d{8}"
                maxLength={8}
                placeholder="••••••••"
                value={passcode}
                onChange={(e) =>
                  setPasscode(e.target.value.replace(/\D/g, "").slice(0, 8))
                }
                className="text-center font-mono text-lg tracking-[0.3em]"
                autoComplete="off"
                autoFocus
                disabled={loading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Verifying…
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="size-4" />
                </>
              )}
            </Button>
          </form>

          {error && (
            <p className="text-destructive animate-fade-in mt-4 text-center text-sm">
              {error}
            </p>
          )}
        </CardContent>
      </Card>
    </main>
  );
}

export default function AdminLoginPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center">
          <Loader2 className="text-muted-foreground size-8 animate-spin" />
        </main>
      }
    >
      <AdminLoginForm />
    </Suspense>
  );
}
