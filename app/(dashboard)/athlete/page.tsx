import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { athletes } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  CheckCircle,
  Clock,
  XCircle,
  User,
  Building2,
  Phone,
  ArrowRight,
  Trophy,
  ClipboardList,
} from "lucide-react";
import { getAgeCategory, AGE_CATEGORY_COLORS } from "@/lib/age-categories";

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

export default async function AthleteDashboardPage() {
  const session = await auth();
  if (!session) redirect("/login");
  const role = (session.user as { role?: string })?.role;
  if (role !== "athlete") redirect("/admin");

  const userId = parseInt((session.user as { id?: string })?.id || "0");
  const athlete = await db
    .select()
    .from(athletes)
    .where(eq(athletes.userId, userId))
    .get();

  const userName = session.user?.name || "Sporcu";

  if (!athlete) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Hoş geldin, {userName.split(" ")[0]}!
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Masa tenisi sporcu kayıt sistemine hoş geldiniz
          </p>
        </div>

        <Alert variant="warning">
          <Trophy className="h-4 w-4" />
          <AlertTitle>Profil Tamamlanmamış</AlertTitle>
          <AlertDescription>
            Sisteme kayıt olabilmek için sporcu profilinizi oluşturmanız gerekiyor.
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="p-8 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-secondary">
                <User className="h-8 w-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Sporcu Profilinizi Oluşturun</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Kayıt işlemini tamamlamak için kişisel bilgilerinizi ve spor bilgilerinizi girin
                </p>
              </div>
              <Button asChild>
                <Link href="/athlete/profile">
                  Profil Oluştur
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusInfo = {
    pending: {
      icon: Clock,
      color: "text-yellow-400",
      bg: "bg-yellow-500/10",
      border: "border-yellow-500/20",
      label: "Başvurunuz İnceleniyor",
      description: "Başvurunuz yönetici tarafından inceleniyor. Onaylandığında bilgilendirileceksiniz.",
      alertVariant: "warning" as const,
    },
    approved: {
      icon: CheckCircle,
      color: "text-green-400",
      bg: "bg-green-500/10",
      border: "border-green-500/20",
      label: "Başvurunuz Onaylandı",
      description: "Tebrikler! Sporcu kaydınız onaylandı. Sistemi aktif olarak kullanabilirsiniz.",
      alertVariant: "success" as const,
    },
    rejected: {
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      label: "Başvurunuz Reddedildi",
      description: "Başvurunuz reddedildi. Daha fazla bilgi için yönetici ile iletişime geçin.",
      alertVariant: "destructive" as const,
    },
  };

  const info = statusInfo[athlete.status as keyof typeof statusInfo];
  const StatusIcon = info.icon;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Hoş geldin, {athlete.firstName}!
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Sporcu panelinize hoş geldiniz
        </p>
      </div>

      <div
        className={`flex items-start gap-4 p-4 rounded-lg border ${info.bg} ${info.border}`}
      >
        <StatusIcon className={`h-5 w-5 ${info.color} shrink-0 mt-0.5`} />
        <div>
          <h3 className={`font-semibold ${info.color}`}>{info.label}</h3>
          <p className="text-sm text-muted-foreground mt-1">{info.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <User className="h-4 w-4" />
                Kişisel Bilgiler
              </CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/athlete/profile">
                  <span className="text-xs text-primary">Düzenle</span>
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-lg font-bold">
                {athlete.firstName[0]}{athlete.lastName[0]}
              </div>
              <div>
                <p className="font-semibold">
                  {athlete.firstName} {athlete.lastName}
                </p>
                <p className="text-sm text-muted-foreground">
                  {athlete.gender ? genderLabels[athlete.gender] : "—"}
                  {athlete.birthDate ? ` · ${athlete.birthDate}` : ""}
                </p>
              </div>
            </div>
            {athlete.phone && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-3.5 w-3.5" />
                {athlete.phone}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              Spor Bilgileri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {athlete.club && (
              <div className="flex items-center gap-2">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Kulüp</p>
                  <p className="text-sm font-medium">{athlete.club}</p>
                </div>
              </div>
            )}
            {(() => {
              const ageCategory = getAgeCategory(athlete.birthDate);
              return (
                <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                  <span className="text-sm text-muted-foreground">Yaş Kategorisi</span>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${AGE_CATEGORY_COLORS[ageCategory]}`}
                  >
                    {ageCategory}
                  </span>
                </div>
              );
            })()}
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <span className="text-sm text-muted-foreground">Seviye</span>
              <Badge variant="outline">
                {levelLabels[athlete.level || "beginner"]}
              </Badge>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
              <span className="text-sm text-muted-foreground">Durum</span>
              <Badge
                variant={
                  athlete.status === "approved"
                    ? "success"
                    : athlete.status === "rejected"
                    ? "destructive"
                    : "warning"
                }
              >
                {athlete.status === "approved"
                  ? "Onaylı"
                  : athlete.status === "rejected"
                  ? "Reddedildi"
                  : "Beklemede"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {athlete.status === "approved" && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/20">
                  <ClipboardList className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Turnuva Başvurusu</p>
                  <p className="text-sm text-muted-foreground">
                    Bireysel veya 2&apos;ye 2 turnuvasına katılmak için başvurun
                  </p>
                </div>
              </div>
              <Button asChild>
                <Link href="/athlete/tournament">
                  Başvur
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {athlete.status === "rejected" && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Profili Güncelleyin</p>
                <p className="text-sm text-muted-foreground">
                  Bilgilerinizi düzenleyip tekrar başvurabilirsiniz
                </p>
              </div>
              <Button asChild>
                <Link href="/athlete/profile">
                  Profili Düzenle
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
