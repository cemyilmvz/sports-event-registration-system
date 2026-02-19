export type AgeCategory =
  | "Mini (U10)"
  | "Minik (U12)"
  | "Yıldız (U14)"
  | "Genç (U16)"
  | "Gençler (U18)"
  | "Büyükler"
  | "Veteran (40+)"
  | "Bilinmiyor";

export function getAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const birth = new Date(birthDate);
  if (isNaN(birth.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function getAgeCategory(birthDate: string | null | undefined): AgeCategory {
  if (!birthDate) return "Bilinmiyor";
  const age = getAge(birthDate);
  if (age === null) return "Bilinmiyor";
  if (age <= 9) return "Mini (U10)";
  if (age <= 11) return "Minik (U12)";
  if (age <= 13) return "Yıldız (U14)";
  if (age <= 15) return "Genç (U16)";
  if (age <= 17) return "Gençler (U18)";
  if (age <= 39) return "Büyükler";
  return "Veteran (40+)";
}

export const AGE_CATEGORY_COLORS: Record<AgeCategory, string> = {
  "Mini (U10)": "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "Minik (U12)": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Yıldız (U14)": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Genç (U16)": "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Gençler (U18)": "bg-teal-500/20 text-teal-400 border-teal-500/30",
  "Büyükler": "bg-green-500/20 text-green-400 border-green-500/30",
  "Veteran (40+)": "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Bilinmiyor": "bg-secondary text-muted-foreground border-border",
};
