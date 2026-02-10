import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  description?: string;
  icon?: LucideIcon;
  className?: string;
  onClick?: () => void;
  children?: ReactNode;
}

export function Card({ title, description, icon: Icon, className, onClick, children }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white/80 backdrop-blur-sm rounded-xl shadow-md hover:shadow-lg transition-all border border-gray-100',
        onClick && 'cursor-pointer',
        !children && 'p-6',
        className
      )}
    >
      {Icon && (
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
          <Icon className="w-6 h-6 text-green-700" />
        </div>
      )}
      {title && <h3 className="text-lg font-semibold text-gray-800">{title}</h3>}
      {description && <p className="text-gray-600 text-sm mt-1">{description}</p>}
      {children}
    </div>
  );
}
