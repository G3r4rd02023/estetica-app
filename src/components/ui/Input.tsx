import type { InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({
  label,
  error,
  className = '',
  id,
  ...props
}: InputProps) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '');

  return (
    <div className="w-full">
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`
          w-full px-4 py-3 rounded-xl border-2 transition-all duration-300 bg-white dark:bg-slate-900/50 dark:text-white
          focus:outline-none focus:ring-4 focus:ring-offset-0
          ${error
            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/20 dark:border-red-500/50 dark:focus:ring-red-500/10'
            : 'border-slate-200 dark:border-white/5 focus:border-primary-500 focus:ring-primary-500/20 dark:focus:border-primary-500/50'
          }
          placeholder:text-slate-400 dark:placeholder:text-slate-600
          ${className}
        `}
        {...props}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}