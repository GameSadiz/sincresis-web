import { forwardRef } from "react";
import type { SelectHTMLAttributes } from "react";

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ invalid = false, className = "", ...props }, ref) {
    return (
      <div className="relative">
        <select
          ref={ref}
          className={`w-full appearance-none rounded-xl border bg-surface px-4 py-3 text-sm text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
            invalid
              ? "border-danger focus:border-danger"
              : "border-border focus:border-primary"
          } ${className}`}
          {...props}
        />
        <svg
          className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
          viewBox="0 0 20 20"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    );
  }
);
