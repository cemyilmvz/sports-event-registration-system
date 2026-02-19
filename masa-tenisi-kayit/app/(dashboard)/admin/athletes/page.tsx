"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { Plus, Search, Eye, Pencil, Trash2, Loader2, Filter, Download } from "lucide-react";
import { getAgeCategory, AGE_CATEGORY_COLORS } from "@/lib/age-categories";
import { formatDate, safeDate } from "@/lib/utils";

interface Athlete {
  id: number;
  firstName: string;
  lastName: string;
  club: string | null;
  level: string | null;
  status: string;
  createdAt: number | string | null;
  userEmail: string | null;
  phone: string | null;
  birthDate: string | null;
  gender: string | null;
  nationalId: string | null;
  notes: string | null;
}

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

export default function AdminAthletesPage() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const searchParams = useSearchParams();
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get("status") || "all");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const fetchAthletes = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    const res = await fetch(`/api/athletes?${params}`);
    const data = await res.json();
    setAthletes(data.athletes || []);
    setLoading(false);
  }, [search, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(fetchAthletes, 300);
    return () => clearTimeout(timer);
  }, [fetchAthletes]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const res = await fetch(`/api/athletes/${deleteId}`, { method: "DELETE" });
    setDeleting(false);
    setDeleteId(null);
    if (res.ok) {
      toast({ title: "Sporcu silindi", variant: "default" });
      fetchAthletes();
    } else {
      toast({ title: "Hata", description: "Sporcu silinemedi", variant: "destructive" });
    }
  };

  const handleStatusChange = async (id: number, status: string) => {
    const res = await fetch(`/api/athletes/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      toast({
        title: status === "approved" ? "Sporcu onaylandı" : "Sporcu reddedildi",
        variant: status === "approved" ? "default" : "destructive",
      });
      fetchAthletes();
    }
  };

  const handleExportJSON = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      params.set("limit", "9999");
      const res = await fetch(`/api/athletes?${params}`);
      const data = await res.json();
      const exportData = (data.athletes || []).map((a: Athlete) => ({
        id: a.id,
        ad: a.firstName,
        soyad: a.lastName,
        email: a.userEmail,
        kulüp: a.club,
        telefon: a.phone,
        "doğum_tarihi": a.birthDate,
        cinsiyet: a.gender ? genderLabels[a.gender] : "",
        "yaş_kategorisi": getAgeCategory(a.birthDate),
        "tc_kimlik": a.nationalId,
        seviye: levelLabels[a.level || "beginner"],
        durum: statusConfig[a.status as keyof typeof statusConfig]?.label || a.status,
        "kayıt_tarihi": formatDate(a.createdAt),
        notlar: a.notes,
      }));
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `sporcular_${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "JSON olarak indirildi" });
    } catch {
      toast({ title: "Hata", description: "Dışa aktarma başarısız", variant: "destructive" });
    }
    setExporting(false);
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
      params.set("limit", "9999");
      const res = await fetch(`/api/athletes?${params}`);
      const data = await res.json();
      const exportData = (data.athletes || []).map((a: Athlete) => ({
        "Ad": a.firstName,
        "Soyad": a.lastName,
        "E-posta": a.userEmail,
        "Kulüp": a.club || "",
        "Telefon": a.phone || "",
        "Doğum Tarihi": a.birthDate || "",
        "Cinsiyet": a.gender ? genderLabels[a.gender] : "",
        "Yaş Kategorisi": getAgeCategory(a.birthDate),
        "TC Kimlik No": a.nationalId || "",
        "Seviye": levelLabels[a.level || "beginner"],
        "Durum": statusConfig[a.status as keyof typeof statusConfig]?.label || a.status,
        "Kayıt Tarihi": formatDate(a.createdAt),
        "Notlar": a.notes || "",
      }));

      const XLSX = await import("xlsx");
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Sporcular");
      XLSX.writeFile(wb, `sporcular_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast({ title: "Excel olarak indirildi" });
    } catch {
      toast({ title: "Hata", description: "Dışa aktarma başarısız", variant: "destructive" });
    }
    setExporting(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sporcular</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tüm sporcu kayıtlarını yönetin
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
          <Button asChild>
            <Link href="/admin/athletes/new">
              <Plus className="h-4 w-4" />
              Yeni Sporcu
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ad, soyad, kulüp veya e-posta ile ara..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44">
                <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
                <SelectValue placeholder="Durum filtrele" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Durumlar</SelectItem>
                <SelectItem value="pending">Beklemede</SelectItem>
                <SelectItem value="approved">Onaylı</SelectItem>
                <SelectItem value="rejected">Reddedildi</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : athletes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-muted-foreground">Sporcu bulunamadı</p>
              <p className="text-sm text-muted-foreground mt-1">
                Arama kriterlerinizi değiştirin veya yeni sporcu ekleyin
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ad Soyad</TableHead>
                  <TableHead>E-posta</TableHead>
                  <TableHead>Kulüp</TableHead>
                  <TableHead>Yaş Kategorisi</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead>Kayıt Tarihi</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {athletes.map((athlete) => {
                  const status = statusConfig[athlete.status as keyof typeof statusConfig];
                  const ageCategory = getAgeCategory(athlete.birthDate);
                  return (
                    <TableRow key={athlete.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-medium">
                            {athlete.firstName[0]}{athlete.lastName[0]}
                          </div>
                          {athlete.firstName} {athlete.lastName}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {athlete.userEmail || "—"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {athlete.club || "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${AGE_CATEGORY_COLORS[ageCategory]}`}
                        >
                          {ageCategory}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={status?.variant || "outline"}>
                          {status?.label || athlete.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDate(athlete.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          {athlete.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-green-400 hover:text-green-300 hover:bg-green-500/10"
                                onClick={() => handleStatusChange(athlete.id, "approved")}
                              >
                                Onayla
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                onClick={() => handleStatusChange(athlete.id, "rejected")}
                              >
                                Reddet
                              </Button>
                            </>
                          )}
                          <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                            <Link href={`/admin/athletes/${athlete.id}`}>
                              <Eye className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7" asChild>
                            <Link href={`/admin/athletes/${athlete.id}/edit`}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => setDeleteId(athlete.id)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
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

      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sporcu Sil</DialogTitle>
            <DialogDescription>
              Bu sporcuyu silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>
              İptal
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
