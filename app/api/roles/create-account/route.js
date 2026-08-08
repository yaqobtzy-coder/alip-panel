import { NextResponse } from "next/server";
import { requireUser } from "@/lib/requireUser";
import { createAccountAsOwner } from "@/lib/adminActions";

// Who is allowed to create which role:
const ALLOWED = {
  pt: ["fullup", "reseller"],
  owner: ["fullup", "reseller", "pt"]
};

export async function POST(req) {
  const auth = await requireUser();
  if (!auth) return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  const { session, user } = auth;

  const allowedRoles = ALLOWED[user.role];
  if (!allowedRoles) {
    return NextResponse.json({ error: "Role kamu tidak bisa membuat akun." }, { status: 403 });
  }

  const { username, password, role } = await req.json();
  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: "Data tidak valid." }, { status: 400 });
  }

  const result = await createAccountAsOwner({ username, password, role, parentId: session.uid });
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 });
  return NextResponse.json({ success: true });
}
