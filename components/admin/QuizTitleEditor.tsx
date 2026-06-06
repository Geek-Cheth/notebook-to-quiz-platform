"use client";

import { useEffect, useState } from "react";
import { Loader2, Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAdminQuizTitle } from "@/lib/api";

type QuizTitleEditorProps = {
  slug: string;
  title: string;
  onUpdated: (slug: string, title: string) => void;
  className?: string;
};

export function QuizTitleEditor({
  slug,
  title,
  onUpdated,
  className,
}: QuizTitleEditorProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState(title);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDraft(title);
      setError(null);
    }
  }, [open, title]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = draft.trim();
    if (!trimmed) {
      setError("Title is required.");
      return;
    }
    if (trimmed === title) {
      setOpen(false);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await updateAdminQuizTitle(slug, trimmed);
      onUpdated(result.slug, result.title);
      setOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update title.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className={`flex min-w-0 items-center gap-1 ${className ?? ""}`}>
        <span className="truncate">{title}</span>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(true)}
          className="text-muted-foreground hover:text-foreground size-7 shrink-0 p-0"
          aria-label={`Edit title for ${title}`}
        >
          <Pencil className="size-3" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit quiz title</DialogTitle>
            <DialogDescription>
              Update the title shown to students and on the dashboard.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor={`title-${slug}`}>Title</Label>
              <Input
                id={`title-${slug}`}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                disabled={saving}
                autoFocus
              />
            </div>
            {error && (
              <p className="text-destructive text-sm">{error}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !draft.trim()}>
                {saving ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
