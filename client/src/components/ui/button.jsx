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
  ({ className, variant = "primary", size = "md", type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      className={cn("ui-button", BUTTON_VARIANTS[variant], BUTTON_SIZES[size], className)}
      {...props}
    />
  ),
);

Button.displayName = "Button";

export default Button;
