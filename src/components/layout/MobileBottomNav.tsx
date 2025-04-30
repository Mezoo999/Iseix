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
    { path: '/dashboard', label: 'حسابي', icon: <FaUser /> }
  ];

  // عرض الشريط دائمًا على الأجهزة المحمولة، وعلى الأجهزة الأخرى إذا كان عرض الشاشة أقل من 768 بكسل
  if (!currentUser) {
    return null;
  }

  return (
    <motion.nav
      className="fixed bottom-0 left-0 right-0 bg-background-dark/90 backdrop-blur-lg border-t border-primary/20 z-40 shadow-lg"
      initial={{ y: 100 }}
      animate={{ y: isVisible ? 0 : 100 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          // تحسين تحديد الصفحة النشطة ليشمل الصفحات الفرعية
          const isActive = pathname === item.path ||
                          (item.path !== '/' && pathname?.startsWith(item.path));

          return (
            <motion.button
              key={item.path}
              onClick={() => {
                // تجنب التوجيه إذا كان المستخدم بالفعل في نفس الصفحة
                if (pathname !== item.path) {
                  // استخدام window.location.href مباشرة
                  window.location.href = item.path;
                }
              }}
              className={`flex flex-col items-center justify-center w-full h-full bg-transparent border-none cursor-pointer relative ${
                isActive ? 'z-10' : ''
              }`}
              aria-label={item.label}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {/* خلفية العنصر النشط */}
              {isActive && (
                <motion.div
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  layoutId="activeNavItemBackground"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}

              <div className="flex flex-col items-center justify-center relative py-1 px-3">
                <motion.div
                  className={`text-xl mb-1 ${isActive ? 'text-primary' : 'text-foreground-muted'}`}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0
                  }}
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                >
                  {item.icon}

                  {/* تأثير توهج خلف الأيقونة النشطة */}
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 bg-primary/20 rounded-full blur-md -z-10"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </motion.div>

                <motion.span
                  className={`text-xs ${isActive ? 'font-bold text-primary' : 'text-foreground-muted'}`}
                  animate={{ opacity: isActive ? 1 : 0.7 }}
                >
                  {item.label}
                </motion.span>
              </div>
            </motion.button>
          );
        })}
      </div>

      {/* مساحة إضافية في الأسفل للأجهزة التي تحتوي على شريط تنقل في الأسفل */}
      <div className="h-safe-area-bottom bg-background-dark/90 backdrop-blur-lg"></div>
    </motion.nav>
  );
}
