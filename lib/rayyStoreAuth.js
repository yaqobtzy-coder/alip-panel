import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

// Sesi terpisah dari alip-panel (cookie beda) — supaya login store & login
// panel admin lama gak saling nabrak, meski jalan di project & secret yang
// sama.
const COOKIE_NAME = "rayy_store_session";
const ADMIN_COOKIE_NAME = "rayy_store_admin_session";
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET);

export async function createStoreSession({ uid, username }) {
  const token = await new SignJWT({ uid, username })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret());
  cookies().set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function getStoreSession() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload;
  } catch {
    return null;
  }
}

export function clearStoreSession() {
  cookies().set(COOKIE_NAME, "", { path: "/", maxAge: 0 });
}

// ---------------- Admin web Rayy Store ----------------
export async function createAdminSession() {
  const token = await new SignJWT({ admin: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret());
  cookies().set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7
  });
}

export async function getAdminSession() {
  const token = cookies().get(ADMIN_COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return payload?.admin ? payload : null;
  } catch {
    return null;
  }
}

export function clearAdminSession() {
  cookies().set(ADMIN_COOKIE_NAME, "", { path: "/", maxAge: 0 });
}
