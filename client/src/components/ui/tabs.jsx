import { cn } from "../../lib/utils";

export function Tabs({ className = "", children }) {
  return <div className={cn("inline-flex items-center gap-2 rounded-2xl border border-gray-800 bg-[#0f172a] p-1", className)}>{children}</div>;
}

export function TabButton({ active, children, className = "", ...props }) {
  return (
    <button
      className={cn(
        "rounded-xl px-3 py-2 text-sm font-medium transition-all duration-200",
        active ? "bg-pink-500 text-white shadow-lg shadow-pink-500/20" : "text-gray-300 hover:bg-slate-800",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
