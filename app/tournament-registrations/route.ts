import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { tournamentRegistrations, athletes, users } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  const currentUserId = parseInt((session.user as { id?: string })?.id || "0");

  const { searchParams } = new URL(request.url);
  const statusFilter = searchParams.get("status") || "";

  if (role === "athlete") {
    const athlete = await db
      .select()
      .from(athletes)
      .where(eq(athletes.userId, currentUserId))
      .get();

    if (!athlete) {
      return NextResponse.json({ registrations: [] });
    }

    const regs = await db
      .select()
      .from(tournamentRegistrations)
      .where(eq(tournamentRegistrations.athleteId, athlete.id))
      .orderBy(desc(tournamentRegistrations.createdAt));

    return NextResponse.json({ registrations: regs });
  }

  const regs = await db
    .select({
      id: tournamentRegistrations.id,
      athleteId: tournamentRegistrations.athleteId,
      tournamentType: tournamentRegistrations.tournamentType,
      hasPartner: tournamentRegistrations.hasPartner,
      partnerName: tournamentRegistrations.partnerName,
      status: tournamentRegistrations.status,
      createdAt: tournamentRegistrations.createdAt,
      athleteFirstName: athletes.firstName,
      athleteLastName: athletes.lastName,
      athleteBirthDate: athletes.birthDate,
      athleteClub: athletes.club,
      userEmail: users.email,
    })
    .from(tournamentRegistrations)
    .leftJoin(athletes, eq(tournamentRegistrations.athleteId, athletes.id))
    .leftJoin(users, eq(athletes.userId, users.id))
    .orderBy(desc(tournamentRegistrations.createdAt));

  const filtered = statusFilter ? regs.filter((r) => r.status === statusFilter) : regs;

  return NextResponse.json({ registrations: filtered });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  const currentUserId = parseInt((session.user as { id?: string })?.id || "0");

  const body = await request.json();
  const { tournamentType, hasPartner, partnerName } = body;

  if (!tournamentType || !["normal", "doubles"].includes(tournamentType)) {
    return NextResponse.json({ error: "Geçersiz turnuva türü" }, { status: 400 });
  }

  let athleteId: number;

  if (role === "admin" && body.athleteId) {
    athleteId = body.athleteId;
  } else {
    const athlete = await db
      .select()
      .from(athletes)
      .where(eq(athletes.userId, currentUserId))
      .get();

    if (!athlete) {
      return NextResponse.json({ error: "Sporcu profili bulunamadı" }, { status: 400 });
    }
    if (athlete.status !== "approved") {
      return NextResponse.json({ error: "Turnuvaya başvurmak için profilinizin onaylanması gerekiyor" }, { status: 400 });
    }
    athleteId = athlete.id;
  }

  const [reg] = await db
    .insert(tournamentRegistrations)
    .values({
      athleteId,
      tournamentType,
      hasPartner: hasPartner === true,
      partnerName: hasPartner && partnerName ? partnerName : null,
    })
    .returning();

  return NextResponse.json({ registration: reg });
}
