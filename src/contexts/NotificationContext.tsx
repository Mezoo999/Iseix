'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import MobileNotification, { NotificationType } from '@/components/notifications/MobileNotification';

interface Notification {
  id: string;
  message: string;
  type: NotificationType;
  duration?: number;
  showIcon?: boolean;
  showClose?: boolean;
  position?: 'top' | 'bottom';
}

interface NotificationContextType {
  notifications: Notification[];
  showNotification: (
    message: string,
    type?: NotificationType,
    duration?: number,
    showIcon?: boolean,
    showClose?: boolean,
    position?: 'top' | 'bottom'
  ) => string;
  hideNotification: (id: string) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // إظهار إشعار جديد
  const showNotification = (
    message: string,
    type: NotificationType = 'info',
    duration: number = 3000,
    showIcon: boolean = true,
    showClose: boolean = true,
    position: 'top' | 'bottom' = 'top'
  ): string => {
    const id = Date.now().toString();
    
    const newNotification: Notification = {
      id,
      message,
      type,
      duration,
      showIcon,
      showClose,
      position
    };
    
    setNotifications(prev => [...prev, newNotification]);
    return id;
  };
  
  // إخفاء إشعار محدد
  const hideNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };
  
  // إخفاء جميع الإشعارات
  const clearAllNotifications = () => {
    setNotifications([]);
  };
  
  return (
    <NotificationContext.Provider
      value={{
        notifications,
        showNotification,
        hideNotification,
        clearAllNotifications
      }}
    >
      {children}
      
      {/* عرض الإشعارات */}
      {notifications.map(notification => (
        <MobileNotification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          duration={notification.duration}
          showIcon={notification.showIcon}
          showClose={notification.showClose}
          position={notification.position}
          onClose={() => hideNotification(notification.id)}
        />
      ))}
    </NotificationContext.Provider>
  );
}

// هوك لاستخدام الإشعارات
export function useNotification() {
  const context = useContext(NotificationContext);
  
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  
  return context;
}
