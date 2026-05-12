import { MoreVertical } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

export default function EventActionMenu({ items = [], align = "right", className = "" }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  const visibleItems = items.filter(Boolean);
  if (!visibleItems.length) return null;

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          setOpen((current) => !current);
        }}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/60 bg-white/90 text-gray-600 shadow-sm backdrop-blur-md transition-all duration-200 hover:scale-[1.03] hover:bg-white hover:text-gray-900"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MoreVertical size={18} />
      </button>

      {open ? (
        <div
          className={`absolute top-12 z-30 min-w-[13rem] overflow-hidden rounded-2xl border border-gray-200 bg-white/98 p-1.5 shadow-[0_20px_45px_rgba(15,23,42,0.14)] backdrop-blur-xl ${
            align === "left" ? "left-0" : "right-0"
          }`}
          role="menu"
          onClick={(event) => event.stopPropagation()}
        >
          {visibleItems.map((item) => {
            if (item.type === "divider") {
              return <div key={item.key} className="my-1 h-px bg-gray-100" />;
            }

            const baseClassName = `flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition-colors duration-150 ${
              item.danger
                ? "text-red-500 hover:bg-red-50"
                : item.active
                ? "text-pink-600 hover:bg-pink-50"
                : "text-gray-700 hover:bg-gray-50"
            } ${item.disabled ? "cursor-not-allowed opacity-50" : ""}`;

            const content = (
              <>
                {item.icon ? <item.icon size={15} className="flex-shrink-0" /> : null}
                <span className="flex-1">{item.label}</span>
                {item.trailing ? (
                  <span className="text-[0.65rem] font-bold uppercase tracking-wide text-gray-400">
                    {item.trailing}
                  </span>
                ) : null}
              </>
            );

            if (item.to) {
              return (
                <Link
                  key={item.key}
                  to={item.to}
                  onClick={() => setOpen(false)}
                  className={baseClassName}
                  role="menuitem"
                >
                  {content}
                </Link>
              );
            }

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => {
                  if (item.disabled) return;
                  item.onClick?.();
                  setOpen(false);
                }}
                disabled={item.disabled}
                className={baseClassName}
                role="menuitem"
              >
                {content}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
