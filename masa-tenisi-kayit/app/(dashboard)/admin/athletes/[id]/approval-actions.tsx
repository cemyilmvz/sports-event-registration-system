"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export function ApprovalActions({ athleteId }: { athleteId: number }) {
  const [loading, setLoading] = useState<"approved" | "rejected" | null>(null);
  const router = useRouter();
  const { toast } = useToast();

  const handleAction = async (status: "approved" | "rejected") => {
    setLoading(status);
    const res = await fetch(`/api/athletes/${athleteId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(null);

    if (res.ok) {
      toast({
        title: status === "approved" ? "Sporcu onaylandı" : "Sporcu reddedildi",
        variant: "default",
      });
      router.refresh();
    } else {
      toast({ title: "Hata oluştu", variant: "destructive" });
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        className="bg-green-500/20 text-green-400 hover:bg-green-500/30 border border-green-500/30"
        variant="ghost"
        onClick={() => handleAction("approved")}
        disabled={loading !== null}
      >
        {loading === "approved" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle className="h-4 w-4" />
        )}
        Onayla
      </Button>
      <Button
        size="sm"
        className="bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/30"
        variant="ghost"
        onClick={() => handleAction("rejected")}
        disabled={loading !== null}
      >
        {loading === "rejected" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <XCircle className="h-4 w-4" />
        )}
        Reddet
      </Button>
    </div>
  );
}
