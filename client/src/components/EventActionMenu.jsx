import { MoreVertical } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";

const PANEL_WIDTH = 220;
const PANEL_EST_HEIGHT = 320; // estimated max height for flip logic
const OFFSET = 6;

export default function EventActionMenu({ items = [], align = "right", className = "" }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const panelRef = useRef(null);

  const reposition = useCallback(() => {
    if (!triggerRef.current) return;

    // getBoundingClientRect() is already viewport-relative — no scroll offset needed
    const rect = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // Vertical: flip above if not enough room below
    const spaceBelow = vh - rect.bottom;
    const flipUp = spaceBelow < PANEL_EST_HEIGHT && rect.top > PANEL_EST_HEIGHT;
    const top = flipUp
      ? rect.top - PANEL_EST_HEIGHT - OFFSET
      : rect.bottom + OFFSET;

    // Horizontal: try to align per `align` prop, then clamp to viewport edges
    let left = align === "left"
      ? rect.left
      : rect.right - PANEL_WIDTH;

    // Clamp so panel never overflows viewport
    left = Math.max(8, Math.min(left, vw - PANEL_WIDTH - 8));

    setPos({ top, left });
  }, [align]);

  // Reposition every time menu opens and on scroll/resize of ANY ancestor
  useEffect(() => {
    if (!open) return;
    reposition();

    // Capture phase so we catch scroll on any ancestor, not just window
    window.addEventListener("scroll", reposition, true);
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    };
  }, [open, reposition]);

  // Close on outside click or Escape
  useEffect(() => {
    const onMouseDown = (e) => {
      if (
        !triggerRef.current?.contains(e.target) &&
        !panelRef.current?.contains(e.target)
      ) setOpen(false);
    };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  const visibleItems = items.filter(Boolean);
  if (!visibleItems.length) return null;

  const panel = open ? (
    <div
      ref={panelRef}
      role="menu"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: PANEL_WIDTH,
        zIndex: 9999,
      }}
      className="rounded-2xl border border-gray-200 bg-white p-1.5 shadow-[0_8px_32px_rgba(15,23,42,0.14)]"
      onClick={(e) => e.stopPropagation()}
    >
      {visibleItems.map((item) => {
        if (item.type === "divider") {
          return <div key={item.key} className="my-1 h-px bg-gray-100" />;
        }
        if (item.type === "label") {
          return (
            <p
              key={item.key}
              className="px-2.5 pb-1 pt-2 text-[0.58rem] font-black uppercase tracking-widest text-gray-400"
            >
              {item.label}
            </p>
          );
        }

        const itemCls = [
          "flex w-full items-center gap-2.5 rounded-xl px-2.5 py-2 text-left text-xs font-semibold transition-colors duration-100",
          item.danger  ? "text-red-500 hover:bg-red-50"   :
          item.active  ? "text-pink-600 hover:bg-pink-50" :
                         "text-gray-700 hover:bg-gray-50",
          item.disabled ? "cursor-not-allowed opacity-40" : "",
        ].join(" ");

        const iconWrapCls = [
          "flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg",
          item.danger  ? "bg-red-50"  :
          item.active  ? "bg-pink-50" :
                         "bg-gray-100",
        ].join(" ");

        const inner = (
          <>
            {item.icon && (
              <span className={iconWrapCls}>
                <item.icon size={13} className="flex-shrink-0" />
              </span>
            )}
            <span className="flex-1 leading-none">{item.label}</span>
            {item.trailing && (
              <span className="text-[0.6rem] font-bold uppercase tracking-wide text-gray-400">
                {item.trailing}
              </span>
            )}
          </>
        );

        if (item.to) {
          return (
            <Link
              key={item.key}
              to={item.to}
              onClick={() => setOpen(false)}
              className={itemCls}
              role="menuitem"
            >
              {inner}
            </Link>
          );
        }

        return (
          <button
            key={item.key}
            type="button"
            disabled={item.disabled}
            onClick={() => {
              if (item.disabled) return;
              item.onClick?.();
              setOpen(false);
            }}
            className={itemCls}
            role="menuitem"
          >
            {inner}
          </button>
        );
      })}
    </div>
  ) : null;

  return (
    <div className={className}>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/60 bg-white/90 text-gray-600 shadow-sm backdrop-blur-md transition-all hover:bg-white hover:text-gray-900 active:scale-95"
      >
        <MoreVertical size={16} />
      </button>

      {createPortal(panel, document.body)}
    </div>
  );
}