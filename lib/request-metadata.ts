import type { NextRequest } from "next/server";
import type { ClientMetadata as PublicClientMetadata } from "./types";
import type { ClientMetadata, ClientMetadataHints } from "./db-types";

const IP_HEADERS = [
  "x-forwarded-for",
  "x-real-ip",
  "cf-connecting-ip",
  "x-vercel-forwarded-for",
] as const;

const COUNTRY_HEADERS = ["cf-ipcountry", "x-vercel-ip-country"] as const;

interface ParsedUserAgent {
  browser: string | null;
  os: string | null;
  deviceType: "mobile" | "desktop" | "tablet" | null;
}

interface GeoResult {
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  isp: string | null;
}

interface IpApiResponse {
  status?: string;
  country?: string;
  countryCode?: string;
  regionName?: string;
  city?: string;
  timezone?: string;
  isp?: string;
  query?: string;
}

function normalizeHeaderValue(value: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function isPrivateOrLocalIp(ip: string): boolean {
  if (ip === "::1" || ip.startsWith("fe80:") || ip.startsWith("fc") || ip.startsWith("fd")) {
    return true;
  }

  const normalized = ip.replace(/^\[|\]$/g, "");
  if (normalized === "127.0.0.1" || normalized === "localhost") {
    return true;
  }

  const ipv4Match = normalized.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!ipv4Match) {
    return false;
  }

  const octets = ipv4Match.slice(1).map(Number);
  if (octets.some((octet) => octet > 255)) {
    return false;
  }

  const [a, b] = octets;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 169 && b === 254) return true;

  return false;
}

export function extractClientIp(request: NextRequest): string | null {
  for (const header of IP_HEADERS) {
    const raw = normalizeHeaderValue(request.headers.get(header));
    if (!raw) continue;

    const ip = header === "x-forwarded-for" ? raw.split(",")[0]?.trim() : raw;
    if (ip) return ip;
  }

  return null;
}

export function extractRequestHeaders(request: NextRequest): {
  acceptLanguage: string | null;
  referer: string | null;
  userAgent: string | null;
} {
  return {
    acceptLanguage: normalizeHeaderValue(request.headers.get("accept-language")),
    referer: normalizeHeaderValue(request.headers.get("referer")),
    userAgent: normalizeHeaderValue(request.headers.get("user-agent")),
  };
}

export function parseUserAgent(ua: string | null): ParsedUserAgent {
  if (!ua) {
    return { browser: null, os: null, deviceType: null };
  }

  let browser: string | null = null;
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = "Opera";
  else if (/Chrome\//i.test(ua) && !/Edg\//i.test(ua)) browser = "Chrome";
  else if (/Firefox\//i.test(ua)) browser = "Firefox";
  else if (/Safari\//i.test(ua) && !/Chrome\//i.test(ua)) browser = "Safari";
  else if (/MSIE|Trident/i.test(ua)) browser = "Internet Explorer";

  let os: string | null = null;
  if (/Windows NT/i.test(ua)) os = "Windows";
  else if (/Mac OS X|Macintosh/i.test(ua)) os = "macOS";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/CrOS/i.test(ua)) os = "Chrome OS";
  else if (/Linux/i.test(ua)) os = "Linux";

  let deviceType: ParsedUserAgent["deviceType"] = "desktop";
  if (/iPad|Tablet|PlayBook|Silk(?!.*Mobile)/i.test(ua)) {
    deviceType = "tablet";
  } else if (/Mobile|iPhone|iPod|Android.*Mobile|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    deviceType = "mobile";
  }

  return { browser, os, deviceType };
}

function geoFromHeaders(request: NextRequest): Pick<GeoResult, "countryCode"> | null {
  for (const header of COUNTRY_HEADERS) {
    const raw = normalizeHeaderValue(request.headers.get(header));
    if (!raw || raw === "XX" || raw === "T1") continue;

    const countryCode = raw.toUpperCase();
    if (/^[A-Z]{2}$/.test(countryCode)) {
      return { countryCode };
    }
  }

  return null;
}

async function geoFromIpApi(ip: string): Promise<GeoResult | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const url = `http://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,countryCode,regionName,city,timezone,isp,query`;
    const response = await fetch(url, {
      signal: controller.signal,
      next: { revalidate: 0 },
    });

    if (!response.ok) return null;

    const data = (await response.json()) as IpApiResponse;
    if (data.status !== "success") return null;

    return {
      country: data.country ?? null,
      countryCode: data.countryCode?.toUpperCase() ?? null,
      region: data.regionName ?? null,
      city: data.city ?? null,
      timezone: data.timezone ?? null,
      isp: data.isp ?? null,
    };
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function lookupGeo(
  request: NextRequest,
  ip: string | null
): Promise<GeoResult | null> {
  const headerGeo = geoFromHeaders(request);
  if (headerGeo?.countryCode) {
    return {
      country: null,
      countryCode: headerGeo.countryCode,
      region: null,
      city: null,
      timezone: null,
      isp: null,
    };
  }

  if (!ip || isPrivateOrLocalIp(ip)) {
    return null;
  }

  return geoFromIpApi(ip);
}

export async function buildClientMetadata(
  request: NextRequest,
  clientHints?: ClientMetadataHints
): Promise<ClientMetadata> {
  const ip = extractClientIp(request);
  const headers = extractRequestHeaders(request);
  const userAgent = parseUserAgent(headers.userAgent);
  const geo = await lookupGeo(request, ip);

  return {
    ip,
    headers,
    userAgent,
    geo,
    clientHints: clientHints ?? null,
    capturedAt: new Date().toISOString(),
  };
}

function capitalizeDevice(
  deviceType: ClientMetadata["userAgent"]["deviceType"]
): string | null {
  if (!deviceType) return null;
  return deviceType.charAt(0).toUpperCase() + deviceType.slice(1);
}

/** Map stored submission metadata to the flat admin API shape. */
export function toPublicClientMetadata(
  raw: ClientMetadata | null | undefined
): PublicClientMetadata | null {
  if (!raw) return null;

  if ("headers" in raw && raw.headers) {
    return {
      ip: raw.ip,
      country: raw.geo?.countryCode ?? null,
      city: raw.geo?.city ?? null,
      region: raw.geo?.region ?? null,
      timezone: raw.geo?.timezone ?? raw.clientHints?.timezone ?? null,
      isp: raw.geo?.isp ?? null,
      browser: raw.userAgent?.browser ?? null,
      os: raw.userAgent?.os ?? null,
      device: capitalizeDevice(raw.userAgent?.deviceType ?? null),
      userAgent: raw.headers.userAgent,
      acceptLanguage: raw.headers.acceptLanguage,
    };
  }

  const legacy = raw as unknown as Record<string, unknown>;
  const str = (key: string): string | null =>
    typeof legacy[key] === "string" ? (legacy[key] as string) : null;

  const country =
    str("country_code") ?? str("countryCode") ?? str("country");
  const device =
    str("device_type") ?? str("deviceType") ?? str("device");

  return {
    ip: str("ip"),
    country: country?.length === 2 ? country.toUpperCase() : country,
    city: str("city"),
    region: str("region"),
    timezone: str("timezone"),
    isp: str("isp"),
    browser: str("browser"),
    os: str("platform") ?? str("os"),
    device: device
      ? device.charAt(0).toUpperCase() + device.slice(1).toLowerCase()
      : null,
    userAgent: str("user_agent") ?? str("userAgent"),
    acceptLanguage: str("accept_language") ?? str("acceptLanguage"),
  };
}

export function countryFlagEmoji(code: string | null | undefined): string {
  if (!code || code.length !== 2) return "";
  const upper = code.toUpperCase();
  return String.fromCodePoint(
    ...upper.split("").map((c) => 0x1f1e6 - 65 + c.charCodeAt(0))
  );
}

export function truncateIp(
  ip: string | null | undefined,
  visible = 10
): string {
  if (!ip) return "—";
  if (ip.length <= visible + 1) return ip;
  return `${ip.slice(0, visible)}…`;
}
