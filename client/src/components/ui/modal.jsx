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
    <div className={cn("ui-modal-overlay", className)} onClick={onClose} role="presentation">
      <div
        className={cn("ui-modal-shell", contentClassName)}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="ui-modal-header">
          <div>
            {title ? <h3 className="ui-modal-title">{title}</h3> : null}
            {description ? <p className="ui-modal-description">{description}</p> : null}
          </div>
          <button className="ui-modal-close" onClick={onClose} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        <div className="ui-modal-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
