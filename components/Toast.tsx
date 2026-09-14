
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { CheckCircle, AlertTriangle, Info, XCircle, X } from 'lucide-react';

// =============================================
// Toast Types
// =============================================

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    message: string;
    type: ToastType;
    duration: number;
}

interface ToastContextType {
    toast: (message: string, type?: ToastType, duration?: number) => void;
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = (): ToastContextType => {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used within ToastProvider');
    return ctx;
};

// =============================================
// Toast Icon & Colors
// =============================================

const TOAST_CONFIG: Record<ToastType, {
    icon: React.FC<any>;
    iconColor: string;
    bg: string;
    border: string;
    shadow: string;
}> = {
    success: {
        icon: CheckCircle,
        iconColor: 'text-green-500',
        bg: 'bg-green-500/10',
        border: 'border-green-500/20',
        shadow: 'shadow-green-500/10',
    },
    error: {
        icon: XCircle,
        iconColor: 'text-red-500',
        bg: 'bg-red-500/10',
        border: 'border-red-500/20',
        shadow: 'shadow-red-500/10',
    },
    info: {
        icon: Info,
        iconColor: 'text-blue-500',
        bg: 'bg-blue-500/10',
        border: 'border-blue-500/20',
        shadow: 'shadow-blue-500/10',
    },
    warning: {
        icon: AlertTriangle,
        iconColor: 'text-yellow-500',
        bg: 'bg-yellow-500/10',
        border: 'border-yellow-500/20',
        shadow: 'shadow-yellow-500/10',
    },
};

// =============================================
// ToastProvider
// =============================================

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);
    const idCounter = useRef(0);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: ToastType = 'info', duration: number = 3000) => {
        const id = `toast-${++idCounter.current}`;
        setToasts(prev => [...prev.slice(-4), { id, message, type, duration }]); // Max 5 toasts
        setTimeout(() => removeToast(id), duration);
    }, [removeToast]);

    const ctx: ToastContextType = {
        toast: addToast,
        success: (msg, dur) => addToast(msg, 'success', dur),
        error: (msg, dur) => addToast(msg, 'error', dur),
        info: (msg, dur) => addToast(msg, 'info', dur),
        warning: (msg, dur) => addToast(msg, 'warning', dur),
    };

    return (
        <ToastContext.Provider value={ctx}>
            {children}

            {/* Toast Container */}
            <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[10002] flex flex-col gap-2 pointer-events-none w-full max-w-sm px-4">
                {toasts.map((toast, index) => {
                    const config = TOAST_CONFIG[toast.type];
                    const IconComp = config.icon;

                    return (
                        <div
                            key={toast.id}
                            className={`
                                pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl border
                                bg-surface ${config.border} shadow-lg ${config.shadow}
                                animate-slideDown
                            `}
                            style={{
                                animation: 'toast-in 300ms cubic-bezier(0.32, 0.72, 0, 1) forwards',
                                backdropFilter: 'blur(20px)',
                                WebkitBackdropFilter: 'blur(20px)',
                            }}
                        >
                            <div className={`w-8 h-8 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                                <IconComp size={16} className={config.iconColor} />
                            </div>
                            <p className="text-sm font-medium text-textPrimary flex-1 line-clamp-2">{toast.message}</p>
                            <button
                                onClick={() => removeToast(toast.id)}
                                className="p-1 text-textSecondary hover:text-textPrimary transition-colors shrink-0"
                            >
                                <X size={14} />
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Toast animation keyframes */}
            <style>{`
                @keyframes toast-in {
                    from {
                        opacity: 0;
                        transform: translateY(-16px) scale(0.95);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0) scale(1);
                    }
                }
            `}</style>
        </ToastContext.Provider>
    );
};
