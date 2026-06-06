import { NextRequest, NextResponse } from "next/server";

import {
  ADMIN_COOKIE_NAME,
  createSessionToken,
  getAdminCookieOptions,
  verifyPasscode,
} from "@/lib/admin-auth";
import { jsonError } from "@/lib/api-utils";

export const runtime = "nodejs";

interface AuthBody {
  passcode?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AuthBody;
    const passcode = body.passcode?.trim() ?? "";

    if (!passcode) {
      return jsonError("Passcode is required");
    }

    if (!verifyPasscode(passcode)) {
      return jsonError("Invalid passcode", 401);
    }

    const token = await createSessionToken();
    const response = NextResponse.json({ ok: true });
    response.cookies.set(ADMIN_COOKIE_NAME, token, getAdminCookieOptions());
    return response;
  } catch {
    return jsonError("Invalid request body");
  }
}
