import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const BrandColors = {
  blue: "#002D72",
  green: "#007749",
  amber: "#F59E0B",
};
