import { forwardRef } from "react";
import type { InputHTMLAttributes } from "react";

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  function TextInput({ invalid = false, className = "", ...props }, ref) {
    return (
      <input
        ref={ref}
        className={`w-full rounded-xl border bg-surface px-4 py-3 text-sm text-foreground placeholder:text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
          invalid
            ? "border-warning focus:border-warning"
            : "border-border focus:border-primary"
        } ${className}`}
        {...props}
      />
    );
  }
);
