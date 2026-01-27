import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getStateName(code: string): string {
  const states: Record<string, string> = {
    'CA': 'California',
    'TX': 'Texas',
    'FL': 'Florida'
  };
  return states[code.toUpperCase()] || 'California';
}
