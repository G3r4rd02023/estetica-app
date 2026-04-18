import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
}

export function Button({
  loading = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`
        px-5 py-3 rounded-xl font-medium tracking-wide transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-offset-2 dark:focus:ring-offset-slate-950
        ${
          loading || disabled
            ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-white/5 dark:text-slate-500'
            : 'bg-primary-500 hover:bg-primary-600 hover:-translate-y-[1px] hover:shadow-md hover:shadow-primary-500/30 text-white focus:ring-primary-500 dark:bg-primary-600 dark:hover:bg-primary-500'
        }
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-5 w-5"
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
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          Procesando...
        </span>
      ) : (
        children
      )}
    </button>
  );
}