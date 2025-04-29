'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { usePathname, useRouter } from 'next/navigation';
import { FaHome, FaWallet, FaChartLine, FaUsers, FaTasks, FaUser } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import useDeviceDetect from '@/hooks/useDeviceDetect';

export default function MobileBottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser } = useAuth();
  const { isMobile, isTablet } = useDeviceDetect();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // إخفاء الشريط عند التمرير للأسفل وإظهاره عند التمرير للأعلى
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // تحسين الأداء: تحديث الحالة فقط عند تغير الرؤية
      if (currentScrollY > lastScrollY && currentScrollY > 100 && isVisible) {
        setIsVisible(false);
      } else if ((currentScrollY <= lastScrollY || currentScrollY <= 100) && !isVisible) {
        setIsVisible(true);
      }

      setLastScrollY(currentScrollY);
    };

    // استخدام throttle لتحسين الأداء
    let ticking = false;
    const scrollListener = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', scrollListener, { passive: true });
    return () => window.removeEventListener('scroll', scrollListener);
  }, [lastScrollY, isVisible]);

  // عناصر القائمة
  const navItems = [
    { path: '/', label: 'الرئيسية', icon: <FaHome /> },
    { path: '/wallet', label: 'المحفظة', icon: <FaWallet /> },
    { path: '/tasks', label: 'المهام', icon: <FaTasks /> },
    { path: '/referrals', label: 'الإحالات', icon: <FaUsers /> },
    { path: '/dashboard', label: 'أنا', icon: <FaUser /> }
  ];

  // إذا لم يكن المستخدم مسجلاً أو كان الجهاز ليس محمولاً أو جهاز لوحي، لا تعرض الشريط
  if (!currentUser || (!isMobile && !isTablet)) {
    return null;
  }

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 bg-background border-t border-background-lighter z-40 shadow-lg"
      initial={{ y: 100 }}
      animate={{ y: isVisible ? 0 : 100 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => {
          // تحسين تحديد الصفحة النشطة ليشمل الصفحات الفرعية
          const isActive = pathname === item.path ||
                          (item.path !== '/' && pathname?.startsWith(item.path));

          return (
            <button
              key={item.path}
              onClick={() => {
                // تجنب التوجيه إذا كان المستخدم بالفعل في نفس الصفحة
                if (pathname !== item.path) {
                  // استخدام window.location.href مباشرة
                  window.location.href = item.path;
                }
              }}
              className="flex flex-col items-center justify-center w-full h-full bg-transparent border-none cursor-pointer"
              aria-label={item.label}
            >
              <motion.div
                className={`flex flex-col items-center justify-center relative ${
                  isActive ? 'text-primary' : 'text-foreground-muted'
                }`}
                whileTap={{ scale: 0.9 }}
              >
                <div className={`text-xl mb-1 ${isActive ? 'text-primary' : 'text-foreground-muted'}`}>
                  {item.icon}
                </div>
                <span className={`text-xs ${isActive ? 'font-bold' : ''}`}>
                  {item.label}
                </span>

                {isActive && (
                  <motion.div
                    className="absolute -top-2 h-1 w-10 bg-primary rounded-b-full"
                    layoutId="bottomNavIndicator"
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.div>
            </button>
          );
        })}
      </div>

      {/* مساحة إضافية في الأسفل للأجهزة التي تحتوي على شريط تنقل في الأسفل */}
      <div className="h-safe-area-bottom bg-background"></div>
    </motion.nav>
  );
}
