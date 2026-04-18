import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
}

export function Card({ children, className = '' }: CardProps) {
  return (
    <div
      className={`
        bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-transparent dark:border-white/5 transition-colors
        ${className}
      `}
    >
      {children}
    </div>
  );
}