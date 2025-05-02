'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaTimes, FaInfoCircle } from 'react-icons/fa';
import { Permission, UserRole, rolePermissions, getPermissionNameInArabic, getRoleNameInArabic } from '@/services/roles';

interface PermissionsTableProps {
  selectedRole?: UserRole;
}

export default function PermissionsTable({ selectedRole }: PermissionsTableProps) {
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  // تصنيف الصلاحيات حسب الفئة
  const permissionCategories = {
    'صلاحيات المستخدم': [
      Permission.VIEW_DASHBOARD,
      Permission.PERFORM_TASKS,
      Permission.WITHDRAW_FUNDS,
      Permission.DEPOSIT_FUNDS,
      Permission.REFER_USERS
    ],
    'صلاحيات مشرف المحتوى': [
      Permission.MANAGE_NOTIFICATIONS,
      Permission.VIEW_USER_PROFILES,
      Permission.RESPOND_TO_SUPPORT
    ],
    'صلاحيات المشرف': [
      Permission.MANAGE_USERS,
      Permission.MANAGE_DEPOSITS,
      Permission.MANAGE_WITHDRAWALS,
      Permission.MANAGE_TRANSACTIONS,
      Permission.MANAGE_REFERRALS,
      Permission.MANAGE_TASKS,
      Permission.MANAGE_MEMBERSHIP
    ],
    'صلاحيات المالك': [
      Permission.MANAGE_ADMINS,
      Permission.MANAGE_SETTINGS,
      Permission.VIEW_ANALYTICS,
      Permission.MANAGE_ROLES
    ]
  };

  // التحقق مما إذا كان الدور يملك الصلاحية
  const hasPermission = (role: UserRole, permission: Permission) => {
    return rolePermissions[role].includes(permission);
  };

  return (
    <div className="mt-6">
      <h3 className="text-lg font-bold mb-4 flex items-center">
        <FaInfoCircle className="ml-2 text-primary" />
        جدول الصلاحيات
      </h3>

      <div className="overflow-x-auto bg-background-light/30 rounded-lg border border-background-lighter">
        <table className="w-full text-sm">
          <thead className="bg-background-dark/20">
            <tr>
              <th className="py-3 px-4 text-right">الصلاحية</th>
              <th className="py-3 px-4 text-center">مستخدم</th>
              <th className="py-3 px-4 text-center">مشرف محتوى</th>
              <th className="py-3 px-4 text-center">مشرف</th>
              <th className="py-3 px-4 text-center">مالك</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(permissionCategories).map(([category, permissions], categoryIndex) => (
              <React.Fragment key={`category-group-${categoryIndex}`}>
                <tr
                  className="bg-background-dark/10 cursor-pointer hover:bg-background-dark/20 transition-colors"
                  onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                >
                  <td colSpan={5} className="py-2 px-4 font-bold">
                    {category} ({permissions.length})
                  </td>
                </tr>

                {expandedCategory === category && permissions.map((permission, permIndex) => (
                  <motion.tr
                    key={`perm-${category}-${permIndex}-${String(permission)}`}
                    className={`border-b border-background-lighter ${selectedRole && hasPermission(selectedRole, permission) ? 'bg-primary/5' : ''}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: permIndex * 0.03 }}
                  >
                    <td className="py-2 px-4 text-right">
                      {getPermissionNameInArabic(permission)}
                    </td>
                    <td className="py-2 px-4 text-center">
                      {hasPermission(UserRole.USER, permission) ? (
                        <FaCheck className="text-success mx-auto" />
                      ) : (
                        <FaTimes className="text-error mx-auto" />
                      )}
                    </td>
                    <td className="py-2 px-4 text-center">
                      {hasPermission(UserRole.MODERATOR, permission) ? (
                        <FaCheck className="text-success mx-auto" />
                      ) : (
                        <FaTimes className="text-error mx-auto" />
                      )}
                    </td>
                    <td className="py-2 px-4 text-center">
                      {hasPermission(UserRole.ADMIN, permission) ? (
                        <FaCheck className="text-success mx-auto" />
                      ) : (
                        <FaTimes className="text-error mx-auto" />
                      )}
                    </td>
                    <td className="py-2 px-4 text-center">
                      {hasPermission(UserRole.OWNER, permission) ? (
                        <FaCheck className="text-success mx-auto" />
                      ) : (
                        <FaTimes className="text-error mx-auto" />
                      )}
                    </td>
                  </motion.tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 p-4 bg-background-light/30 rounded-lg border border-primary/20">
        <h4 className="font-bold mb-2 flex items-center">
          <FaInfoCircle className="ml-2 text-primary" />
          معلومات عن الأدوار والصلاحيات
        </h4>
        <ul className="space-y-2 text-sm">
          <li>
            <span className="font-bold">مستخدم:</span> يمكنه الوصول إلى ميزات المنصة الأساسية مثل المهام والإيداع والسحب والإحالات.
          </li>
          <li>
            <span className="font-bold">مشرف محتوى:</span> يمكنه إدارة المحتوى والإشعارات والرد على طلبات الدعم، بالإضافة إلى صلاحيات المستخدم.
          </li>
          <li>
            <span className="font-bold">مشرف:</span> يمكنه إدارة المستخدمين والمعاملات والمهام والعضويات، بالإضافة إلى صلاحيات مشرف المحتوى.
          </li>
          <li>
            <span className="font-bold">مالك:</span> لديه صلاحيات كاملة للوصول إلى جميع ميزات النظام وإدارة المشرفين والإعدادات.
          </li>
        </ul>
      </div>
    </div>
  );
}
