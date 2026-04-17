import { createContext, useContext, useMemo, useState } from 'react';

interface Toast {
  id: string;
  message: string;
}

interface ToastContextValue {
  pushToast: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue>({
  pushToast: () => {}
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = (message: string) => {
    const toast: Toast = { id: crypto.randomUUID(), message };
    setToasts((current) => [toast, ...current].slice(0, 3));
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toast.id));
    }, 2200);
  };

  const value = useMemo(() => ({ pushToast }), []);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport">
        {toasts.map((toast) => (
          <div key={toast.id} className="toast-card">
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
