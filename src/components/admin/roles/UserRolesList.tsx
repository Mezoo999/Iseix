'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUserShield, FaUsers, FaUserCog, FaUserTie, FaEdit, FaTrash, FaSearch, FaFilter, FaCheck, FaTimes } from 'react-icons/fa';
import { UserRole, getRoleNameInArabic, assignUserRole } from '@/services/roles';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';

interface UserRolesListProps {
  users: any[];
  role: UserRole;
  onRefresh: () => void;
}

export default function UserRolesList({ users, role, onRefresh }: UserRolesListProps) {
  const { currentUser } = useAuth();
  const { showAlert } = useAlert();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredUsers, setFilteredUsers] = useState(users);
  const [isChangingRole, setIsChangingRole] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);

  // تصفية المستخدمين حسب البحث
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredUsers(users);
      return;
    }

    const filtered = users.filter(user =>
      user.displayName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.uid?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  // الحصول على أيقونة الدور
  const getRoleIcon = (userRole: UserRole) => {
    switch (userRole) {
      case UserRole.OWNER:
        return <FaUserTie className="text-purple-500" />;
      case UserRole.ADMIN:
        return <FaUserShield className="text-primary" />;
      case UserRole.MODERATOR:
        return <FaUserCog className="text-info" />;
      case UserRole.USER:
      default:
        return <FaUsers className="text-success" />;
    }
  };

  // تغيير دور المستخدم
  const changeUserRole = async (userId: string, newRole: UserRole) => {
    if (!currentUser) return;

    try {
      setIsChangingRole(userId);

      // التحقق من أن المستخدم لا يقوم بتغيير دوره الخاص
      if (userId === currentUser.uid) {
        showAlert('error', 'لا يمكنك تغيير دورك الخاص');
        return;
      }

      // تغيير دور المستخدم
      const success = await assignUserRole(userId, newRole, currentUser.uid);

      if (success) {
        showAlert('success', `تم تغيير دور المستخدم إلى ${getRoleNameInArabic(newRole)} بنجاح`);
        onRefresh();
      } else {
        showAlert('error', 'حدث خطأ أثناء تغيير دور المستخدم');
      }
    } catch (error) {
      console.error('خطأ في تغيير دور المستخدم:', error);
      showAlert('error', 'حدث خطأ أثناء تغيير دور المستخدم');
    } finally {
      setIsChangingRole(null);
      setSelectedRole(null);
    }
  };

  // تنسيق تاريخ آخر تسجيل دخول
  const formatLastLogin = (timestamp: any) => {
    if (!timestamp) return 'لم يسجل الدخول بعد';

    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="mt-6">
      <div className="mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <h3 className="text-lg font-bold flex items-center">
          {getRoleIcon(role)}
          <span className="mr-2">قائمة {getRoleNameInArabic(role)}ين ({filteredUsers.length})</span>
        </h3>

        <div className="relative w-full sm:w-auto">
          <input
            type="text"
            placeholder="بحث عن مستخدم..."
            className="input input-sm input-bordered pl-8 pr-3 w-full sm:w-64"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <FaSearch className="absolute right-3 top-2.5 text-foreground-muted" />
        </div>
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-8 bg-background-dark/20 rounded-lg">
          <FaUsers className="text-primary text-3xl mx-auto mb-2 opacity-50" />
          <p className="text-foreground-muted">لا يوجد مستخدمين بهذا الدور</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-background-dark/20">
              <tr>
                <th className="py-3 px-4 text-right">المستخدم</th>
                <th className="py-3 px-4 text-center">الدور</th>
                <th className="py-3 px-4 text-center">آخر تسجيل دخول</th>
                <th className="py-3 px-4 text-center">الحالة</th>
                <th className="py-3 px-4 text-left">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <motion.tr
                  key={`${user.uid}-${index}`}
                  className="border-b border-background-lighter hover:bg-background-light/50 transition-colors"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm ml-2">
                        {user.photoURL ? (
                          <img src={user.photoURL} alt={user.displayName} className="w-8 h-8 rounded-full" />
                        ) : (
                          user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'
                        )}
                      </div>
                      <div>
                        <div className="font-bold">{user.displayName || 'مستخدم بدون اسم'}</div>
                        <div className="text-xs text-foreground-muted">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                      {getRoleNameInArabic(role)}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center text-xs">
                    {formatLastLogin(user.lastLoginAt)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className={`px-2 py-1 rounded-full text-xs ${user.isActive ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                      {user.isActive ? 'نشط' : 'غير نشط'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-left">
                    {isChangingRole === user.uid ? (
                      <div className="flex items-center gap-2">
                        <select
                          className="select select-sm select-bordered"
                          value={selectedRole || ''}
                          onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                        >
                          <option value="" disabled>اختر دورًا</option>
                          <option value={UserRole.USER}>مستخدم</option>
                          <option value={UserRole.MODERATOR}>مشرف محتوى</option>
                          <option value={UserRole.ADMIN}>مشرف</option>
                          <option value={UserRole.OWNER}>مالك</option>
                        </select>
                        <button
                          className="btn btn-sm btn-circle btn-success"
                          onClick={() => selectedRole && changeUserRole(user.uid, selectedRole)}
                          disabled={!selectedRole}
                        >
                          <FaCheck />
                        </button>
                        <button
                          className="btn btn-sm btn-circle btn-error"
                          onClick={() => {
                            setIsChangingRole(null);
                            setSelectedRole(null);
                          }}
                        >
                          <FaTimes />
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => {
                            setIsChangingRole(user.uid);
                            setSelectedRole(role);
                          }}
                        >
                          <FaEdit className="ml-1" />
                          تغيير الدور
                        </button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
