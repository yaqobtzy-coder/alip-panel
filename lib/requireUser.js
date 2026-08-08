import { db } from "@/lib/firebaseAdmin";
import { getSession } from "@/lib/auth";

// Returns { session, ref, user } or null if not logged in / not approved.
export async function requireUser() {
  const session = await getSession();
  if (!session) return null;
  const ref = db.collection("users").doc(session.uid);
  const doc = await ref.get();
  if (!doc.exists) return null;
  const user = doc.data();
  if (user.status !== "approved") return null;
  return { session, ref, user };
}
