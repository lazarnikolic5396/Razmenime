import { HTMLAttributes, ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export default function Card({ children, className, padding = 'md', ...props }: CardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };
  
  return (
    <div
      className={clsx(
        'bg-white rounded-lg shadow-sm',
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

