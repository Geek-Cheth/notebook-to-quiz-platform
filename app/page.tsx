"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Lock } from "lucide-react";

import { Header } from "@/components/layout/Header";
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
import { fetchQuizByPassword } from "@/lib/api";

export default function HomePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmed = password.trim();
    if (!/^\d{8}$/.test(trimmed)) {
      setError("Enter a valid 8-digit quiz password.");
      return;
    }

    setLoading(true);
    try {
      const { slug } = await fetchQuizByPassword(trimmed);
      router.push(`/q/${slug}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Quiz not found.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header />
      <main className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-lg flex-col justify-center px-4 py-12 sm:px-6">
        <div className="animate-fade-in mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Join a quiz
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Enter the 8-digit password from your instructor.
          </p>
        </div>

        <div className="animate-slide-up">
          <Card className="border-border/80">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="text-muted-foreground size-4" />
                <CardTitle className="text-base">Quiz password</CardTitle>
              </div>
              <CardDescription>
                8-digit code provided by your instructor
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password" className="sr-only">
                    Quiz password
                  </Label>
                  <Input
                    id="password"
                    inputMode="numeric"
                    pattern="\d{8}"
                    maxLength={8}
                    placeholder="12345678"
                    value={password}
                    onChange={(e) =>
                      setPassword(e.target.value.replace(/\D/g, "").slice(0, 8))
                    }
                    className="text-center font-mono text-lg tracking-[0.3em]"
                    autoComplete="off"
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Looking up…" : "Continue"}
                  {!loading && <ArrowRight className="size-4" />}
                </Button>
              </form>

              {error && (
                <p className="text-destructive animate-fade-in mt-4 text-center text-sm">
                  {error}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
