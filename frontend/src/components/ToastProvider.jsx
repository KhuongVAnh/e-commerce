import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Info, X, XCircle } from 'lucide-react';

const ToastContext = createContext(null);

const toastStyles = {
  success: {
    icon: CheckCircle2,
    bar: 'bg-emerald-500',
    iconBox: 'bg-emerald-50 text-emerald-600',
    title: 'Thành công',
  },
  error: {
    icon: XCircle,
    bar: 'bg-rose-500',
    iconBox: 'bg-rose-50 text-rose-600',
    title: 'Có lỗi xảy ra',
  },
  warning: {
    icon: AlertCircle,
    bar: 'bg-amber-500',
    iconBox: 'bg-amber-50 text-amber-600',
    title: 'Cần chú ý',
  },
  info: {
    icon: Info,
    bar: 'bg-[#2b3896]',
    iconBox: 'bg-indigo-50 text-[#2b3896]',
    title: 'Thông báo',
  },
};

function detectToastType(message) {
  const value = String(message || '').toLowerCase();

  if (value.includes('thành công') || value.includes('đã thêm') || value.includes('đã cập nhật') || value.includes('đã xóa')) {
    return 'success';
  }

  if (value.includes('lỗi') || value.includes('không thể') || value.includes('thất bại')) {
    return 'error';
  }

  if (value.includes('vui lòng') || value.includes('cảnh báo') || value.includes('không tìm thấy')) {
    return 'warning';
  }

  return 'info';
}

const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((items) => items.filter((toast) => toast.id !== id));
  }, []);

  const showToast = useCallback((message, options = {}) => {
    const text = typeof message === 'string' ? message : String(message ?? '');
    const type = options.type || detectToastType(text);
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const duration = options.duration ?? 3600;

    setToasts((items) => [
      ...items,
      {
        id,
        message: text,
        type,
        title: options.title || toastStyles[type]?.title || toastStyles.info.title,
      },
    ]);

    window.setTimeout(() => removeToast(id), duration);
    return id;
  }, [removeToast]);

  useEffect(() => {
    const originalAlert = window.alert;

    window.alert = (message) => {
      showToast(message);
    };

    window.toast = {
      show: showToast,
      success: (message, options) => showToast(message, { ...options, type: 'success' }),
      error: (message, options) => showToast(message, { ...options, type: 'error' }),
      warning: (message, options) => showToast(message, { ...options, type: 'warning' }),
      info: (message, options) => showToast(message, { ...options, type: 'info' }),
    };

    return () => {
      window.alert = originalAlert;
      delete window.toast;
    };
  }, [showToast]);

  const contextValue = useMemo(() => ({ showToast, removeToast }), [showToast, removeToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}

      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-[min(26rem,calc(100vw-2rem))] flex-col gap-3 sm:right-6 sm:top-6">
        {toasts.map((toast) => {
          const style = toastStyles[toast.type] || toastStyles.info;
          const Icon = style.icon;

          return (
            <div
              key={toast.id}
              className="pointer-events-auto overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl shadow-[#2b3896]/15 ring-1 ring-black/5 animate-[toastIn_220ms_ease-out]"
            >
              <div className={`h-1 ${style.bar}`} />
              <div className="flex gap-3 p-4">
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${style.iconBox}`}>
                  <Icon size={22} strokeWidth={2.2} />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <p className="text-sm font-extrabold text-slate-900">{toast.title}</p>
                    <button
                      type="button"
                      onClick={() => removeToast(toast.id)}
                      className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                      aria-label="Đóng thông báo"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <p className="mt-1 text-sm leading-5 text-slate-600">{toast.message}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
}

export default ToastProvider;
