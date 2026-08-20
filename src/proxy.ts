/**
 * Route protection (Next 16 renamed `middleware.ts` -> `proxy.ts`).
 *
 * IMPORTANT — this is defense-in-depth and UX, NOT the security boundary.
 * Proxy runs at the edge/CDN and has historically been bypassable
 * (see the Next.js middleware-bypass advisory patched in 16.3.1), so the
 * authoritative check lives in the API routes and server components,
 * every one of which calls `auth()` and scopes queries by session user id.
 *
 * We deliberately do NOT import `auth()` here: the docs warn against
 * relying on shared modules in proxy, and pulling NextAuth in would drag
 * Prisma + bcrypt into the edge bundle. A cookie-presence check is enough
 * to bounce anonymous users to /signin quickly; a forged cookie gets
 * nothing, because the real verification happens downstream.
 */
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/** Pages that require a signed-in user. */
const PROTECTED = ["/plan", "/customize", "/log"];

/**
 * Auth.js session cookie names. The `__Secure-` prefix is used whenever the
 * deployment is HTTPS; large sessions are split into `.0`, `.1`, ... chunks.
 */
function hasSessionCookie(req: NextRequest): boolean {
  return req.cookies
    .getAll()
    .some(
      (c) =>
        (c.name === "authjs.session-token" ||
          c.name === "__Secure-authjs.session-token" ||
          c.name.startsWith("authjs.session-token.") ||
          c.name.startsWith("__Secure-authjs.session-token.")) &&
        c.value.length > 0
    );
}

export function proxy(req: NextRequest) {
  const { pathname, search } = req.nextUrl;
  const needsAuth = PROTECTED.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (!needsAuth || hasSessionCookie(req)) {
    return NextResponse.next();
  }
  const signin = new URL("/signin", req.url);
  signin.searchParams.set("callbackUrl", `${pathname}${search}`);
  return NextResponse.redirect(signin);
}

export const config = {
  matcher: ["/plan/:path*", "/customize/:path*", "/log/:path*"],
};
