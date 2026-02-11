import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageLayoutProps {
  children: ReactNode;
  className?: string;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  noPadding?: boolean;
}

export default function PageLayout({ 
  children, 
  className,
  maxWidth = 'full',
  noPadding = false,
}: PageLayoutProps) {
  const maxWidths = {
    sm: 'max-w-2xl',
    md: 'max-w-4xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    '2xl': 'max-w-screen-2xl',
    full: 'max-w-full',
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className={cn(
        'mx-auto w-full',
        maxWidths[maxWidth],
        !noPadding && 'px-4 sm:px-6 lg:px-8 py-6 sm:py-8',
        className
      )}>
        {children}
      </div>
    </div>
  );
}

