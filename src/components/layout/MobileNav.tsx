'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { FaTimes, FaBars, FaHome, FaWallet, FaChartLine, FaUsers, FaTasks, FaExchangeAlt, FaSignOutAlt, FaUserCircle, FaUser, FaBell, FaUserShield } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import SmartNotifications from '@/components/notifications/SmartNotifications';

interface MobileNavProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileNav({ isOpen, onClose }: MobileNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, userData, logout } = useAuth();

  // إغلاق القائمة عند تغيير المسار
  useEffect(() => {
    if (isOpen) {
      onClose();
    }
  }, [pathname, isOpen, onClose]);

  // منع التمرير عند فتح القائمة
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // التعامل مع تسجيل الخروج
  const handleLogout = async () => {
    try {
      await logout();
      onClose();
      // توجيه المستخدم إلى الصفحة الرئيسية بعد تسجيل الخروج
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
      // محاولة توجيه المستخدم إلى الصفحة الرئيسية حتى في حالة حدوث خطأ
      window.location.href = '/';
    }
  };

  // عناصر القائمة
  const menuItems = [
    { path: '/', label: 'الصفحة الرئيسية', icon: <FaHome /> },
    { path: '/dashboard', label: 'حسابي', icon: <FaUser /> },
    { path: '/wallet', label: 'المحفظة', icon: <FaWallet /> },
    { path: '/investment/my-investments', label: 'استثماراتي', icon: <FaChartLine /> },
    { path: '/investment/plans', label: 'خطط الاستثمار', icon: <FaChartLine /> },
    { path: '/referrals', label: 'الإحالات', icon: <FaUsers /> },
    { path: '/tasks', label: 'المهام اليومية', icon: <FaTasks /> },
    { path: '/transactions', label: 'المعاملات', icon: <FaExchangeAlt /> },
    { path: '/profile', label: 'الملف الشخصي', icon: <FaUserCircle /> }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          <motion.div
            className="fixed inset-y-0 right-0 w-4/5 max-w-xs bg-background z-50 shadow-xl flex flex-col"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          >
            <div className="flex justify-between items-center p-4 border-b border-background-lighter">
              <h2 className="text-xl font-bold">القائمة</h2>
              <button
                className="p-2 rounded-full hover:bg-background-light transition-colors"
                onClick={onClose}
              >
                <FaTimes />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-4">
              <nav>
                <ul className="space-y-1">
                  {menuItems.map((item) => (
                    <li key={item.path}>
                      <button
                        onClick={() => {
                          // تجنب التوجيه إذا كان المستخدم بالفعل في نفس الصفحة
                          if (pathname !== item.path) {
                            // استخدام window.location.href مباشرة
                            window.location.href = item.path;
                            onClose(); // إغلاق القائمة بعد النقر
                          }
                        }}
                        className={`flex items-center px-4 py-3 w-full text-right bg-transparent border-none cursor-pointer ${
                          pathname === item.path
                            ? 'bg-primary/10 text-primary'
                            : 'hover:bg-background-light'
                        }`}
                      >
                        <span className="ml-3">{item.icon}</span>
                        {item.label}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>

            {currentUser && (
              <div className="p-4 border-t border-background-lighter">
                {/* الإشعارات الذكية للأجهزة المحمولة */}
                <div className="flex items-center w-full px-4 py-3 hover:bg-background-light rounded-lg mb-2">
                  <FaBell className="ml-3 text-primary" />
                  <span>الإشعارات</span>
                  <div className="mr-auto">
                    <SmartNotifications userId={currentUser.uid} />
                  </div>
                </div>

                {userData?.isOwner && (
                  <button
                    className="flex items-center w-full px-4 py-3 text-primary hover:bg-background-light rounded-lg mb-2"
                    onClick={() => {
                      window.location.href = '/admin';
                      onClose();
                    }}
                  >
                    <FaUserShield className="ml-3" />
                    لوحة المشرف
                  </button>
                )}

                <button
                  className="flex items-center w-full px-4 py-3 text-error hover:bg-background-light rounded-lg"
                  onClick={handleLogout}
                >
                  <FaSignOutAlt className="ml-3" />
                  تسجيل الخروج
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
