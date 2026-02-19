import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq, desc } from "drizzle-orm";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const allUsers = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      createdAt: users.createdAt,
    })
    .from(users)
    .orderBy(desc(users.createdAt));

  return NextResponse.json({ users: allUsers });
}

export async function POST(request: Request) {
  const session = await auth();
  const body = await request.json();
  const { name, email, password, userRole } = body;

  if (!name || !email || !password) {
    return NextResponse.json({ error: "Tüm alanlar zorunludur" }, { status: 400 });
  }

  const sessionRole = (session?.user as { role?: string })?.role;

  if (!session) {
    if (userRole && userRole !== "athlete") {
      return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
    }
  } else if (sessionRole !== "admin") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).get();
  if (existing) {
    return NextResponse.json({ error: "Bu e-posta zaten kullanımda" }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(users)
    .values({ name, email, password: hashedPassword, role: userRole || "athlete" })
    .returning({ id: users.id, name: users.name, email: users.email, role: users.role, createdAt: users.createdAt });

  return NextResponse.json({ user });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Yetkisiz" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (role !== "admin") {
    return NextResponse.json({ error: "Yetkisiz" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("id");
  if (!userId) {
    return NextResponse.json({ error: "ID gerekli" }, { status: 400 });
  }

  const currentUserId = (session.user as { id?: string })?.id;
  if (userId === currentUserId) {
    return NextResponse.json({ error: "Kendinizi silemezsiniz" }, { status: 400 });
  }

  await db.delete(users).where(eq(users.id, parseInt(userId)));
  return NextResponse.json({ success: true });
}
