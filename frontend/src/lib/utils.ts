/**
 * lib/utils.ts
 * Utility helpers.
 */
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortId(id: string): string {
  return id.slice(0, 8) + '…';
}

export function formatNode(node: string | null | undefined): string {
  if (!node) return '—';
  return node.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}
