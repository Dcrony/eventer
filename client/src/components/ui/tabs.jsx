import { cn } from "../../lib/utils";

export function Tabs({ className = "", children }) {
  return (
    <div className={cn("inline-flex items-center gap-2 rounded-xl bg-gray-100 p-1", className)}>
      {children}
    </div>
  );
}

export function TabButton({ active, children, className = "", ...props }) {
  return (
    <button
      className={cn(
        "rounded-lg px-3 py-1.5 text-sm font-semibold transition-all duration-200",
        active
          ? "bg-pink-500 text-white shadow-md shadow-pink-500/25"
          : "text-gray-600 hover:bg-gray-200 hover:text-gray-900",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}