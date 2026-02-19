import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { athletes, users } from "@/lib/schema";
import { eq, count, desc } from "drizzle-orm";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, UserCheck, Clock, XCircle } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const role = (session.user as { role?: string })?.role;
  if (role !== "admin") redirect("/athlete");

  const [totalAthletes, pendingAthletes, approvedAthletes, rejectedAthletes, totalUsers] =
    await Promise.all([
      db.select({ count: count() }).from(athletes).get(),
      db.select({ count: count() }).from(athletes).where(eq(athletes.status, "pending")).get(),
      db.select({ count: count() }).from(athletes).where(eq(athletes.status, "approved")).get(),
      db.select({ count: count() }).from(athletes).where(eq(athletes.status, "rejected")).get(),
      db.select({ count: count() }).from(users).get(),
    ]);

  const recentAthletes = await db
    .select({
      id: athletes.id,
      firstName: athletes.firstName,
      lastName: athletes.lastName,
      club: athletes.club,
      level: athletes.level,
      status: athletes.status,
      createdAt: athletes.createdAt,
      userEmail: users.email,
    })
    .from(athletes)
    .leftJoin(users, eq(athletes.userId, users.id))
    .orderBy(desc(athletes.createdAt))
    .limit(5);

  const stats = [
    {
      title: "Toplam Sporcu",
      value: totalAthletes?.count ?? 0,
      icon: Users,
      color: "text-blue-400",
      bg: "bg-blue-500/10",
    },
    {
      title: "Bekleyen",
      value: pendingAthletes?.count ?? 0,
      icon: Clock,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
    },
    {
      title: "Onaylı",
      value: approvedAthletes?.count ?? 0,
      icon: UserCheck,
      color: "text-green-400",
      bg: "bg-green-500/10",
    },
    {
      title: "Reddedilen",
      value: rejectedAthletes?.count ?? 0,
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-500/10",
    },
  ];

  const statusBadgeVariant = (status: string) => {
    if (status === "approved") return "success";
    if (status === "rejected") return "destructive";
    return "warning";
  };

  const statusLabel = (status: string) => {
    if (status === "approved") return "Onaylı";
    if (status === "rejected") return "Reddedildi";
    return "Beklemede";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Genel Bakış</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Masa tenisi sporcu kayıt sistemine hoş geldiniz
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground mt-1">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.bg}`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base">Son Başvurular</CardTitle>
                <CardDescription>En son kaydolan sporcular</CardDescription>
              </div>
              <Link
                href="/admin/athletes"
                className="text-xs text-primary hover:underline"
              >
                Tümünü gör
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentAthletes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Henüz kayıtlı sporcu yok
              </p>
            ) : (
              <div className="space-y-3">
                {recentAthletes.map((athlete) => (
                  <Link
                    key={athlete.id}
                    href={`/admin/athletes/${athlete.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-secondary/50 transition-colors group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                        {athlete.firstName[0]}{athlete.lastName[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {athlete.firstName} {athlete.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {athlete.club || athlete.userEmail || "—"}
                        </p>
                      </div>
                    </div>
                    <Badge variant={statusBadgeVariant(athlete.status) as "success" | "destructive" | "warning"}>
                      {statusLabel(athlete.status)}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sistem Durumu</CardTitle>
            <CardDescription>Genel istatistikler</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <span className="text-sm text-muted-foreground">Toplam Kullanıcı</span>
              <span className="text-sm font-semibold text-foreground">{totalUsers?.count ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <span className="text-sm text-muted-foreground">Onay Bekleyen</span>
              <span className="text-sm font-semibold text-yellow-400">{pendingAthletes?.count ?? 0}</span>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <span className="text-sm text-muted-foreground">Onay Oranı</span>
              <span className="text-sm font-semibold text-green-400">
                {totalAthletes?.count
                  ? Math.round(((approvedAthletes?.count ?? 0) / totalAthletes.count) * 100)
                  : 0}%
              </span>
            </div>
            {(pendingAthletes?.count ?? 0) > 0 && (
              <Link
                href="/admin/athletes?status=pending"
                className="flex items-center gap-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 hover:bg-yellow-500/20 transition-colors"
              >
                <Clock className="h-4 w-4 text-yellow-400" />
                <span className="text-sm text-yellow-400 font-medium">
                  {pendingAthletes?.count} sporcu onay bekliyor
                </span>
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
