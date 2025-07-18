import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'default' | 'lg';
  isLoading?: boolean;
  fullWidth?: boolean;
  magnetic?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({
    children,
    className,
    variant = 'default',
    size = 'default',
    isLoading = false,
    fullWidth = false,
    magnetic = false,
    disabled,
    ...props
  }, ref) => {
    const buttonVariants = {
      default: 'bg-sky-600 text-white hover:bg-sky-700 focus-visible:ring-sky-500',
      outline: 'border border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 focus-visible:ring-sky-500',
      ghost: 'bg-transparent text-zinc-300 hover:bg-zinc-800 focus-visible:ring-sky-500',
      link: 'bg-transparent text-sky-500 hover:underline underline-offset-4 p-0 h-auto',
    };

    const sizeVariants = {
      sm: 'h-8 px-3 text-xs rounded-md',
      default: 'h-10 px-4 py-2 rounded-lg',
      lg: 'h-12 px-6 text-lg rounded-xl',
    };

    const buttonClass = cn(
      'inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
      'disabled:pointer-events-none disabled:opacity-50',
      buttonVariants[variant],
      sizeVariants[size],
      fullWidth && 'w-full',
      className
    );

    if (magnetic) {
      return (
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={fullWidth ? 'w-full' : 'inline-block'}
        >
          <button
            ref={ref}
            className={buttonClass}
            disabled={disabled || isLoading}
            {...props}
          >
            {isLoading ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Loading...
              </>
            ) : (
              children
            )}
          </button>
        </motion.div>
      );
    }

    return (
      <button
        ref={ref}
        className={buttonClass}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-current"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Loading...
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };

export default Button;
