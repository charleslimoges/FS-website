import { NextRequest, NextResponse } from "next/server";

/**
 * Gate every /api/admin/* route behind the admin session cookie set by
 * /api/admin/login. Without this, the admin endpoints (edit/delete/sync) are
 * callable by anyone — the login screen alone is only client-side decoration.
 */
export function middleware(req: NextRequest) {
  // The login route must stay open so a password can be exchanged for a cookie.
  if (req.nextUrl.pathname === "/api/admin/login") {
    return NextResponse.next();
  }

  const expected = process.env.ADMIN_PASSWORD;
  // No password configured (e.g. local dev) → don't lock anyone out.
  if (!expected) return NextResponse.next();

  const token = req.cookies.get("fs_admin")?.value;
  if (token === expected) return NextResponse.next();

  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export const config = {
  matcher: "/api/admin/:path*",
};
