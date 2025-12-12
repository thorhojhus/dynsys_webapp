import type { ReactNode } from 'react';
import { Difficulty } from '@/types/question';

interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info';
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    error: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

interface DifficultyBadgeProps {
  difficulty: Difficulty;
  className?: string;
}

export function DifficultyBadge({ difficulty, className = '' }: DifficultyBadgeProps) {
  const variants: Record<Difficulty, 'success' | 'info' | 'warning' | 'error'> = {
    [Difficulty.CONCEPTUAL]: 'success',
    [Difficulty.LIGHT]: 'info',
    [Difficulty.MODERATE]: 'warning',
    [Difficulty.HEAVY]: 'error',
  };

  const labels: Record<Difficulty, string> = {
    [Difficulty.CONCEPTUAL]: 'Conceptual',
    [Difficulty.LIGHT]: 'Light',
    [Difficulty.MODERATE]: 'Moderate',
    [Difficulty.HEAVY]: 'Heavy',
  };

  return (
    <Badge variant={variants[difficulty]} className={className}>
      {labels[difficulty]}
    </Badge>
  );
}
