'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaBars, FaUser, FaWallet, FaSignOutAlt, FaChartLine, FaTasks, FaUserShield, FaGift } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import MobileNav from './MobileNav';
import SmartNotifications from '@/components/notifications/SmartNotifications';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const { currentUser, userData, logout } = useAuth();

  // تأثير التمرير
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // معالج تسجيل الخروج
  const handleLogout = async () => {
    try {
      await logout();
      // إغلاق القائمة المنسدلة بعد تسجيل الخروج
      setIsOpen(false);
      // توجيه المستخدم إلى الصفحة الرئيسية بعد تسجيل الخروج
      window.location.href = '/';
    } catch (error) {
      console.error('Error logging out:', error);
      // محاولة توجيه المستخدم إلى الصفحة الرئيسية حتى في حالة حدوث خطأ
      window.location.href = '/';
    }
  };

  // قائمة الروابط
  const navLinks = [
    { name: 'الرئيسية', href: '/' },
    { name: 'عن المنصة', href: '/about' },
    { name: 'خطط الاستثمار', href: '/investment/plans' },
    { name: 'كيفية البدء', href: '/getting-started' },
  ];

  // زر لوحة التحكم
  const dashboardLink = { name: 'حسابي', href: '/dashboard' };

  // قائمة روابط المستخدم المسجل
  const userLinks = [
    { name: 'لوحة التحكم', href: '/dashboard' },
    { name: 'المهام اليومية', href: '/tasks' },
    { name: 'استثماراتي', href: '/investment/my-investments' },
    { name: 'المحفظة', href: '/wallet' },
    { name: 'الإحالات', href: '/referrals' },
    { name: 'الملف الشخصي', href: '/profile' },
  ];

  return (
    <motion.header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? 'glass-effect py-2' : 'py-4'
      }`}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* الشعار */}
        <motion.div
          className="flex items-center cursor-pointer"
          onClick={() => {
            try {
              window.location.href = '/';
            } catch (error) {
              console.error('Navigation error:', error);
            }
          }}
        >
          <motion.div
            className="flex items-center"
            whileHover={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300 }}
          >
            <img src="/images/logo.svg" alt="Iseix Logo" className="h-10 w-10 ml-2" />
            <span className="text-2xl font-bold text-gradient">Iseix</span>
          </motion.div>
        </motion.div>

        {/* قائمة التنقل للشاشات الكبيرة والصغيرة */}
        <nav className="flex items-center space-x-1 space-x-reverse">
          {navLinks.map((link) => (
            <button
              key={link.href}
              onClick={() => {
                try {
                  window.location.href = link.href;
                } catch (error) {
                  console.error('Navigation error:', error);
                }
              }}
              className={`px-4 py-2 rounded-md transition-colors bg-transparent border-none cursor-pointer ${
                pathname === link.href
                  ? 'text-primary font-bold'
                  : 'text-foreground-muted hover:text-primary'
              }`}
            >
              {link.name}
            </button>
          ))}

          {currentUser && (
            <button
              onClick={() => {
                try {
                  window.location.href = dashboardLink.href;
                } catch (error) {
                  console.error('Navigation error:', error);
                }
              }}
              className={`px-4 py-2 rounded-md transition-colors mr-2 bg-transparent border-none cursor-pointer ${
                pathname === dashboardLink.href
                  ? 'bg-primary text-white font-bold'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              }`}
            >
              {dashboardLink.name}
            </button>
          )}
        </nav>

        {/* أزرار تسجيل الدخول / لوحة التحكم */}
        <div className="flex items-center space-x-3 space-x-reverse">
          {currentUser ? (
            <div className="flex items-center">
              {/* مكون الإشعارات الذكية */}
              <div className="mr-3">
                <SmartNotifications userId={currentUser.uid} />
              </div>

              <motion.button
                className="btn btn-outline mr-3 flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  try {
                    window.location.href = '/rewards/lucky-wheel';
                  } catch (error) {
                    console.error('Navigation error:', error);
                  }
                }}
              >
                <FaGift className="ml-2" />
                عجلة الحظ
              </motion.button>
              <motion.button
                className="btn btn-outline mr-3 flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  try {
                    window.location.href = '/tasks';
                  } catch (error) {
                    console.error('Navigation error:', error);
                  }
                }}
              >
                <FaTasks className="ml-2" />
                المهام اليومية
              </motion.button>
              <motion.button
                className="btn btn-outline mr-3 flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  try {
                    window.location.href = '/investment/my-investments';
                  } catch (error) {
                    console.error('Navigation error:', error);
                  }
                }}
              >
                <FaChartLine className="ml-2" />
                استثماراتي
              </motion.button>
              <motion.button
                className="btn btn-outline mr-3 flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  try {
                    window.location.href = '/wallet';
                  } catch (error) {
                    console.error('Navigation error:', error);
                  }
                }}
              >
                <FaWallet className="ml-2" />
                المحفظة
              </motion.button>
              {userData?.isOwner && (
                <motion.button
                  className="btn btn-outline mr-3 flex items-center text-primary"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    try {
                      window.location.href = '/admin';
                    } catch (error) {
                      console.error('Navigation error:', error);
                    }
                  }}
                >
                  <FaUserShield className="ml-2" />
                  لوحة المشرف
                </motion.button>
              )}
              <motion.button
                className="btn btn-outline mr-3 flex items-center text-error"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogout}
              >
                <FaSignOutAlt className="ml-2" />
                تسجيل الخروج
              </motion.button>
            </div>
          ) : (
            <div className="flex items-center">
              <motion.button
                className="btn btn-outline"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  try {
                    window.location.href = '/login';
                  } catch (error) {
                    console.error('Navigation error:', error);
                  }
                }}
              >
                تسجيل الدخول
              </motion.button>
              <motion.button
                className="btn btn-primary mr-3"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  try {
                    window.location.href = '/register';
                  } catch (error) {
                    console.error('Navigation error:', error);
                  }
                }}
              >
                إنشاء حساب
              </motion.button>
            </div>
          )}
        </div>

        {/* زر القائمة للشاشات الصغيرة - تم إزالته لأننا نعرض القائمة دائمًا */}
      </div>

      {/* القائمة المتحركة للشاشات الصغيرة */}
      <MobileNav isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </motion.header>
  );
};

export default Navbar;
