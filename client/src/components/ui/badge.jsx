import { cn } from "../../lib/utils";

const variants = {
  default: "bg-pink-100 text-pink-700 border-pink-200",
  success: "bg-green-100 text-green-700 border-green-200",
  muted: "bg-gray-100 text-gray-600 border-gray-200",
  warning: "bg-amber-100 text-amber-700 border-amber-200",
  error: "bg-red-100 text-red-700 border-red-200",
};

export default function Badge({ children, variant = "default", className = "" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
        variants[variant] || variants.default,
        className,
      )}
    >
      {children}
    </span>
  );
}