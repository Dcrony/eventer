import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const BUTTON_VARIANTS = {
  primary: "bg-pink-500 text-white shadow-sm shadow-pink-500/20 hover:bg-pink-600",
  secondary: "bg-white text-gray-700 border border-gray-200 hover:border-pink-300 hover:text-pink-600",
  outline: "bg-transparent text-gray-700 border border-gray-200 hover:border-pink-300 hover:bg-pink-50 hover:text-pink-600",
  ghost: "bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900",
  danger: "bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-500/20",
};

const BUTTON_SIZES = {
  xs: "px-2 py-1 text-xs rounded-lg",
  sm: "px-3 py-1.5 text-sm rounded-lg",
  md: "px-4 py-2 text-sm rounded-lg",
  lg: "px-5 py-2.5 text-base rounded-lg",
};

const Button = forwardRef(
  (
    {
      className,
      variant = "primary",
      size = "md",
      type = "button",
      loading = false,
      disabled = false,
      children,
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50",
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
      disabled={loading || disabled}
      {...props}
    >
      {loading && (
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" aria-hidden="true" />
      )}
      {children}
    </button>
  ),
);

Button.displayName = "Button";

export default Button;
