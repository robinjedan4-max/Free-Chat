import React, { createContext, useContext, useState, useCallback } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'gift';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);

    // Auto-remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      {/* Absolute Stacking Portal for Toasts */}
      <div className="fixed top-6 right-6 left-6 md:left-auto md:w-96 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            onClick={() => removeToast(toast.id)}
            className={`pointer-events-auto p-4 rounded-2xl backdrop-blur-xl border transition-all duration-300 transform translate-y-0 cursor-pointer shadow-lg flex items-center gap-3 animate-float-slow
              ${
                toast.type === 'success'
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-300 shadow-emerald-950/20'
                  : toast.type === 'error'
                  ? 'bg-rose-950/40 border-rose-500/30 text-rose-300 shadow-rose-950/20'
                  : toast.type === 'gift'
                  ? 'bg-purple-950/50 border-fuchsia-500/50 text-fuchsia-200 shadow-[0_0_15px_rgba(188,78,255,0.25)]'
                  : 'bg-obsidian-700/50 border-cyber-cyan/30 text-cyan-200 shadow-[0_0_15px_rgba(0,242,254,0.15)]'
              }
            `}
          >
            <div className="flex-1 text-sm font-medium">{toast.message}</div>
            <button className="text-xs opacity-50 hover:opacity-100">✕</button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
