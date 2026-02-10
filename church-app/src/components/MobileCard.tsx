'use client';

import { ReactNode } from 'react';

interface MobileCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

/**
 * Mobile-Optimized Card Component
 * Replaces table rows on mobile with card-style layout
 */
export default function MobileCard({ children, className = '', onClick }: MobileCardProps) {
  return (
    <div 
      onClick={onClick}
      className={`bg-white rounded-lg border-2 border-slate-200 p-3 sm:p-4 shadow-sm hover:shadow-md transition-shadow ${
        onClick ? 'cursor-pointer hover:border-blue-400' : ''
      } ${className}`}
    >
      {children}
    </div>
  );
}
