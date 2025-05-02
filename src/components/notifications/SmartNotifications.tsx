'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaBell, FaTasks, FaUsers, FaCoins, FaCrown, FaTimes, FaShieldAlt } from 'react-icons/fa';
import features from '@/config/features';
import {
  fetchUserNotificationsPolling,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  Notification as NotificationInterface,
  NotificationType
} from '@/services/notifications';

interface SmartNotificationsProps {
  userId: string;
  userPreferences?: {
    taskNotifications: boolean;
    referralNotifications: boolean;
    rewardNotifications: boolean;
    membershipNotifications: boolean;
    systemNotifications: boolean;
    securityNotifications: boolean;
  };
}

const SmartNotifications: React.FC<SmartNotificationsProps> = ({
  userId,
  userPreferences = {
    taskNotifications: true,
    referralNotifications: true,
    rewardNotifications: true,
    membershipNotifications: true,
    systemNotifications: true,
    securityNotifications: true
  }
}) => {
  const [notifications, setNotifications] = useState<NotificationInterface[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isEnabled] = useState(features.smartNotifications);
  const [isLoading, setIsLoading] = useState(true);

  // جلب الإشعارات بشكل دوري
  useEffect(() => {
    if (!userId || !isEnabled) return;

    setIsLoading(true);
    console.log(`[SmartNotifications] بدء جلب الإشعارات للمستخدم: ${userId}`);

    // دالة لجلب الإشعارات
    const fetchNotifications = async () => {
      try {
        const fetchedNotifications = await fetchUserNotificationsPolling(userId);
        console.log(`[SmartNotifications] تم استلام ${fetchedNotifications.length} إشعارات`);

        // تصفية الإشعارات حسب تفضيلات المستخدم
        const filteredNotifications = fetchedNotifications.filter(notification => {
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
            case 'security':
              return userPreferences.securityNotifications;
            default:
              return true;
          }
        });

        // تحويل الإشعارات إلى الشكل المطلوب
        const formattedNotifications = filteredNotifications.map(notification => ({
          ...notification,
          timestamp: notification.createdAt?.toDate() || new Date(),
          read: notification.isRead
        }));

        setNotifications(formattedNotifications);
        setUnreadCount(formattedNotifications.filter(n => !n.read).length);
        setIsLoading(false);
      } catch (error) {
        console.error('[SmartNotifications] خطأ في جلب الإشعارات:', error);
        setIsLoading(false);
      }
    };

    // جلب الإشعارات عند تحميل المكون
    fetchNotifications();

    // إعداد مؤقت لجلب الإشعارات كل 30 ثانية
    const intervalId = setInterval(fetchNotifications, 30000);

    // إلغاء المؤقت عند إزالة المكون
    return () => {
      console.log(`[SmartNotifications] إلغاء جلب الإشعارات للمستخدم: ${userId}`);
      clearInterval(intervalId);
    };
  }, [userId, isEnabled, userPreferences]);

  // تحديث حالة قراءة الإشعار
  const markAsRead = async (notificationId: string) => {
    try {
      // تحديث حالة الإشعار في Firebase
      await markNotificationAsRead(notificationId);

      // تحديث الواجهة مباشرة
      setNotifications(notifications.map(notification =>
        notification.id === notificationId
          ? { ...notification, read: true, isRead: true }
          : notification
      ));

      setUnreadCount(prev => Math.max(0, prev - 1));

      // إعادة جلب الإشعارات بعد فترة قصيرة للتأكد من التحديث
      setTimeout(async () => {
        try {
          const fetchedNotifications = await fetchUserNotificationsPolling(userId);

          // تصفية وتنسيق الإشعارات
          const filteredNotifications = fetchedNotifications
            .filter(notification => {
              switch (notification.type) {
                case 'task': return userPreferences.taskNotifications;
                case 'referral': return userPreferences.referralNotifications;
                case 'reward': return userPreferences.rewardNotifications;
                case 'membership': return userPreferences.membershipNotifications;
                case 'system': return userPreferences.systemNotifications;
                case 'security': return userPreferences.securityNotifications;
                default: return true;
              }
            })
            .map(notification => ({
              ...notification,
              timestamp: notification.createdAt?.toDate() || new Date(),
              read: notification.isRead
            }));

          setNotifications(filteredNotifications);
          setUnreadCount(filteredNotifications.filter(n => !n.read).length);
        } catch (error) {
          console.error('[SmartNotifications] خطأ في إعادة جلب الإشعارات بعد التحديث:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('[SmartNotifications] خطأ في تحديث حالة قراءة الإشعار:', error);
    }
  };

  // تحديث حالة قراءة جميع الإشعارات
  const markAllAsRead = async () => {
    try {
      if (unreadCount === 0) return;

      await markAllNotificationsAsRead(userId);

      // تحديث الواجهة مباشرة
      setNotifications(notifications.map(notification => ({
        ...notification,
        read: true,
        isRead: true
      })));

      setUnreadCount(0);

      // إعادة جلب الإشعارات بعد فترة قصيرة للتأكد من التحديث
      setTimeout(async () => {
        try {
          const fetchedNotifications = await fetchUserNotificationsPolling(userId);

          // تصفية وتنسيق الإشعارات
          const filteredNotifications = fetchedNotifications
            .filter(notification => {
              switch (notification.type) {
                case 'task': return userPreferences.taskNotifications;
                case 'referral': return userPreferences.referralNotifications;
                case 'reward': return userPreferences.rewardNotifications;
                case 'membership': return userPreferences.membershipNotifications;
                case 'system': return userPreferences.systemNotifications;
                case 'security': return userPreferences.securityNotifications;
                default: return true;
              }
            })
            .map(notification => ({
              ...notification,
              timestamp: notification.createdAt?.toDate() || new Date(),
              read: notification.isRead
            }));

          setNotifications(filteredNotifications);
          setUnreadCount(filteredNotifications.filter(n => !n.read).length);
        } catch (error) {
          console.error('[SmartNotifications] خطأ في إعادة جلب الإشعارات بعد التحديث:', error);
        }
      }, 1000);
    } catch (error) {
      console.error('[SmartNotifications] خطأ في تحديث حالة قراءة جميع الإشعارات:', error);
    }
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
      case 'security':
        return <FaShieldAlt className="text-error" />;
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
            aria-label="الإشعارات"
          >
            <FaBell className={unreadCount > 0 ? "text-primary" : "text-foreground-muted"} />
            {unreadCount > 0 && (
              <motion.span
                className="absolute top-0 right-0 bg-primary text-white text-xs w-4 h-4 rounded-full flex items-center justify-center"
                initial={{ scale: 0.5 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 15 }}
              >
                {unreadCount}
              </motion.span>
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
                  <div className="flex items-center">
                    {unreadCount > 0 && (
                      <button
                        className="text-xs text-primary hover:underline ml-3"
                        onClick={markAllAsRead}
                      >
                        تحديد الكل كمقروء
                      </button>
                    )}
                    <button
                      className="text-foreground-muted hover:text-foreground p-1"
                      onClick={() => setShowNotifications(false)}
                      aria-label="إغلاق"
                    >
                      <FaTimes />
                    </button>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {isLoading ? (
                    <div className="p-4 text-center text-foreground-muted">
                      جاري تحميل الإشعارات...
                    </div>
                  ) : notifications.length > 0 ? (
                    notifications.map(notification => (
                      <motion.div
                        key={notification.id}
                        className={`p-3 border-b border-background-lighter hover:bg-background-lighter/30 transition-colors ${
                          !notification.read ? 'bg-primary/5' : ''
                        }`}
                        onClick={() => markAsRead(notification.id)}
                        initial={!notification.read ? { backgroundColor: "rgba(var(--color-primary), 0.2)" } : {}}
                        animate={!notification.read ? { backgroundColor: "rgba(var(--color-primary), 0.05)" } : {}}
                        transition={{ duration: 1 }}
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
                                onClick={(e) => {
                                  e.stopPropagation(); // منع تنفيذ markAsRead عند النقر على الرابط
                                }}
                              >
                                {notification.action.text}
                              </a>
                            )}
                          </div>
                        </div>
                      </motion.div>
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
