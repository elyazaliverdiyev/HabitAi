
import React, { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

type DialogVariant = 'confirm' | 'alert' | 'danger' | 'success' | 'info';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm?: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: DialogVariant;
    /** If true, only shows OK button (alert mode) */
    alertOnly?: boolean;
}

const VARIANTS: Record<DialogVariant, {
    icon: React.FC<any>;
    iconColor: string;
    iconBg: string;
    confirmBg: string;
    confirmHover: string;
}> = {
    confirm: {
        icon: AlertCircle,
        iconColor: 'text-brand',
        iconBg: 'bg-brand/10',
        confirmBg: 'bg-brand hover:bg-brand/90',
        confirmHover: 'hover:shadow-brand/30',
    },
    alert: {
        icon: Info,
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-500/10',
        confirmBg: 'bg-blue-500 hover:bg-blue-600',
        confirmHover: 'hover:shadow-blue-500/30',
    },
    danger: {
        icon: AlertTriangle,
        iconColor: 'text-red-500',
        iconBg: 'bg-red-500/10',
        confirmBg: 'bg-red-500 hover:bg-red-600',
        confirmHover: 'hover:shadow-red-500/30',
    },
    success: {
        icon: CheckCircle,
        iconColor: 'text-green-500',
        iconBg: 'bg-green-500/10',
        confirmBg: 'bg-green-500 hover:bg-green-600',
        confirmHover: 'hover:shadow-green-500/30',
    },
    info: {
        icon: Info,
        iconColor: 'text-blue-500',
        iconBg: 'bg-blue-500/10',
        confirmBg: 'bg-blue-500 hover:bg-blue-600',
        confirmHover: 'hover:shadow-blue-500/30',
    },
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen, onClose, onConfirm, title, message,
    confirmText = 'OK', cancelText = 'Cancel',
    variant = 'confirm', alertOnly = false,
}) => {
    const [visible, setVisible] = useState(false);
    const [animating, setAnimating] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setVisible(true);
            requestAnimationFrame(() => {
                requestAnimationFrame(() => setAnimating(true));
            });
        } else {
            setAnimating(false);
            const timer = setTimeout(() => setVisible(false), 200);
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    const handleConfirm = useCallback(() => {
        onConfirm?.();
        onClose();
    }, [onConfirm, onClose]);

    if (!visible) return null;

    const v = VARIANTS[variant];
    const IconComponent = v.icon;

    return (
        <div
            className="fixed inset-0 z-[10001] flex items-center justify-center px-4"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            style={{
                backgroundColor: animating ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)',
                backdropFilter: animating ? 'blur(4px)' : 'blur(0)',
                WebkitBackdropFilter: animating ? 'blur(4px)' : 'blur(0)',
                transition: 'all 200ms ease',
            }}
        >
            <div
                className="w-full max-w-sm bg-surface rounded-2xl overflow-hidden"
                style={{
                    transform: animating ? 'scale(1)' : 'scale(0.9)',
                    opacity: animating ? 1 : 0,
                    transition: 'all 250ms cubic-bezier(0.32, 0.72, 0, 1)',
                    boxShadow: '0 25px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
                }}
            >
                <div className="px-6 pt-6 pb-4 text-center">
                    {/* Icon */}
                    <div className={`w-14 h-14 ${v.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                        <IconComponent size={28} className={v.iconColor} />
                    </div>

                    {/* Title & Message */}
                    <h3 className="text-lg font-bold text-textPrimary mb-2">{title}</h3>
                    <p className="text-sm text-textSecondary leading-relaxed">{message}</p>
                </div>

                {/* Action Buttons */}
                <div className={`px-6 pb-6 ${alertOnly ? 'flex justify-center' : 'grid grid-cols-2 gap-3'}`}>
                    {!alertOnly && (
                        <button
                            onClick={onClose}
                            className="px-4 py-3 rounded-xl text-sm font-bold text-textSecondary bg-surfaceHighlight hover:bg-surfaceHighlight/80 transition-all active:scale-95"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        onClick={handleConfirm}
                        className={`px-4 py-3 rounded-xl text-sm font-bold text-white ${v.confirmBg} transition-all shadow-lg ${v.confirmHover} active:scale-95 ${alertOnly ? 'min-w-[120px]' : ''}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmDialog;

// ======================
// useConfirm hook
// ======================

interface ConfirmOptions {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    variant?: DialogVariant;
}

interface AlertOptions {
    title: string;
    message: string;
    variant?: DialogVariant;
    confirmText?: string;
}

interface UseConfirmReturn {
    confirm: (options: ConfirmOptions) => Promise<boolean>;
    alert: (options: AlertOptions) => Promise<void>;
    dialogProps: ConfirmDialogProps;
}

export const useConfirm = (): UseConfirmReturn => {
    const [dialogState, setDialogState] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        confirmText: string;
        cancelText: string;
        variant: DialogVariant;
        alertOnly: boolean;
        resolve?: (value: boolean) => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        confirmText: 'OK',
        cancelText: 'Cancel',
        variant: 'confirm',
        alertOnly: false,
    });

    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise(resolve => {
            setDialogState({
                isOpen: true,
                title: options.title,
                message: options.message,
                confirmText: options.confirmText || 'Confirm',
                cancelText: options.cancelText || 'Cancel',
                variant: options.variant || 'confirm',
                alertOnly: false,
                resolve,
            });
        });
    }, []);

    const alertFn = useCallback((options: AlertOptions): Promise<void> => {
        return new Promise(resolve => {
            setDialogState({
                isOpen: true,
                title: options.title,
                message: options.message,
                confirmText: options.confirmText || 'OK',
                cancelText: '',
                variant: options.variant || 'info',
                alertOnly: true,
                resolve: () => resolve(),
            });
        });
    }, []);

    const handleClose = useCallback(() => {
        dialogState.resolve?.(false);
        setDialogState(prev => ({ ...prev, isOpen: false }));
    }, [dialogState.resolve]);

    const handleConfirm = useCallback(() => {
        dialogState.resolve?.(true);
        setDialogState(prev => ({ ...prev, isOpen: false }));
    }, [dialogState.resolve]);

    return {
        confirm,
        alert: alertFn,
        dialogProps: {
            isOpen: dialogState.isOpen,
            onClose: handleClose,
            onConfirm: handleConfirm,
            title: dialogState.title,
            message: dialogState.message,
            confirmText: dialogState.confirmText,
            cancelText: dialogState.cancelText,
            variant: dialogState.variant,
            alertOnly: dialogState.alertOnly,
        },
    };
};
