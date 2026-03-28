"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#002D72] disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-[#002D72] text-white hover:bg-[#002D72]/90":
              variant === "primary",
            "bg-secondary text-secondary-foreground hover:bg-secondary/80":
              variant === "secondary",
            "border border-border bg-transparent text-foreground hover:bg-accent":
              variant === "outline",
            "text-foreground hover:bg-accent": variant === "ghost",
            "bg-[#007749] text-white hover:bg-[#007749]/90":
              variant === "danger",
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
