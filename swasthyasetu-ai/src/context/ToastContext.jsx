import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const ToastContext = createContext(null);

const styles = {
  success: { icon: CheckCircle2, className: 'border-emerald-200 bg-emerald-50 text-emerald-900' },
  error: { icon: AlertTriangle, className: 'border-red-200 bg-red-50 text-red-900' },
  info: { icon: Info, className: 'border-sky-200 bg-sky-50 text-sky-900' },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((items) => items.filter((item) => item.id !== id)), []);

  const toast = useCallback((message, type = 'success', title = '') => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((items) => [...items, { id, message, type, title }]);
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  const value = useMemo(() => ({ toast, dismiss }), [toast, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-5 right-5 z-[100] flex w-[min(92vw,380px)] flex-col gap-2" aria-live="polite">
        {toasts.map((item) => {
          const style = styles[item.type] || styles.info;
          const Icon = style.icon;
          return (
            <div key={item.id} className={`pointer-events-auto flex items-start gap-3 rounded-xl border p-3.5 shadow-card animate-fadeUp ${style.className}`}>
              <Icon size={18} className="mt-0.5 shrink-0" />
              <div className="flex-1 text-sm">
                {item.title && <p className="font-semibold">{item.title}</p>}
                <p>{item.message}</p>
              </div>
              <button type="button" onClick={() => dismiss(item.id)} className="rounded p-0.5 opacity-70 hover:opacity-100" aria-label="Dismiss notification">
                <X size={15} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used inside ToastProvider');
  return context;
}
