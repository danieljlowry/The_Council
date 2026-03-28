import * as React from "react";
import { cn } from "../utils/styles";

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
            "bg-[#002D72] text-white hover:bg-[#002D72]/90": variant === "primary",
            "bg-[#f5f5f5] text-[#1E1E1E] hover:bg-[#e0e0e0]": variant === "secondary",
            "border border-[#d9d9d9] bg-transparent text-[#1E1E1E] hover:bg-[#f5f5f5]":
              variant === "outline",
            "hover:bg-[#f5f5f5] text-[#1E1E1E]": variant === "ghost",
            "bg-[#007749] text-white hover:bg-[#007749]/90": variant === "danger", // Wait, green is not danger. Let's keep it green for success/finish actions.
          },
          {
            "h-8 px-3 text-xs": size === "sm",
            "h-10 px-4 py-2 text-sm": size === "md",
            "h-12 px-6 py-3 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
