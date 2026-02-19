import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function safeDate(value: number | string | Date | null | undefined): Date | null {
  if (value == null) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    const d = new Date(value < 1e10 ? value * 1000 : value);
    return isNaN(d.getTime()) ? null : d;
  }
  const d = new Date(value);
  return isNaN(d.getTime()) ? null : d;
}

export function formatDate(
  value: number | string | Date | null | undefined,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = safeDate(value);
  if (!d) return "—";
  return d.toLocaleDateString("tr-TR", options);
}
