'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaTasks, FaUsers, FaCoins, FaCrown, FaTimes } from 'react-icons/fa';
import features from '@/config/features';

interface Notification {
  id: string;
  type: 'task' | 'referral' | 'reward' | 'membership' | 'system';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  action?: {
    text: string;
    url: string;
  };
}

interface SmartNotificationsProps {
  userId: string;
  userPreferences?: {
    taskNotifications: boolean;
    referralNotifications: boolean;
    rewardNotifications: boolean;
    membershipNotifications: boolean;
    systemNotifications: boolean;
  };
}

const SmartNotifications: React.FC<SmartNotificationsProps> = ({
  userId,
  userPreferences = {
    taskNotifications: true,
    referralNotifications: true,
    rewardNotifications: true,
    membershipNotifications: true,
    systemNotifications: true
  }
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isEnabled] = useState(features.smartNotifications);

  // محاكاة جلب الإشعارات من قاعدة البيانات
  useEffect(() => {
    // استخدام مرجع للتحقق من ما إذا كان المكون مثبتًا
    const isMounted = { current: true };

    // في التطبيق الحقيقي، سنقوم بجلب الإشعارات من Firebase
    // هنا نستخدم بيانات وهمية للتوضيح
    const getMockNotifications = () => {
      return [
        {
          id: '1',
          type: 'task' as const,
          title: 'مهمة جديدة متاحة',
          message: 'لديك 3 مهام جديدة متاحة اليوم. أكملها للحصول على مكافآت.',
          timestamp: new Date(Date.now() - 1000 * 60 * 30), // قبل 30 دقيقة
          read: false,
          action: {
            text: 'عرض المهام',
            url: '/tasks'
          }
        },
        {
          id: '2',
          type: 'referral' as const,
          title: 'إحالة جديدة',
          message: 'قام أحمد محمد بالتسجيل باستخدام رابط الإحالة الخاص بك.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // قبل ساعتين
          read: false,
          action: {
            text: 'عرض الإحالات',
            url: '/referrals'
          }
        },
        {
          id: '3',
          type: 'reward' as const,
          title: 'مكافأة جديدة',
          message: 'حصلت على مكافأة قدرها 5.2 USDT من إكمال المهام اليومية.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5), // قبل 5 ساعات
          read: true,
          action: {
            text: 'عرض المحفظة',
            url: '/wallet'
          }
        },
        {
          id: '4',
          type: 'membership' as const,
          title: 'ترقية مستوى العضوية',
          message: 'تهانينا! تمت ترقية مستوى عضويتك إلى Iseix Silver.',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // قبل يوم
          read: true,
          action: {
            text: 'عرض المستوى',
            url: '/membership'
          }
        },
        {
          id: '5',
          type: 'system' as const,
          title: 'تحديث النظام',
          message: 'تم تحديث المنصة بميزات جديدة. اكتشفها الآن!',
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 48), // قبل يومين
          read: true
        }
      ];
    };

    // تصفية الإشعارات حسب تفضيلات المستخدم
    const filterNotifications = (mockNotifications: Notification[]) => {
      return mockNotifications.filter(notification => {
        switch (notification.type) {
          case 'task':
            return userPreferences.taskNotifications;
          case 'referral':
            return userPreferences.referralNotifications;
          case 'reward':
            return userPreferences.rewardNotifications;
          case 'membership':
            return userPreferences.membershipNotifications;
          case 'system':
            return userPreferences.systemNotifications;
          default:
            return true;
        }
      });
    };

    // استخدام setTimeout لتجنب التحديثات المتزامنة
    const timeoutId = setTimeout(() => {
      if (isMounted.current) {
        const mockNotifications = getMockNotifications();
        const filteredNotifications = filterNotifications(mockNotifications);

        setNotifications(filteredNotifications);
        setUnreadCount(filteredNotifications.filter(n => !n.read).length);
      }
    }, 0);

    return () => {
      isMounted.current = false;
      clearTimeout(timeoutId);
    };
  }, [userId]);

  // تحديث حالة قراءة الإشعار
  const markAsRead = (notificationId: string) => {
    // في التطبيق الحقيقي، سنقوم بتحديث حالة الإشعار في Firebase
    setNotifications(notifications.map(notification =>
      notification.id === notificationId
        ? { ...notification, read: true }
        : notification
    ));

    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  // تحديد أيقونة الإشعار حسب النوع
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'task':
        return <FaTasks className="text-primary" />;
      case 'referral':
        return <FaUsers className="text-secondary" />;
      case 'reward':
        return <FaCoins className="text-warning" />;
      case 'membership':
        return <FaCrown className="text-success" />;
      case 'system':
        return <FaBell className="text-info" />;
      default:
        return <FaBell className="text-foreground-muted" />;
    }
  };

  // تنسيق الوقت
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) {
      return `منذ ${diffMins} دقيقة`;
    } else if (diffHours < 24) {
      return `منذ ${diffHours} ساعة`;
    } else {
      return `منذ ${diffDays} يوم`;
    }
  };

  return (
    <div className="relative">
      {isEnabled && (
        <>
          {/* زر الإشعارات */}
          <button
            className="relative p-2 rounded-full hover:bg-background-light/30 transition-colors"
            onClick={() => setShowNotifications(!showNotifications)}
          >
            <FaBell className="text-foreground-muted" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-primary text-white text-xs w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* قائمة الإشعارات */}
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                className="absolute left-0 mt-2 w-80 bg-background-light rounded-lg shadow-lg overflow-hidden z-50"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center justify-between p-3 border-b border-background-lighter">
                  <h3 className="font-bold">الإشعارات</h3>
                  <button
                    className="text-foreground-muted hover:text-foreground"
                    onClick={() => setShowNotifications(false)}
                  >
                    <FaTimes />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notifications.length > 0 ? (
                    notifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-background-lighter hover:bg-background-lighter/30 transition-colors ${
                          !notification.read ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex">
                          <div className="p-2 rounded-full bg-background-lighter ml-3">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h4 className="font-bold text-sm">{notification.title}</h4>
                              <span className="text-xs text-foreground-muted">
                                {formatTime(notification.timestamp)}
                              </span>
                            </div>
                            <p className="text-sm text-foreground-muted mt-1">
                              {notification.message}
                            </p>
                            {notification.action && (
                              <a
                                href={notification.action.url}
                                className="text-xs text-primary hover:underline mt-2 inline-block"
                              >
                                {notification.action.text}
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-foreground-muted">
                      لا توجد إشعارات
                    </div>
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="p-2 text-center border-t border-background-lighter">
                    <a href="/notifications" className="text-xs text-primary hover:underline">
                      عرض جميع الإشعارات
                    </a>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
};

export default SmartNotifications;
