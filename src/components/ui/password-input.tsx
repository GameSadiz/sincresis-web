"use client";

import { forwardRef, useState } from "react";
import type { InputHTMLAttributes } from "react";

interface PasswordInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  invalid?: boolean;
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput({ invalid = false, className = "", ...props }, ref) {
    const [visible, setVisible] = useState(false);

    return (
      <div className="relative">
        <input
          ref={ref}
          type={visible ? "text" : "password"}
          className={`w-full rounded-xl border bg-surface py-3 pl-4 pr-12 text-sm text-foreground placeholder:text-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary/30 ${
            invalid
              ? "border-danger focus:border-danger"
              : "border-border focus:border-primary"
          } ${className}`}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          aria-pressed={visible}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
        >
          <svg
            className="h-4 w-4"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            {visible ? (
              <>
                <path d="M8.1 4.7A7.2 7.2 0 0 1 10 4.5c4.5 0 7.5 5.5 7.5 5.5a14 14 0 0 1-2.4 3.1M11.9 15.3a7.2 7.2 0 0 1-1.9.2c-4.5 0-7.5-5.5-7.5-5.5a14 14 0 0 1 3.4-4" />
                <path d="M8.2 8.2a2.5 2.5 0 0 0 3.6 3.6" />
                <path d="M3 3l14 14" />
              </>
            ) : (
              <>
                <path d="M2.5 10S5.5 4.5 10 4.5s7.5 5.5 7.5 5.5-3 5.5-7.5 5.5S2.5 10 2.5 10Z" />
                <circle cx="10" cy="10" r="2.4" />
              </>
            )}
          </svg>
        </button>
      </div>
    );
  }
);
