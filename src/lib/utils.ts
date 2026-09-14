import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Safely round financial values to 2 decimal places to avoid floating point issues.
 */
export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Format currency with gym symbol or code
 */
export function formatCurrency(amount: number, currency: string = "USD"): string {
  const rounded = roundCurrency(amount);
  const symbols: Record<string, string> = {
    USD: "$",
    BDT: "৳",
    EUR: "€",
    GBP: "£",
    INR: "₹",
  };
  const symbol = symbols[currency.toUpperCase()] || currency + " ";
  return `${symbol}${rounded.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

