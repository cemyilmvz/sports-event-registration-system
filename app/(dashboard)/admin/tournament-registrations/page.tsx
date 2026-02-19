"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import {
  Loader2,
  Filter,
  Download,
  User,
  Users,
  Eye,
} from "lucide-react";
import { getAgeCategory } from "@/lib/age-categories";
import { formatDate } from "@/lib/utils";

interface Registration {
  id: number;
  athleteId: number;
  tournamentType: "normal" | "doubles";
  hasPartner: boolean;
  partnerName: string | null;
  status: "pending" | "approved" | "rejected";
  createdAt: number | string;
  athleteFirstName: string | null;
  athleteLastName: string | null;
  athleteBirthDate: string | null;
  athleteClub: string | null;
  userEmail: string | null;
}

const statusConfig = {
  pending: { label: "Beklemede", variant: "warning" as const },
  approved: { label: "Onaylandı", variant: "success" as const },
  rejected: { label: "Reddedildi", variant: "destructive" as const },
};

const tournamentTypeLabels = {
  normal: "Bireysel",
  doubles: "2'ye 2",
};

export default function AdminTournamentRegistrationsPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const fetchRegistrations = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/tournament-registrations?${params}`);
    const data = await res.json();
    let regs = data.registrations || [];
    if (typeFilter !== "all") {
      regs = regs.filter((r: Registration) => r.tournamentType === typeFilter);
    }
    setRegistrations(regs);
    setLoading(false);
  }, [statusFilter, typeFilter]);

  useEffect(() => {
    fetchRegistrations();
  }, [fetchRegistrations]);

  const handleStatusChange = async (id: number, status: string) => {
    const res = await fetch(`/api/tournament-registrations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast({
        title: status === "approved" ? "Başvuru onaylandı" : "Başvuru reddedildi",
        variant: status === "approved" ? "default" : "destructive",
      });
      fetchRegistrations();
    }
  };

  const handleExportJSON = async () => {
    setExporting(true);
    const exportData = registrations.map((r) => ({
      id: r.id,
      sporcu: `${r.athleteFirstName} ${r.athleteLastName}`,
      email: r.userEmail,
      kulup: r.athleteClub,
      yas_kategorisi: getAgeCategory(r.athleteBirthDate),
      turnuva_turu: tournamentTypeLabels[r.tournamentType],
      es_var: r.hasPartner ? "Evet" : "Hayır",
      es_ismi: r.partnerName || "",
      durum: statusConfig[r.status]?.label || r.status,
      basvuru_tarihi: formatDate(r.createdAt),
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `turnuva_basvurulari_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "JSON olarak indirildi" });
    setExporting(false);
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const exportData = registrations.map((r) => ({
        "Sporcu": `${r.athleteFirstName} ${r.athleteLastName}`,
        "E-posta": r.userEmail || "",
        "Kulüp": r.athleteClub || "",
        "Yaş Kategorisi": getAgeCategory(r.athleteBirthDate),
        "Turnuva Türü": tournamentTypeLabels[r.tournamentType],
        "Eş Var mı": r.hasPartner ? "Evet" : "Hayır",
        "Eş İsmi": r.partnerName || "",
        "Durum": statusConfig[r.status]?.label || r.status,
        "Başvuru Tarihi": formatDate(r.createdAt),
      }));
      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Başvurular");
      XLSX.writeFile(wb, `turnuva_basvurulari_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast({ title: "Excel olarak indirildi" });
    } catch {
      toast({ title: "Hata", description: "Dışa aktarma başarısız", variant: "destructive" });
    }
    setExporting(false);
  };

  const pending = registrations.filter((r) => r.status === "pending").length;
  const approved = registrations.filter((r) => r.status === "approved").length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Turnuva Başvuruları</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tüm turnuva başvurularını yönetin
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportJSON} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            JSON
          </Button>
          <Button variant="outline" size="sm" onClick={handleExportExcel} disabled={exporting}>
            {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Excel
          </Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Toplam</p>
            <p className="text-2xl font-bold">{registrations.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Bekleyen</p>
            <p className="text-2xl font-bold text-yellow-400">{pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">Onaylanan</p>
            <p className="text-2xl font-bold text-green-400">{approved}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground">2&apos;ye 2</p>
            <p className="text-2xl font-bold text-primary">
              {registrations.filter((r) => r.tournamentType === "doubles").length}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Durum filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="pending">Beklemede</SelectItem>
                <SelectItem value="approved">Onaylandı</SelectItem>
                <SelectItem value="rejected">Reddedildi</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Tür filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Türler</SelectItem>
                <SelectItem value="normal">Bireysel</SelectItem>
                <SelectItem value="doubles">2&apos;ye 2</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : registrations.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground">Başvuru bulunamadı</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sporcu</TableHead>
                  <TableHead>Yaş Kategorisi</TableHead>
                  <TableHead>Turnuva Türü</TableHead>
                  <TableHead>Eş Bilgisi</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registrations.map((reg) => {
                  const status = statusConfig[reg.status];
                  const ageCategory = getAgeCategory(reg.athleteBirthDate);
                  return (
                    <TableRow key={reg.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                            {reg.athleteFirstName?.[0]}{reg.athleteLastName?.[0]}
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              {reg.athleteFirstName} {reg.athleteLastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {reg.userEmail}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-muted-foreground">{ageCategory}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          {reg.tournamentType === "doubles" ? (
                            <Users className="h-3.5 w-3.5 text-primary" />
                          ) : (
                            <User className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                          <span className="text-sm">
                            {tournamentTypeLabels[reg.tournamentType]}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {reg.tournamentType === "doubles"
                          ? reg.hasPartner
                            ? reg.partnerName || "Eş var (isim yok)"
                            : "Eşsiz katılım"
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge variant={status?.variant || "outline"}>
                          {status?.label || reg.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(reg.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {reg.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                onClick={() => handleStatusChange(reg.id, "approved")}
                              >
                                Onayla
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                onClick={() => handleStatusChange(reg.id, "rejected")}
                              >
                                Reddet
                              </Button>
                            </>
                          )}
                          <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                            <Link href={`/admin/athletes/${reg.athleteId}`}>
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
