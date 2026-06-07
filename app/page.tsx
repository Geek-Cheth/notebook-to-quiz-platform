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
import {
  formatQuizPasswordInput,
  isValidQuizPassword,
  normalizeQuizPassword,
} from "@/lib/password";

export default function HomePage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const normalized = normalizeQuizPassword(password);
    if (!isValidQuizPassword(normalized)) {
      setError("Enter a valid 4-character quiz password (letters and numbers).");
      return;
    }

    setLoading(true);
    try {
      const { slug } = await fetchQuizByPassword(normalized);
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
      <main className="mx-auto flex flex-1 max-w-lg flex-col justify-center px-4 py-12 sm:px-6">
        <div className="animate-fade-in mb-10 text-center">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Join a quiz
          </h1>
          <p className="text-muted-foreground mt-2 text-sm sm:text-base">
            Enter the 4-character password from your instructor.
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
                4-character code (letters and numbers)
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
                    inputMode="text"
                    pattern="[A-Z0-9]{4}"
                    maxLength={4}
                    placeholder="A1B2"
                    value={password}
                    onChange={(e) => setPassword(formatQuizPasswordInput(e.target.value))}
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
