import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, decimals: number = 1): string {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatIDR(value: number): string {
  if (value >= 1e12) {
    return `Rp ${(value / 1e12).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} T`;
  }
  if (value >= 1e9) {
    return `Rp ${(value / 1e9).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} M`;
  }
  if (value >= 1e6) {
    return `Rp ${(value / 1e6).toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} jt`;
  }
  return `Rp ${value.toLocaleString('id-ID')}`;
}
