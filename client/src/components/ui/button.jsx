import { forwardRef } from "react";
import { cn } from "../../lib/utils";

const BUTTON_VARIANTS = {
  primary: "ui-button-primary",
  secondary: "ui-button-secondary",
  ghost: "ui-button-ghost",
  danger: "ui-button-danger",
};

const BUTTON_SIZES = {
  sm: "ui-button-sm",
  md: "ui-button-md",
  lg: "ui-button-lg",
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
      className={cn("ui-button", BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)}
      disabled={loading || disabled}
      {...props}
    >
      {loading ? <span className="ui-button-spinner" aria-hidden="true" /> : null}
      {children}
    </button>
  ),
);

Button.displayName = "Button";

export default Button;
