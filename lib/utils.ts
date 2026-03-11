import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Sanitize user-supplied URL: only allow http(s), return '#' for unsafe protocols */
export function safeHref(url: string | undefined | null): string {
  if (!url) return '#';
  return /^https?:\/\//i.test(url) ? url : '#';
}
