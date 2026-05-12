import { cn } from "../../lib/utils";

export default function Tooltip({ content, children, className }) {
  return (
    <span className={cn("group relative inline-flex", className)}>
      {children}
      <span className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-gray-900 px-2 py-1 text-xs text-white opacity-0 transition-opacity duration-200 group-hover:opacity-100 pointer-events-none z-50">
        {content}
      </span>
    </span>
  );
}