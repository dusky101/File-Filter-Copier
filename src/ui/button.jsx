import * as React from "react";
import { cn } from "../lib/utils";

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}) {
  const variants = {
    default:
      "bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700",
    secondary:
      "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700",
    outline:
      "border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700",
  };

  const sizes = {
    default: "px-4 py-2 text-sm rounded-xl font-medium",
    sm: "px-3 py-1.5 text-sm rounded-lg",
    lg: "px-6 py-3 text-base rounded-2xl font-semibold",
  };

  return (
    <button
      className={cn(
        "transition-all duration-150 active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none shadow-sm",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    />
  );
}
