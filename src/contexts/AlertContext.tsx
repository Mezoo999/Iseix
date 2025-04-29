'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import AnimatedAlert from '@/components/ui/AnimatedAlert';
import { ToastContainer } from '@/components/ui/MobileToast';
import { useSoundEffects } from '@/components/ui/SoundEffects';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface Alert {
  id: string;
  type: AlertType;
  message: string;
}

interface AlertContextType {
  alerts: Alert[];
  showAlert: (type: AlertType, message: string, duration?: number) => void;
  removeAlert: (id: string) => void;
}

const AlertContext = createContext<AlertContextType>({
  alerts: [],
  showAlert: () => {},
  removeAlert: () => {}
});

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
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
    <AlertContext.Provider value={{ alerts, showAlert, removeAlert }}>
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
    </AlertContext.Provider>
  );
};

export const useAlert = () => useContext(AlertContext);
