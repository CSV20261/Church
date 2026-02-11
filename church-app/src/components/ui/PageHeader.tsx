import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({ 
  title, 
  subtitle, 
  actions, 
  className 
}: PageHeaderProps) {
  return (
    <div className={cn(
      'flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 mb-6',
      className
    )}>
      <div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900">
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-sm sm:text-base text-neutral-600">
            {subtitle}
          </p>
        )}
      </div>
      
      {actions && (
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {actions}
        </div>
      )}
    </div>
  );
}
