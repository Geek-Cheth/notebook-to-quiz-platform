import type { NextRequest } from "next/server";

export const COMMON_COUNTRIES = [
  { code: "LK", name: "Sri Lanka" },
  { code: "US", name: "United States" },
  { code: "GB", name: "United Kingdom" },
  { code: "IN", name: "India" },
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "SG", name: "Singapore" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "NZ", name: "New Zealand" },
  { code: "JP", name: "Japan" },
  { code: "MY", name: "Malaysia" },
  { code: "PH", name: "Philippines" },
  { code: "PK", name: "Pakistan" },
  { code: "BD", name: "Bangladesh" },
  { code: "ZA", name: "South Africa" },
  { code: "NG", name: "Nigeria" },
  { code: "BR", name: "Brazil" },
  { code: "MX", name: "Mexico" },
] as const;

export const COUNTRY_RESTRICTED_MESSAGE =
  "This quiz is not available in your region.";

const displayNames = new Intl.DisplayNames(["en"], { type: "region" });

export function normalizeCountryCode(
  code: string | null | undefined
): string | null {
  if (!code) return null;

  const normalized = code.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(normalized)) {
    return null;
  }

  return normalized;
}

export function normalizeCountryCodes(codes: string[]): string[] {
  const unique = new Set<string>();
  for (const code of codes) {
    const normalized = normalizeCountryCode(code);
    if (normalized) unique.add(normalized);
  }
  return [...unique].sort();
}

export function parseAllowedCountries(value: unknown): string[] | null {
  if (value == null) return null;
  if (!Array.isArray(value)) return null;

  const codes = normalizeCountryCodes(value.map(String));
  return codes.length ? codes : null;
}

export function getCountryName(code: string): string {
  const normalized = normalizeCountryCode(code);
  if (!normalized) return code;
  return displayNames.of(normalized) ?? normalized;
}

export function formatCountryList(codes: string[] | null): string {
  if (!codes?.length) return "Worldwide";
  return codes.map((code) => getCountryName(code)).join(", ");
}

export function formatCountryCodes(codes: string[] | null): string {
  if (!codes?.length) return "Worldwide";
  return codes.join(", ");
}

export function getVisitorCountry(request: NextRequest): string | null {
  const raw =
    request.headers.get("x-vercel-ip-country") ??
    request.headers.get("cf-ipcountry") ??
    request.headers.get("x-country-code");

  if (!raw) return null;

  const normalized = normalizeCountryCode(raw);
  if (!normalized || normalized === "XX" || normalized === "T1") {
    return null;
  }

  return normalized;
}

export function isCountryAllowed(
  allowedCountries: string[] | null | undefined,
  countryCode: string | null
): boolean {
  if (!allowedCountries || allowedCountries.length === 0) {
    return true;
  }

  const visitorCode = normalizeCountryCode(countryCode);
  if (!visitorCode) {
    return false;
  }

  const allowed = new Set(
    allowedCountries
      .map((code) => normalizeCountryCode(code))
      .filter((code): code is string => code !== null)
  );

  return allowed.has(visitorCode);
}
