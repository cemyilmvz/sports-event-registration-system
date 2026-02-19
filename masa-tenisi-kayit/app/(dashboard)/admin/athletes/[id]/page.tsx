import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { athletes, users } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Pencil, Calendar, Building2, User } from "lucide-react";
import { ApprovalActions } from "./approval-actions";
import { getAgeCategory, getAge, AGE_CATEGORY_COLORS } from "@/lib/age-categories";
import { formatDate } from "@/lib/utils";

const levelLabels: Record<string, string> = {
  beginner: "Başlangıç",
  intermediate: "Orta",
  advanced: "İleri",
  professional: "Profesyonel",
};

const genderLabels: Record<string, string> = {
  male: "Erkek",
  female: "Kadın",
};

const statusConfig = {
  pending: { label: "Beklemede", variant: "warning" as const },
  approved: { label: "Onaylı", variant: "success" as const },
  rejected: { label: "Reddedildi", variant: "destructive" as const },
};

export default async function AthleteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/login");
  const role = (session.user as { role?: string })?.role;
  if (role !== "admin") redirect("/athlete");

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

  if (!athlete) notFound();

  const status = statusConfig[athlete.status as keyof typeof statusConfig];
  const ageCategory = getAgeCategory(athlete.birthDate);
  const age = athlete.birthDate ? getAge(athlete.birthDate) : null;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link href="/admin/athletes">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {athlete.firstName} {athlete.lastName}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Sporcu detay bilgileri
            </p>
          </div>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/admin/athletes/${id}/edit`}>
            <Pencil className="h-4 w-4" />
            Düzenle
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-lg font-bold">
                {athlete.firstName[0]}{athlete.lastName[0]}
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  {athlete.firstName} {athlete.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {athlete.userEmail}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={status?.variant || "outline"}>
                {status?.label || athlete.status}
              </Badge>
            </div>
          </div>

          {athlete.status === "pending" && (
            <div className="mt-4 pt-4 border-t border-border">
              <ApprovalActions athleteId={athlete.id} />
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <User className="h-4 w-4" /> Kişisel Bilgiler
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Ad</p>
              <p className="text-sm font-medium">{athlete.firstName}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Soyad</p>
              <p className="text-sm font-medium">{athlete.lastName}</p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Doğum Tarihi</p>
              <p className="text-sm font-medium">
                {athlete.birthDate
                  ? `${athlete.birthDate}${age !== null ? ` (${age} yaş)` : ""}`
                  : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Cinsiyet</p>
              <p className="text-sm font-medium">
                {athlete.gender ? genderLabels[athlete.gender] || athlete.gender : "—"}
              </p>
            </div>
          </div>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground mb-1">Yaş Kategorisi</p>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${AGE_CATEGORY_COLORS[ageCategory]}`}
            >
              {ageCategory}
            </span>
          </div>
          <Separator />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Telefon</p>
              <p className="text-sm font-medium">{athlete.phone || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">TC Kimlik No</p>
              <p className="text-sm font-medium">{athlete.nationalId || "—"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Spor Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <p className="text-xs text-muted-foreground">Kulüp</p>
            <p className="text-sm font-medium">{athlete.club || "—"}</p>
          </div>
          <Separator />
          <div>
            <p className="text-xs text-muted-foreground">Seviye</p>
            <p className="text-sm font-medium">
              {levelLabels[athlete.level || "beginner"] || athlete.level}
            </p>
          </div>
          {athlete.notes && (
            <>
              <Separator />
              <div>
                <p className="text-xs text-muted-foreground">Notlar</p>
                <p className="text-sm">{athlete.notes}</p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="text-sm">
              Kayıt tarihi:{" "}
              {formatDate(athlete.createdAt as unknown as Date, {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
