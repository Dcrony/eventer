import { createContext, useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const TOAST_ICONS = {
  success: CheckCircle2,
  error: CircleAlert,
  info: Info,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const api = useMemo(
    () => ({
      show(message, type = "info") {
        const id = `${Date.now()}-${Math.random()}`;
        setToasts((current) => [...current, { id, message, type }]);
        window.setTimeout(() => {
          setToasts((current) => current.filter((toast) => toast.id !== id));
        }, 3200);
      },
      success(message) {
        this.show(message, "success");
      },
      error(message) {
        this.show(message, "error");
      },
      info(message) {
        this.show(message, "info");
      },
    }),
    [],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {createPortal(
        <div className="ui-toast-stack" aria-live="polite" aria-atomic="true">
          {toasts.map((toast) => {
            const Icon = TOAST_ICONS[toast.type] || Info;

            return (
              <div key={toast.id} className={`ui-toast ui-toast-${toast.type}`}>
                <Icon size={18} />
                <span>{toast.message}</span>
                <button
                  className="ui-toast-dismiss"
                  onClick={() =>
                    setToasts((current) => current.filter((item) => item.id !== toast.id))
                  }
                  aria-label="Dismiss notification"
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }

  return context;
}
