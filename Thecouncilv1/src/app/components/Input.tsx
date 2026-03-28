import * as React from "react";
import { cn } from "../utils/styles";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-[#d9d9d9] bg-white px-3 py-2 text-sm text-[#1e1e1e] placeholder:text-[#b3b3b3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002D72] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        className={cn(
          "flex min-h-[80px] w-full rounded-md border border-[#d9d9d9] bg-white px-3 py-2 text-sm text-[#1e1e1e] placeholder:text-[#b3b3b3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002D72] disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Textarea.displayName = "Textarea";
