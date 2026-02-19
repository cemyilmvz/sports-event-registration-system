"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/components/ui/use-toast";
import {
  Trophy,
  Users,
  User,
  CheckCircle,
  Clock,
  XCircle,
  Loader2,
  Trash2,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Registration {
  id: number;
  tournamentType: "normal" | "doubles";
  hasPartner: boolean;
  partnerName: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: number | string;
}

const statusConfig = {
  pending: { label: "Beklemede", icon: Clock, color: "warning" as const },
  approved: { label: "Onaylandı", icon: CheckCircle, color: "success" as const },
  rejected: { label: "Reddedildi", icon: XCircle, color: "destructive" as const },
};

const tournamentTypeLabels = {
  normal: "Bireysel Başvuru",
  doubles: "2'ye 2 Turnuvası",
};

export default function TournamentPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Form state
  const [selectedType, setSelectedType] = useState<"normal" | "doubles" | null>(null);
  const [hasPartner, setHasPartner] = useState(false);
  const [partnerName, setPartnerName] = useState("");

  const { toast } = useToast();

  const fetchRegistrations = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/tournament-registrations");
      const data = await res.json();
      setRegistrations(data.registrations || []);
    } catch {
      setRegistrations([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleSubmit = async () => {
    if (!selectedType) return;
    setError("");
    setSubmitting(true);

    const res = await fetch("/api/tournament-registrations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tournamentType: selectedType,
        hasPartner: selectedType === "doubles" ? hasPartner : false,
        partnerName: selectedType === "doubles" && hasPartner ? partnerName : null,
      }),
    });

    const data = await res.json();
    setSubmitting(false);

    if (!res.ok) {
      setError(data.error || "Başvuru gönderilemedi");
      return;
    }

    toast({ title: "Başvurunuz alındı!", description: "Yönetici onayına gönderildi." });
    setSelectedType(null);
    setHasPartner(false);
    setPartnerName("");
    fetchRegistrations();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/tournament-registrations/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    if (res.ok) {
      toast({ title: "Başvuru iptal edildi" });
      fetchRegistrations();
    } else {
      toast({ title: "Hata", description: "Başvuru iptal edilemedi", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Turnuva Başvurusu</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Turnuva kategorisini seçerek başvurunuzu yapın
        </p>
      </div>

      {/* New registration form */}
      <div className="space-y-4">
        <h2 className="text-base font-semibold text-foreground">Yeni Başvuru</h2>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {/* Normal */}
          <button
            type="button"
            onClick={() => {
              setSelectedType("normal");
              setHasPartner(false);
              setPartnerName("");
              setError("");
            }}
            className={`relative flex flex-col items-start gap-2 rounded-xl border p-5 text-left transition-all ${
              selectedType === "normal"
                ? "border-primary bg-primary/10 ring-1 ring-primary"
                : "border-border bg-card hover:border-primary/40 hover:bg-card/80"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20">
                <User className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold text-foreground">Bireysel Başvuru</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Bireysel turnuvaya katılmak için başvurun
            </p>
            {selectedType === "normal" && (
              <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-primary" />
            )}
          </button>

          {/* Doubles */}
          <button
            type="button"
            onClick={() => {
              setSelectedType("doubles");
              setError("");
            }}
            className={`relative flex flex-col items-start gap-2 rounded-xl border p-5 text-left transition-all ${
              selectedType === "doubles"
                ? "border-primary bg-primary/10 ring-1 ring-primary"
                : "border-border bg-card hover:border-primary/40 hover:bg-card/80"
            }`}
          >
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/20">
                <Users className="h-5 w-5 text-primary" />
              </div>
              <span className="font-semibold text-foreground">2&apos;ye 2 Turnuvası</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Çiftler turnuvasına katılmak için başvurun
            </p>
            {selectedType === "doubles" && (
              <CheckCircle className="absolute right-3 top-3 h-4 w-4 text-primary" />
            )}
          </button>
        </div>

        {/* Doubles partner option */}
        {selectedType === "doubles" && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => {
                    setHasPartner(!hasPartner);
                    if (hasPartner) setPartnerName("");
                  }}
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded border-2 transition-colors ${
                    hasPartner
                      ? "border-primary bg-primary"
                      : "border-border bg-background"
                  }`}
                >
                  {hasPartner && (
                    <svg
                      className="h-3 w-3 text-primary-foreground"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className="text-sm font-medium text-foreground">
                  Eşim var, birlikte katılmak istiyorum
                </span>
              </label>

              {hasPartner && (
                <div className="space-y-2 pt-1">
                  <Label htmlFor="partnerName">Eş İsmi</Label>
                  <Input
                    id="partnerName"
                    placeholder="Eşinizin adı ve soyadı"
                    value={partnerName}
                    onChange={(e) => setPartnerName(e.target.value)}
                    className="bg-background"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {selectedType && (
          <Button onClick={handleSubmit} disabled={submitting} className="w-full sm:w-auto">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? "Gönderiliyor..." : "Başvuruyu Gönder"}
          </Button>
        )}
      </div>

      {/* Previous registrations */}
      <div className="space-y-3">
        <h2 className="text-base font-semibold text-foreground">Başvurularım</h2>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : registrations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-10 text-center">
              <Trophy className="h-10 w-10 text-muted-foreground/40 mb-3" />
              <p className="text-sm text-muted-foreground">Henüz turnuva başvurunuz yok</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {registrations.map((reg) => {
              const s = statusConfig[reg.status];
              const StatusIcon = s.icon;
              return (
                <Card key={reg.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary">
                          {reg.tournamentType === "doubles" ? (
                            <Users className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <User className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-foreground">
                            {tournamentTypeLabels[reg.tournamentType]}
                          </p>
                          {reg.tournamentType === "doubles" && (
                            <p className="text-xs text-muted-foreground">
                              {reg.hasPartner && reg.partnerName
                                ? `Eş: ${reg.partnerName}`
                                : reg.hasPartner
                                ? "Eş: Belirtilmedi"
                                : "Eşsiz katılım"}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatDate(reg.createdAt, { year: "numeric", month: "long", day: "numeric" })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-1.5">
                          <StatusIcon className="h-3.5 w-3.5" />
                          <Badge variant={s.color}>{s.label}</Badge>
                        </div>
                        {reg.status === "pending" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(reg.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Başvuruyu İptal Et</DialogTitle>
            <DialogDescription>
              Bu başvuruyu iptal etmek istediğinizden emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              Hayır
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              İptal Et
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
