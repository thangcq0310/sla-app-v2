import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function formatPercent(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "percent",
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).format(value / 100);
}

export function getGradeColor(score: number): "success" | "warning" | "destructive" {
  if (score >= 90) return "success";
  if (score >= 80) return "warning";
  return "destructive";
}

export function getStatusColor(status: string): "default" | "success" | "warning" | "destructive" | "outline" {
  const statusLower = status.toLowerCase();
  if (statusLower === "open" || statusLower === "active") return "success";
  if (statusLower === "in progress") return "warning";
  if (statusLower === "resolved" || statusLower === "closed") return "default";
  return "outline";
}