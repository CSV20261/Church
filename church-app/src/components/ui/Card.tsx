import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { HTMLAttributes, forwardRef } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  variant?: 'default' | 'outlined' | 'elevated';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ 
    title, 
    description, 
    icon: Icon, 
    className,
    variant = 'default',
    padding = 'md',
    hoverable = false,
    children,
    onClick,
    ...props 
  }, ref) => {
    const baseStyles = 'bg-white rounded-lg';
    
    const variants = {
      default: 'border border-neutral-200 shadow-sm',
      outlined: 'border-2 border-neutral-200',
      elevated: 'shadow-md',
    };

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4 sm:p-6',
      lg: 'p-6 sm:p-8',
    };

    const hoverStyles = (hoverable || onClick)
      ? 'cursor-pointer hover:shadow-lg hover:border-neutral-300 transition-all duration-200' 
      : 'transition-shadow duration-200';

    return (
      <div
        ref={ref}
        onClick={onClick}
        className={cn(
          baseStyles,
          variants[variant],
          !children && paddings[padding],
          hoverStyles,
          className
        )}
        {...props}
      >
        {Icon && (
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <Icon className="w-6 h-6 text-primary-700" />
          </div>
        )}
        {title && <h3 className="text-lg font-bold text-neutral-900">{title}</h3>}
        {description && <p className="text-neutral-600 text-sm mt-1.5">{description}</p>}
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';
