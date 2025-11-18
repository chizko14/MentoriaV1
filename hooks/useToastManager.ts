// Fix: Implemented the useToastManager custom hook.
import { useState, useEffect } from 'react';
import { toastEventEmitter } from '../services/eventService';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const useToastManager = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = (id: number) => {
    setToasts((currentToasts) => currentToasts.filter((toast) => toast.id !== id));
  };

  useEffect(() => {
    const handleNewToast = (toast: Toast) => {
      setToasts((currentToasts) => [...currentToasts, toast]);
      setTimeout(() => {
        removeToast(toast.id);
      }, 5000); // Auto-dismiss after 5 seconds
    };

    const unsubscribe = toastEventEmitter.subscribe(handleNewToast);

    return () => unsubscribe();
  }, []);

  return { toasts, removeToast };
};
