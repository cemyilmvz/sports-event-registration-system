import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { athletes, users } from "@/lib/schema";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;

  const athlete = await db
    .select({
      id: athletes.id,
      userId: athletes.userId,
      firstName: athletes.firstName,
      lastName: athletes.lastName,
      birthDate: athletes.birthDate,
      gender: athletes.gender,
      phone: athletes.phone,
      club: athletes.club,
      licenseNo: athletes.licenseNo,
      nationalId: athletes.nationalId,
      level: athletes.level,
      status: athletes.status,
      notes: athletes.notes,
      createdAt: athletes.createdAt,
      userEmail: users.email,
      userName: users.name,
    })
    .from(athletes)
    .leftJoin(users, eq(athletes.userId, users.id))
    .where(eq(athletes.id, parseInt(id)))
    .get();

  if (!athlete) {
    return NextResponse.json({ error: "Sporcu bulunamadı" }, { status: 404 });
  }

  const role = (session.user as { role?: string })?.role;
  const userId = parseInt((session.user as { id?: string })?.id || "0");

  if (role !== "admin" && athlete.userId !== userId) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  return NextResponse.json({ athlete });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const athlete = await db
    .select()
    .from(athletes)
    .where(eq(athletes.id, parseInt(id)))
    .get();

  if (!athlete) {
    return NextResponse.json({ error: "Sporcu bulunamadı" }, { status: 404 });
  }

  const role = (session.user as { role?: string })?.role;
  const userId = parseInt((session.user as { id?: string })?.id || "0");

  if (role !== "admin" && athlete.userId !== userId) {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const updateData: Record<string, unknown> = {};
  const allowedFields = ["firstName", "lastName", "birthDate", "gender", "phone", "club", "licenseNo", "nationalId", "level", "notes"];

  for (const field of allowedFields) {
    if (field in body) updateData[field] = body[field];
  }

  if (role === "admin" && "status" in body) {
    updateData.status = body.status;
  }

  const [updated] = await db
    .update(athletes)
    .set(updateData)
    .where(eq(athletes.id, parseInt(id)))
    .returning();

  return NextResponse.json({ athlete: updated });
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { id } = await params;

  await db.delete(athletes).where(eq(athletes.id, parseInt(id)));
  return NextResponse.json({ success: true });
}
