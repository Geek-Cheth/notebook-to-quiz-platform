"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Globe, Loader2, MapPin, Plus, X } from "lucide-react";

import { Badge } from "@/components/ui/badge";
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
import { updateAdminQuizCountryLock } from "@/lib/api";
import {
  COMMON_COUNTRIES,
  formatCountryCodes,
  formatCountryList,
  getCountryName,
  normalizeCountryCode,
  normalizeCountryCodes,
} from "@/lib/country-lock";

type CountryLockEditorProps = {
  slug: string;
  allowedCountries: string[] | null;
  onUpdated: (slug: string, allowedCountries: string[] | null) => void;
  className?: string;
  compact?: boolean;
};

export function CountryLockEditor({
  slug,
  allowedCountries,
  onUpdated,
  className,
  compact = false,
}: CountryLockEditorProps) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(allowedCountries ?? []);
  const [search, setSearch] = useState("");
  const [manualCode, setManualCode] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isWorldwide = !allowedCountries?.length;
  const label = isWorldwide
    ? "Worldwide"
    : formatCountryList(allowedCountries);
  const codeLabel = isWorldwide
    ? "Worldwide"
    : formatCountryCodes(allowedCountries);

  useEffect(() => {
    if (open) {
      setSelected(allowedCountries ?? []);
      setSearch("");
      setManualCode("");
      setError(null);
    }
  }, [open, allowedCountries]);

  const filteredCountries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return COMMON_COUNTRIES;
    return COMMON_COUNTRIES.filter(
      (country) =>
        country.code.toLowerCase().includes(query) ||
        country.name.toLowerCase().includes(query)
    );
  }, [search]);

  function toggleCountry(code: string) {
    setSelected((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  }

  function addManualCode() {
    const normalized = normalizeCountryCode(manualCode);
    if (!normalized) {
      setError("Enter a valid 2-letter ISO country code (e.g. LK).");
      return;
    }
    setSelected((prev) =>
      prev.includes(normalized) ? prev : [...prev, normalized]
    );
    setManualCode("");
    setError(null);
  }

  function setWorldwide() {
    setSelected([]);
    setError(null);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();

    const nextValue = selected.length ? normalizeCountryCodes(selected) : null;
    const currentValue = allowedCountries?.length
      ? normalizeCountryCodes(allowedCountries)
      : null;

    const unchanged =
      (nextValue === null && currentValue === null) ||
      (nextValue !== null &&
        currentValue !== null &&
        nextValue.length === currentValue.length &&
        nextValue.every((code, index) => code === currentValue[index]));

    if (unchanged) {
      setOpen(false);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const result = await updateAdminQuizCountryLock(slug, nextValue);
      onUpdated(result.slug, result.allowedCountries);
      setOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to update country lock."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => setOpen(true)}
        className={`text-muted-foreground hover:text-foreground h-auto min-w-0 justify-start gap-1.5 px-2 py-1 text-left font-normal ${className ?? ""}`}
        aria-label={`Edit region lock: ${label}`}
      >
        {isWorldwide ? (
          <Globe className="size-3 shrink-0" />
        ) : (
          <MapPin className="size-3 shrink-0" />
        )}
        <span className="min-w-0 truncate text-xs">
          {compact ? codeLabel : label}
        </span>
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Country access</DialogTitle>
            <DialogDescription>
              Restrict who can open this quiz by country. Leave empty for worldwide
              access.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant={selected.length === 0 ? "default" : "outline"}
                size="sm"
                onClick={setWorldwide}
                disabled={saving}
              >
                <Globe className="size-3.5" />
                Worldwide
              </Button>
              {selected.length > 0 && (
                <Badge variant="secondary">{selected.length} selected</Badge>
              )}
            </div>

            {selected.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {normalizeCountryCodes(selected).map((code) => (
                  <Badge key={code} variant="outline" className="gap-1 pr-1">
                    {code} · {getCountryName(code)}
                    <button
                      type="button"
                      onClick={() => toggleCountry(code)}
                      className="hover:bg-accent rounded p-0.5"
                      aria-label={`Remove ${getCountryName(code)}`}
                    >
                      <X className="size-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor={`country-search-${slug}`}>Search countries</Label>
              <Input
                id={`country-search-${slug}`}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or code…"
                disabled={saving}
              />
            </div>

            <div className="max-h-48 space-y-1 overflow-y-auto rounded-md border border-border p-1">
              {filteredCountries.length === 0 ? (
                <p className="text-muted-foreground px-2 py-3 text-sm">
                  No matching countries.
                </p>
              ) : (
                filteredCountries.map((country) => {
                  const isSelected = selected.includes(country.code);
                  return (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => toggleCountry(country.code)}
                      disabled={saving}
                      className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-left text-sm transition-colors ${
                        isSelected
                          ? "bg-accent text-accent-foreground"
                          : "hover:bg-accent/60"
                      }`}
                    >
                      <span>
                        {country.name}{" "}
                        <span className="text-muted-foreground">{country.code}</span>
                      </span>
                      {isSelected && <Check className="size-4 shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={`manual-code-${slug}`}>Add ISO code</Label>
              <div className="flex gap-2">
                <Input
                  id={`manual-code-${slug}`}
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                  placeholder="e.g. LK"
                  maxLength={2}
                  disabled={saving}
                  className="font-mono uppercase"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={addManualCode}
                  disabled={saving || manualCode.trim().length !== 2}
                >
                  <Plus className="size-4" />
                  Add
                </Button>
              </div>
            </div>

            {error && <p className="text-destructive text-sm">{error}</p>}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
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
