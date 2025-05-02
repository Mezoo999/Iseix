'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  FaTachometerAlt, FaUsers, FaExchangeAlt, FaWallet, FaUserTag,
  FaTasks, FaCog, FaBell, FaChartBar, FaBars, FaTimes, FaSignOutAlt,
  FaUserShield, FaMoneyBillWave, FaUserCog, FaUserLock
} from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';

export default function AdminSidebar() {
  const pathname = usePathname();
  const { logout, userData } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // تنظيم القائمة في مجموعات
  const menuGroups = [
    {
      title: 'عام',
      items: [
        { path: '/admin', label: 'لوحة التحكم', icon: <FaTachometerAlt /> },
        { path: '/admin/statistics', label: 'الإحصائيات', icon: <FaChartBar /> },
      ]
    },
    {
      title: 'إدارة المستخدمين',
      items: [
        { path: '/admin/users', label: 'المستخدمين', icon: <FaUsers /> },
        { path: '/admin/roles', label: 'الأدوار والصلاحيات', icon: <FaUserLock /> },
      ]
    },
    {
      title: 'المعاملات المالية',
      items: [
        { path: '/admin/transactions', label: 'المعاملات', icon: <FaExchangeAlt /> },
        { path: '/admin/deposits', label: 'الإيداعات', icon: <FaMoneyBillWave /> },
        { path: '/admin/withdrawals', label: 'السحوبات', icon: <FaWallet /> },
      ]
    },
    {
      title: 'إدارة المنصة',
      items: [
        { path: '/admin/referrals', label: 'نظام الإحالات', icon: <FaUserTag /> },
        { path: '/admin/membership', label: 'مستويات العضوية', icon: <FaUserCog /> },
        { path: '/admin/tasks', label: 'المهام اليومية', icon: <FaTasks /> },
        { path: '/admin/notifications', label: 'الإشعارات', icon: <FaBell /> },
        { path: '/admin/settings', label: 'الإعدادات', icon: <FaCog /> },
      ]
    },
  ];

  // تسطيح القائمة للاستخدام في الواجهة المحمولة
  const menuItems = menuGroups.flatMap(group => group.items);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      window.location.href = '/login';
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <>
      {/* زر فتح القائمة للجوال */}
      <button
        className="fixed top-4 right-4 z-50 p-2 rounded-full bg-primary text-white md:hidden"
        onClick={toggleMobileSidebar}
      >
        {isMobileOpen ? <FaTimes /> : <FaBars />}
      </button>

      {/* الخلفية المعتمة للجوال */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={toggleMobileSidebar}
        />
      )}

      {/* القائمة الجانبية */}
      <motion.aside
        className={`fixed top-0 right-0 h-full bg-background-dark text-white z-50 shadow-xl transition-all duration-300 ${
          isCollapsed ? 'w-20' : 'w-64'
        } ${isMobileOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}`}
        initial={false}
        animate={{ width: isCollapsed ? 80 : 256 }}
        transition={{ duration: 0.3 }}
      >
        {/* رأس القائمة */}
        <div className="p-4 border-b border-background-lighter flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
              <FaUserShield className="text-white" />
            </div>
            {!isCollapsed && (
              <div className="mr-3">
                <h3 className="font-bold">لوحة المشرف</h3>
                <p className="text-xs text-foreground-muted">{userData?.displayName}</p>
              </div>
            )}
          </div>
          <button
            className="text-foreground-muted hover:text-white transition-colors hidden md:block"
            onClick={toggleSidebar}
          >
            {isCollapsed ? <FaBars /> : <FaTimes />}
          </button>
        </div>

        {/* عناصر القائمة مقسمة إلى مجموعات */}
        <nav className="py-4 overflow-y-auto">
          {menuGroups.map((group, groupIndex) => (
            <div key={`group-${groupIndex}`} className="mb-6">
              {/* عنوان المجموعة */}
              {!isCollapsed && (
                <h3 className="text-xs text-foreground-muted mb-2 px-4 font-bold">
                  {group.title}
                </h3>
              )}
              {isCollapsed && (
                <div className="border-t border-background-lighter my-3 mx-2"></div>
              )}

              {/* عناصر المجموعة */}
              <ul className="space-y-1">
                {group.items.map((item) => {
                  const isActive = pathname === item.path;
                  return (
                    <li key={item.path}>
                      <Link
                        href={item.path}
                        className={`flex items-center py-3 px-4 ${
                          isActive
                            ? 'bg-primary text-white'
                            : 'text-foreground-muted hover:bg-background-lighter hover:text-white'
                        } transition-colors`}
                        onClick={() => {
                          if (isMobileOpen) setIsMobileOpen(false);
                        }}
                        title={isCollapsed ? item.label : ''}
                      >
                        <span className={`text-xl ${isCollapsed ? 'mx-auto' : ''}`}>{item.icon}</span>
                        {!isCollapsed && <span className="mr-3">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* زر تسجيل الخروج */}
        <div className="absolute bottom-0 right-0 left-0 p-4 border-t border-background-lighter">
          <button
            className="flex items-center w-full py-3 px-4 text-foreground-muted hover:bg-background-lighter hover:text-white rounded-lg transition-colors"
            onClick={handleLogout}
          >
            <FaSignOutAlt className="text-xl" />
            {!isCollapsed && <span className="mr-3">تسجيل الخروج</span>}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
