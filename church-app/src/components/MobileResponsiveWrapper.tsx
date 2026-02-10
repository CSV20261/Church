'use client';

import { ReactNode } from 'react';

interface MobileResponsiveWrapperProps {
  children: ReactNode;
  className?: string;
}

/**
 * Mobile-First Responsive Wrapper
 * Provides consistent padding and max-width across all pages
 */
export default function MobileResponsiveWrapper({ children, className = '' }: MobileResponsiveWrapperProps) {
  return (
    <div className={`p-3 sm:p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full ${className}`}>
      {children}
    </div>
  );
}
