import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
}

export function formatDate(date: any) {
  if (!date) return '---';
  
  // Handle Firestore Timestamp
  if (date.seconds !== undefined) {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(date.seconds * 1000));
  }
  
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return '---';
    return new Intl.DateTimeFormat('pt-BR').format(d);
  } catch {
    return '---';
  }
}
