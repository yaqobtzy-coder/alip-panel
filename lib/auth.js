import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE_NAME = "alip_session";
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET);

export async function createSession({ uid, username, role, status }) {
  const token = await new SignJWT({ uid, username, role, status })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());

  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function getSession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}

export function clearSession() {
  cookies().set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

// Role hierarchy used across the app.
// owner > pt > reseller > fullup
// Pricing/paths now live in lib/roles.js (client-safe, no next/headers)
// so both API routes and client components share one source of truth.
export { ROLES, UPGRADE_PATHS, ROLE_LABEL } from "@/lib/roles";
