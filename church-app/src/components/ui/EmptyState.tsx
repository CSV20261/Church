import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import Button from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({ 
  icon, 
  title, 
  description, 
  action,
  className 
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 sm:py-16 px-4 text-center',
      className
    )}>
      {icon && (
        <div className="mb-4 text-neutral-400 text-5xl sm:text-6xl">
          {icon}
        </div>
      )}
      
      <h3 className="text-lg sm:text-xl font-bold text-neutral-900 mb-2">
        {title}
      </h3>
      
      {description && (
        <p className="text-sm sm:text-base text-neutral-600 max-w-md mb-6">
          {description}
        </p>
      )}
      
      {action && (
        <Button onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  );
}
