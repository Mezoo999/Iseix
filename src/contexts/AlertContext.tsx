'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AnimatedAlert from '@/components/ui/AnimatedAlert';
import { ToastContainer } from '@/components/ui/MobileToast';
import { useSoundEffects } from '@/components/ui/SoundEffects';
import CenteredModal from '@/components/ui/CenteredModal';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface Alert {
  id: string;
  type: AlertType;
  message: string;
}

interface ModalAlert {
  type: AlertType;
  title: string;
  message: string;
  actionText?: string;
  onAction?: () => void;
}

interface AlertContextType {
  alerts: Alert[];
  showAlert: (type: AlertType, message: string, duration?: number) => void;
  showModalAlert: (type: AlertType, title: string, message: string, actionText?: string, onAction?: () => void) => void;
  removeAlert: (id: string) => void;
  closeModal: () => void;
}

const AlertContext = createContext<AlertContextType>({
  alerts: [],
  showAlert: () => {},
  showModalAlert: () => {},
  removeAlert: () => {},
  closeModal: () => {}
});

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [modalAlert, setModalAlert] = useState<ModalAlert | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { playSound } = useSoundEffects();

  const showAlert = (type: AlertType, message: string, duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setAlerts(prev => [...prev, { id, type, message }]);

    // تشغيل صوت التنبيه
    switch (type) {
      case 'success':
        playSound('success');
        break;
      case 'error':
        playSound('error');
        break;
      case 'warning':
      case 'info':
        playSound('notification');
        break;
    }

    if (duration > 0) {
      setTimeout(() => {
        removeAlert(id);
      }, duration);
    }
  };

  const showModalAlert = (type: AlertType, title: string, message: string, actionText?: string, onAction?: () => void) => {
    setModalAlert({ type, title, message, actionText, onAction });
    setIsModalOpen(true);

    // تشغيل صوت التنبيه
    switch (type) {
      case 'success':
        playSound('success');
        break;
      case 'error':
        playSound('error');
        break;
      case 'warning':
      case 'info':
        playSound('notification');
        break;
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const removeAlert = (id: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== id));
  };

  // تحديد ما إذا كان الجهاز محمولاً
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // التحقق عند التحميل
    checkIfMobile();

    // التحقق عند تغيير حجم النافذة
    window.addEventListener('resize', checkIfMobile);

    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);

  return (
    <AlertContext.Provider value={{ alerts, showAlert, showModalAlert, removeAlert, closeModal }}>
      {children}

      {/* تنبيهات سطح المكتب */}
      <div className="fixed top-4 left-4 right-4 z-50 flex flex-col items-center hidden md:flex">
        {alerts.map(alert => (
          <AnimatedAlert
            key={alert.id}
            type={alert.type}
            message={alert.message}
            onClose={() => removeAlert(alert.id)}
          />
        ))}
      </div>

      {/* تنبيهات الأجهزة المحمولة */}
      <ToastContainer
        toasts={alerts}
        position="bottom"
        onClose={removeAlert}
      />

      {/* النافذة المنبثقة المركزية */}
      {modalAlert && (
        <CenteredModal
          type={modalAlert.type}
          title={modalAlert.title}
          message={modalAlert.message}
          isOpen={isModalOpen}
          onClose={closeModal}
          actionText={modalAlert.actionText}
          onAction={modalAlert.onAction}
        />
      )}
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
