import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getStoreSession } from "@/lib/rayyStoreAuth";
import { getStoreUser, updateStoreUser } from "@/lib/rayyStore";

// Update profil pembeli Rayy Store: nomor WhatsApp, dan opsional ganti
// password. Username tidak bisa diganti (dipakai sebagai login).
export async function PATCH(req) {
  const session = await getStoreSession();
  if (!session) return NextResponse.json({ error: "Silakan login dulu." }, { status: 401 });

  const { whatsapp, newPassword } = await req.json();
  const patch = {};

  if (whatsapp !== undefined) {
    const wa = String(whatsapp || "").replace(/[^0-9]/g, "");
    if (wa.length < 10) {
      return NextResponse.json({ error: "Nomor WhatsApp tidak valid." }, { status: 400 });
    }
    patch.whatsapp = wa;
  }

  if (newPassword) {
    if (String(newPassword).length < 4) {
      return NextResponse.json({ error: "Password baru minimal 4 karakter." }, { status: 400 });
    }
    patch.passwordHash = await bcrypt.hash(String(newPassword), 10);
  }

  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ error: "Tidak ada perubahan." }, { status: 400 });
  }

  await updateStoreUser(session.uid, patch);
  const user = await getStoreUser(session.uid);
  return NextResponse.json({ success: true, whatsapp: user?.whatsapp || "" });
}
