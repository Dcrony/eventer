import { createContext, useContext, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const TOAST_ICONS = {
  success: CheckCircle2,
  error: CircleAlert,
  info: Info,
};

const TOAST_STYLES = {
  success: "bg-green-50 text-green-700 border-green-200",
  error: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
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
        <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2" aria-live="polite" aria-atomic="true">
          {toasts.map((toast) => {
            const Icon = TOAST_ICONS[toast.type] || Info;
            return (
              <div
                key={toast.id}
                className={`flex items-center gap-2 rounded-xl border p-3 text-sm font-medium shadow-lg animate-slide-in-right ${TOAST_STYLES[toast.type] || TOAST_STYLES.info}`}
              >
                <Icon size={16} />
                <span>{toast.message}</span>
                <button
                  className="ml-2 opacity-60 hover:opacity-100 transition-opacity"
                  onClick={() =>
                    setToasts((current) => current.filter((item) => item.id !== toast.id))
                  }
                  aria-label="Dismiss notification"
                >
                  <X size={12} />
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