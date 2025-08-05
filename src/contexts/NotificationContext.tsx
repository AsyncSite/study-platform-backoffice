import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import Toast from '../components/common/Toast';
import type { ToastType } from '../components/common/Toast';
import ConfirmModal from '../components/common/ConfirmModal';

interface ToastOptions {
  type?: ToastType;
  duration?: number;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
}

interface NotificationContextType {
  showToast: (message: string, options?: ToastOptions) => void;
  showConfirm: (options: ConfirmOptions) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
  duration: number;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
  } | null>(null);

  const showToast = useCallback((message: string, options?: ToastOptions) => {
    const id = Date.now().toString();
    const newToast: ToastItem = {
      id,
      message,
      type: options?.type || 'info',
      duration: options?.duration || 3000,
    };

    setToasts((prev) => [...prev, newToast]);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const showConfirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmModal({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    if (confirmModal) {
      confirmModal.resolve(true);
      setConfirmModal(null);
    }
  }, [confirmModal]);

  const handleCancel = useCallback(() => {
    if (confirmModal) {
      confirmModal.resolve(false);
      setConfirmModal(null);
    }
  }, [confirmModal]);

  return (
    <NotificationContext.Provider value={{ showToast, showConfirm }}>
      {children}
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}
      {confirmModal && (
        <ConfirmModal
          isOpen={true}
          title={confirmModal.options.title}
          message={confirmModal.options.message}
          confirmText={confirmModal.options.confirmText}
          cancelText={confirmModal.options.cancelText}
          variant={confirmModal.options.variant}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}
    </NotificationContext.Provider>
  );
};

export default NotificationContext;