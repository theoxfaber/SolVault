import React, { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    type = 'text',
    label,
    error,
    fullWidth = false,
    leftIcon,
    rightIcon,
    id,
    ...props
  }, ref) => {
    const inputId = id || React.useId();
    
    return (
      <div className={cn('space-y-1', fullWidth ? 'w-full' : 'w-fit')}>
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium text-zinc-300',
              error && 'text-red-500'
            )}
          >
            {label}
          </label>
        )}
        <div className="relative rounded-md shadow-sm">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            type={type}
            className={cn(
              'flex h-10 w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm',
              'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
              'placeholder:text-zinc-500 focus-visible:outline-none focus-visible:ring-2',
              'focus-visible:ring-sky-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed',
              'disabled:opacity-50 transition-colors duration-200',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error ? 'border-red-500 focus-visible:ring-red-500' : 'border-zinc-700',
              className
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-500">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };

export default Input;
