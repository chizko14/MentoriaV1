// Fix: Implemented the missing Toast and ToastContainer components.
import React from 'react';
import { Icon } from './icons';
import { Toast as ToastType } from '../hooks/useToastManager';

interface ToastProps {
  toast: ToastType;
  onDismiss: (id: number) => void;
}

const toastConfig = {
    success: {
        icon: 'checkCircle' as const,
        className: 'bg-green-500',
    },
    error: {
        icon: 'close' as const, // A better icon might be 'alert-triangle' if available
        className: 'bg-red-500',
    },
    info: {
        icon: 'notification' as const, // A better icon might be 'info' if available
        className: 'bg-blue-500',
    },
};

export const Toast: React.FC<ToastProps> = ({ toast, onDismiss }) => {
    const config = toastConfig[toast.type];

    return (
        <div className={`flex items-center text-white p-4 rounded-md shadow-lg ${config.className}`}>
            <Icon name={config.icon} className="w-6 h-6 mr-3" />
            <div className="flex-1">{toast.message}</div>
            <button onClick={() => onDismiss(toast.id)} className="ml-4 p-1 rounded-full hover:bg-black/20">
                <Icon name="close" className="w-5 h-5" />
            </button>
        </div>
    );
};

interface ToastContainerProps {
    toasts: ToastType[];
    onDismiss: (id: number) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => {
    return (
        <div className="fixed top-5 right-5 z-50 space-y-3">
            {toasts.map(toast => (
                <Toast key={toast.id} toast={toast} onDismiss={onDismiss} />
            ))}
        </div>
    );
};
