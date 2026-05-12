import { useEffect } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

export default function Modal({
  open,
  title,
  description,
  onClose,
  children,
  className,
  contentClassName,
}) {
  useEffect(() => {
    if (!open) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={cn("fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in", className)}
      onClick={onClose}
      role="presentation"
    >
      <div
        className={cn(
          "relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-scale-in",
          contentClassName,
        )}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-start justify-between gap-4 p-5 pb-3 border-b border-gray-100">
          <div>
            {title && <h3 className="text-lg font-extrabold text-gray-900">{title}</h3>}
            {description && <p className="text-sm text-gray-500 mt-1">{description}</p>}
          </div>
          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-all duration-200 hover:bg-pink-50 hover:text-pink-500"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}