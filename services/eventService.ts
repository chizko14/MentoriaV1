// Fix: Implemented a simple event emitter service for toast notifications.
import { UploadProgress } from '../types';

type Listener<T> = (data: T) => void;

class EventEmitter<T> {
  private listeners: Set<Listener<T>> = new Set();

  subscribe(listener: Listener<T>): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(data: T): void {
    this.listeners.forEach(listener => listener(data));
  }
}

interface ToastEvent {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const toastEventEmitter = new EventEmitter<ToastEvent>();

export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    toastEventEmitter.emit({
        id: Date.now(),
        message,
        type,
    });
};

// Emitter for profile updates
export const profileUpdateEmitter = new EventEmitter<void>();

export const triggerProfileUpdate = () => {
    profileUpdateEmitter.emit();
};

// Emitter for study plan updates
export const studyPlanUpdateEmitter = new EventEmitter<void>();

export const triggerStudyPlanUpdate = () => {
    studyPlanUpdateEmitter.emit();
};

// Emitter for background upload progress
export const uploadProgressEmitter = new EventEmitter<UploadProgress | null>();

export const updateUploadProgress = (progress: UploadProgress | null) => {
    uploadProgressEmitter.emit(progress);
};
