import { forwardRef } from "react";
import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ invalid = false, className = "", ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={`w-full resize-y rounded-xl border bg-surface px-4 py-3 text-sm leading-relaxed text-foreground placeholder:text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
          invalid
            ? "border-danger focus:border-danger"
            : "border-border focus:border-primary"
        } ${className}`}
        {...props}
      />
    );
  }
);
