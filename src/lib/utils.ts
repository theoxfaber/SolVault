import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddress(address: string, start = 6, end = 4): string {
  if (!address) return '';
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

export function formatSol(lamports: number, decimals: number = 9): string {
  const sol = lamports / Math.pow(10, decimals);
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 9,
  }).format(sol);
}

export function isValidSolanaAddress(address: string): boolean {
  // Basic Solana address validation (44-88 alphanumeric characters)
  return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
}

export function copyToClipboard(text: string): void {
  navigator.clipboard.writeText(text).catch(err => {
    console.error('Failed to copy text: ', err);
  });
}

// Animation variants
const defaultEasing = [0.6, -0.05, 0.01, 0.99];

export const staggerHalf = {
  animate: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

export const staggerFull = {
  animate: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

export const fadeInUp = {
  initial: {
    y: 20,
    opacity: 0,
    transition: { duration: 0.6, ease: defaultEasing },
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: defaultEasing,
    },
  },
};

export const fadeIn = {
  initial: {
    opacity: 0,
    transition: { duration: 0.6, ease: defaultEasing },
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: defaultEasing,
    },
  },
};

export const slideUp = {
  initial: {
    y: 100,
    opacity: 0,
    transition: { duration: 0.6, ease: defaultEasing },
  },
  animate: {
    y: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: defaultEasing,
    },
  },
};
