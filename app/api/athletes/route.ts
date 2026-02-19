import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { athletes, users } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const role = (session.user as { role?: string })?.role;
  const currentUserId = parseInt((session.user as { id?: string })?.id || "0");

  const baseQuery = db
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
    .orderBy(desc(athletes.createdAt));

  let allAthletes;
  if (role === "athlete") {
    allAthletes = await db
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
      .where(eq(athletes.userId, currentUserId));
  } else {
    allAthletes = await baseQuery;
  }

  let filtered = allAthletes;
  if (search) {
    const s = search.toLowerCase();
    filtered = filtered.filter(
      (a) =>
        a.firstName.toLowerCase().includes(s) ||
        a.lastName.toLowerCase().includes(s) ||
        (a.club && a.club.toLowerCase().includes(s)) ||
        (a.userEmail && a.userEmail.toLowerCase().includes(s))
    );
  }
  if (status) {
    filtered = filtered.filter((a) => a.status === status);
  }

  const total = filtered.length;
  const paginated = filtered.slice(offset, offset + limit);

  return NextResponse.json({ athletes: paginated, total, page, limit });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const body = await request.json();
  const { firstName, lastName, birthDate, gender, phone, club, licenseNo, nationalId, level, notes, email, password, name } = body;

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Ad ve soyad zorunludur" }, { status: 400 });
  }

  const role = (session.user as { role?: string })?.role;

  if (role === "admin") {
    if (!email || !password) {
      return NextResponse.json({ error: "E-posta ve şifre zorunludur" }, { status: 400 });
    }

    const existing = await db.select().from(users).where(eq(users.email, email)).get();
    if (existing) {
      return NextResponse.json({ error: "Bu e-posta zaten kullanımda" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const [newUser] = await db
      .insert(users)
      .values({ name: name || `${firstName} ${lastName}`, email, password: hashedPassword, role: "athlete" })
      .returning();

    const [athlete] = await db
      .insert(athletes)
      .values({ userId: newUser.id, firstName, lastName, birthDate, gender, phone, club, licenseNo, nationalId, level: level || "beginner", notes, status: "approved" })
      .returning();

    return NextResponse.json({ athlete, user: { id: newUser.id, email: newUser.email } });
  } else {
    const userId = parseInt((session.user as { id?: string })?.id || "0");
    const existing = await db.select().from(athletes).where(eq(athletes.userId, userId)).get();
    if (existing) {
      return NextResponse.json({ error: "Zaten bir sporcu profiliniz var" }, { status: 400 });
    }

    const [athlete] = await db
      .insert(athletes)
      .values({ userId, firstName, lastName, birthDate, gender, phone, club, licenseNo, nationalId, level: level || "beginner", notes, status: "pending" })
      .returning();

    return NextResponse.json({ athlete });
  }
}
