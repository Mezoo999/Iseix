'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaUserShield, FaUsers, FaUserCog, FaUserTie, FaEdit, FaInfoCircle } from 'react-icons/fa';
import { UserRole, getRoleNameInArabic } from '@/services/roles';

interface RoleCardProps {
  role: UserRole;
  count: number;
  onClick: (role: UserRole) => void;
  isSelected?: boolean;
}

export default function RoleCard({ role, count, onClick, isSelected = false }: RoleCardProps) {
  // الحصول على أيقونة الدور
  const getRoleIcon = () => {
    switch (role) {
      case UserRole.OWNER:
        return <FaUserTie className="text-2xl" />;
      case UserRole.ADMIN:
        return <FaUserShield className="text-2xl" />;
      case UserRole.MODERATOR:
        return <FaUserCog className="text-2xl" />;
      case UserRole.USER:
      default:
        return <FaUsers className="text-2xl" />;
    }
  };

  // الحصول على لون الدور
  const getRoleColor = () => {
    switch (role) {
      case UserRole.OWNER:
        return 'bg-purple-500 text-white';
      case UserRole.ADMIN:
        return 'bg-primary text-white';
      case UserRole.MODERATOR:
        return 'bg-info text-white';
      case UserRole.USER:
      default:
        return 'bg-success text-white';
    }
  };

  // الحصول على وصف الدور
  const getRoleDescription = () => {
    switch (role) {
      case UserRole.OWNER:
        return 'صلاحيات كاملة للوصول إلى جميع ميزات النظام وإدارة المشرفين';
      case UserRole.ADMIN:
        return 'صلاحيات لإدارة المستخدمين والمعاملات والمحتوى';
      case UserRole.MODERATOR:
        return 'صلاحيات محدودة لإدارة المحتوى والإشعارات';
      case UserRole.USER:
      default:
        return 'صلاحيات أساسية للوصول إلى ميزات المنصة';
    }
  };

  return (
    <motion.div
      className={`p-4 rounded-lg border ${isSelected ? 'border-primary shadow-lg' : 'border-background-lighter'} cursor-pointer transition-all`}
      whileHover={{ scale: 1.02, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
      onClick={() => onClick(role)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center">
        <div className={`p-3 rounded-full ${getRoleColor()} ml-4`}>
          {getRoleIcon()}
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-bold">{getRoleNameInArabic(role)}</h3>
          <p className="text-sm text-foreground-muted">{getRoleDescription()}</p>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{count}</div>
          <div className="text-xs text-foreground-muted">مستخدم</div>
        </div>
      </div>
      
      {isSelected && (
        <div className="mt-3 flex justify-end">
          <button className="btn btn-sm btn-primary">
            <FaEdit className="ml-1" />
            إدارة المستخدمين
          </button>
        </div>
      )}
    </motion.div>
  );
}
