import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tournamentRegistrations, athletes } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (role !== "admin") return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });

  const { id } = await params;
  const body = await request.json();

  const reg = await db
    .select()
    .from(tournamentRegistrations)
    .where(eq(tournamentRegistrations.id, parseInt(id)))
    .get();

  if (!reg) return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });

  const [updated] = await db
    .update(tournamentRegistrations)
    .set({ status: body.status })
    .where(eq(tournamentRegistrations.id, parseInt(id)))
    .returning();

  return NextResponse.json({ registration: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  const currentUserId = parseInt((session.user as { id?: string })?.id || "0");

  const { id } = await params;

  const reg = await db
    .select({
      id: tournamentRegistrations.id,
      athleteId: tournamentRegistrations.athleteId,
      userId: athletes.userId,
    })
    .from(tournamentRegistrations)
    .leftJoin(athletes, eq(tournamentRegistrations.athleteId, athletes.id))
    .where(eq(tournamentRegistrations.id, parseInt(id)))
    .get();

  if (!reg) return NextResponse.json({ error: "Kayıt bulunamadı" }, { status: 404 });

  if (role !== "admin" && reg.userId !== currentUserId) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  await db
    .delete(tournamentRegistrations)
    .where(eq(tournamentRegistrations.id, parseInt(id)));

  return NextResponse.json({ success: true });
}
