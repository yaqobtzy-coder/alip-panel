import { NextResponse } from "next/server";
import { getStoreSession } from "@/lib/rayyStoreAuth";
import { listOrdersByUser } from "@/lib/rayyStore";

export async function GET() {
  const session = await getStoreSession();
  if (!session) return NextResponse.json({ error: "Silakan login dulu." }, { status: 401 });
  const orders = await listOrdersByUser(session.uid);
  return NextResponse.json(orders);
}
