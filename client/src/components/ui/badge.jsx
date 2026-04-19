import { cn } from "../../lib/utils";

const variants = {
  default: "bg-pink-500/20 text-pink-300 border-pink-500/40",
  success: "bg-emerald-500/20 text-emerald-300 border-emerald-500/40",
  muted: "bg-slate-700/50 text-slate-300 border-slate-600",
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
