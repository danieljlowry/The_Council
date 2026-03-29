import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const BrandColors = {
  /** Mars accent (was blue). */
  accent: "#C2410C",
  /** Success / resolved (green). */
  success: "#007749",
  amber: "#F59E0B",
};
