import { NextResponse } from "next/server";

import { clearAdminCookie } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  return clearAdminCookie(response);
}
