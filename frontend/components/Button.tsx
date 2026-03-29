"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "success";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C2410C] disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-[#C2410C] text-white hover:bg-[#9A3412]":
              variant === "primary",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80":
              variant === "secondary",
            "border border-border bg-transparent text-foreground hover:bg-accent":
              variant === "outline",
            "text-foreground hover:bg-accent": variant === "ghost",
            "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600":
              variant === "danger",
            "bg-[#007749] text-white hover:bg-[#006040] focus-visible:ring-[#007749]":
              variant === "success",
          },
          {
            "h-8 px-3 text-xs": size === "sm",
            "h-10 px-4 py-2 text-sm": size === "md",
            "h-12 px-6 py-3 text-base": size === "lg",
          },
          className,
        )}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";
