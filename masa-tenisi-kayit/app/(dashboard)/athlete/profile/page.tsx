"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, CheckCircle } from "lucide-react";

export default function AthleteProfilePage() {
  const { data: session } = useSession();
  const [athleteId, setAthleteId] = useState<number | null>(null);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    gender: "",
    phone: "",
    club: "",
    nationalId: "",
    level: "beginner",
    notes: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [isNew, setIsNew] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!session?.user) return;

    const userId = (session.user as { id?: string })?.id;
    if (!userId) return;

    fetch("/api/athletes?limit=1")
      .then((r) => r.json())
      .then((data) => {
        const mine = data.athletes?.find(
          (a: { userId: number }) => a.userId === parseInt(userId)
        );
        if (mine) {
          setAthleteId(mine.id);
          setForm({
            firstName: mine.firstName || "",
            lastName: mine.lastName || "",
            birthDate: mine.birthDate || "",
            gender: mine.gender || "",
            phone: mine.phone || "",
            club: mine.club || "",
            nationalId: mine.nationalId || "",
            level: mine.level || "beginner",
            notes: mine.notes || "",
          });
        } else {
          setIsNew(true);
          const name = session.user?.name || "";
          const parts = name.split(" ");
          setForm((prev) => ({
            ...prev,
            firstName: parts[0] || "",
            lastName: parts.slice(1).join(" ") || "",
          }));
        }
        setFetching(false);
      })
      .catch(() => {
        setIsNew(true);
        setFetching(false);
      });
  }, [session]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSelect = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    let res: Response;
    if (isNew) {
      res = await fetch("/api/athletes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    } else {
      res = await fetch(`/api/athletes/${athleteId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
    }

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error || "Profil kaydedilemedi");
      return;
    }

    if (isNew) {
      setAthleteId(data.athlete.id);
      setIsNew(false);
    }

    toast({
      title: isNew ? "Profil oluşturuldu!" : "Profil güncellendi",
      description: isNew
        ? "Başvurunuz yönetici onayına gönderildi"
        : "Bilgileriniz başarıyla kaydedildi",
    });
  };

  if (fetching) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {isNew ? "Profil Oluştur" : "Profilim"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          {isNew
            ? "Sporcu kaydı için bilgilerinizi doldurun"
            : "Kişisel ve spor bilgilerinizi güncelleyin"}
        </p>
      </div>

      {isNew && (
        <Alert variant="info">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Profil oluşturduktan sonra başvurunuz yönetici onayına gönderilecek.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Kişisel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">Ad *</Label>
                <Input
                  id="firstName"
                  name="firstName"
                  placeholder="Ahmet"
                  value={form.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Soyad *</Label>
                <Input
                  id="lastName"
                  name="lastName"
                  placeholder="Yılmaz"
                  value={form.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="birthDate">Doğum Tarihi</Label>
                <Input
                  id="birthDate"
                  name="birthDate"
                  type="date"
                  value={form.birthDate}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label>Cinsiyet</Label>
                <Select
                  value={form.gender}
                  onValueChange={(v) => handleSelect("gender", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Erkek</SelectItem>
                    <SelectItem value="female">Kadın</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Telefon</Label>
                <Input
                  id="phone"
                  name="phone"
                  placeholder="0532 123 45 67"
                  value={form.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nationalId">TC Kimlik No</Label>
                <Input
                  id="nationalId"
                  name="nationalId"
                  placeholder="12345678901"
                  value={form.nationalId}
                  onChange={handleChange}
                  maxLength={11}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Spor Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="club">Kulüp</Label>
              <Input
                id="club"
                name="club"
                placeholder="Kulüp adı"
                value={form.club}
                onChange={handleChange}
              />
            </div>

            <div className="space-y-2">
              <Label>Seviye</Label>
              <Select
                value={form.level}
                onValueChange={(v) => handleSelect("level", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="beginner">Başlangıç</SelectItem>
                  <SelectItem value="intermediate">Orta</SelectItem>
                  <SelectItem value="advanced">İleri</SelectItem>
                  <SelectItem value="professional">Profesyonel</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Ek Bilgiler</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Kendiniz hakkında ek bilgiler..."
                value={form.notes}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading
            ? "Kaydediliyor..."
            : isNew
            ? "Profili Oluştur"
            : "Güncelle"}
        </Button>
      </form>
    </div>
  );
}
