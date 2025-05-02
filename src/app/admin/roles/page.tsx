'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUserShield, FaUsers, FaUserCog, FaUserTie, FaInfoCircle, FaSync } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { useAlert } from '@/contexts/AlertContext';
import AdminLayout from '@/components/admin/AdminLayout';
import { PageLoader } from '@/components/ui/Loaders';
import RoleCard from '@/components/admin/roles/RoleCard';
import UserRolesList from '@/components/admin/roles/UserRolesList';
import PermissionsTable from '@/components/admin/roles/PermissionsTable';
import { UserRole, getUserCountByRole, getUsersByRole } from '@/services/roles';
import { checkAdminAccess } from '@/services/permissions';

export default function RolesManagementPage() {
  const { currentUser, userData, loading } = useAuth();
  const { showAlert } = useAlert();
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [userCounts, setUserCounts] = useState<Record<UserRole, number>>({
    [UserRole.USER]: 0,
    [UserRole.MODERATOR]: 0,
    [UserRole.ADMIN]: 0,
    [UserRole.OWNER]: 0
  });
  const [roleUsers, setRoleUsers] = useState<any[]>([]);
  const [hasAccess, setHasAccess] = useState(false);
  
  // التحقق من صلاحيات المستخدم
  useEffect(() => {
    const checkUserAccess = async () => {
      if (!currentUser) return;
      
      try {
        const accessResult = await checkAdminAccess(currentUser.uid, 'roles');
        setHasAccess(accessResult.hasAccess);
        
        if (!accessResult.hasAccess) {
          showAlert('error', accessResult.reason || 'ليس لديك صلاحيات كافية للوصول إلى هذه الصفحة');
        }
      } catch (error) {
        console.error('خطأ في التحقق من الصلاحيات:', error);
        showAlert('error', 'حدث خطأ أثناء التحقق من الصلاحيات');
      }
    };
    
    if (!loading) {
      checkUserAccess();
    }
  }, [currentUser, loading, showAlert]);
  
  // جلب بيانات الأدوار
  useEffect(() => {
    const fetchRolesData = async () => {
      if (!currentUser || !hasAccess) return;
      
      try {
        setIsLoading(true);
        
        // جلب عدد المستخدمين حسب الدور
        const counts = await getUserCountByRole();
        setUserCounts(counts);
        
        // اختيار الدور الافتراضي (الدور الذي يحتوي على أكبر عدد من المستخدمين)
        if (!selectedRole) {
          const defaultRole = Object.entries(counts)
            .sort(([, countA], [, countB]) => countB - countA)
            .map(([role]) => role as UserRole)[0];
          
          setSelectedRole(defaultRole);
          
          // جلب المستخدمين للدور المحدد
          const users = await getUsersByRole(defaultRole);
          setRoleUsers(users);
        }
      } catch (error) {
        console.error('خطأ في جلب بيانات الأدوار:', error);
        showAlert('error', 'حدث خطأ أثناء جلب بيانات الأدوار');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRolesData();
  }, [currentUser, hasAccess, selectedRole, showAlert]);
  
  // جلب المستخدمين للدور المحدد
  useEffect(() => {
    const fetchRoleUsers = async () => {
      if (!currentUser || !hasAccess || !selectedRole) return;
      
      try {
        setIsRefreshing(true);
        
        // جلب المستخدمين للدور المحدد
        const users = await getUsersByRole(selectedRole);
        setRoleUsers(users);
      } catch (error) {
        console.error('خطأ في جلب المستخدمين للدور المحدد:', error);
        showAlert('error', 'حدث خطأ أثناء جلب المستخدمين للدور المحدد');
      } finally {
        setIsRefreshing(false);
      }
    };
    
    fetchRoleUsers();
  }, [currentUser, hasAccess, selectedRole, showAlert]);
  
  // تحديث البيانات
  const refreshData = async () => {
    if (!currentUser || !hasAccess) return;
    
    try {
      setIsRefreshing(true);
      
      // جلب عدد المستخدمين حسب الدور
      const counts = await getUserCountByRole();
      setUserCounts(counts);
      
      // جلب المستخدمين للدور المحدد
      if (selectedRole) {
        const users = await getUsersByRole(selectedRole);
        setRoleUsers(users);
      }
      
      showAlert('success', 'تم تحديث البيانات بنجاح');
    } catch (error) {
      console.error('خطأ في تحديث البيانات:', error);
      showAlert('error', 'حدث خطأ أثناء تحديث البيانات');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // اختيار دور
  const handleRoleSelect = async (role: UserRole) => {
    if (role === selectedRole) return;
    
    setSelectedRole(role);
    
    try {
      setIsRefreshing(true);
      
      // جلب المستخدمين للدور المحدد
      const users = await getUsersByRole(role);
      setRoleUsers(users);
    } catch (error) {
      console.error('خطأ في جلب المستخدمين للدور المحدد:', error);
      showAlert('error', 'حدث خطأ أثناء جلب المستخدمين للدور المحدد');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // إذا كان التحميل جاريًا، اعرض شاشة التحميل
  if (loading || isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center min-h-[60vh]">
          <PageLoader />
        </div>
      </AdminLayout>
    );
  }
  
  // إذا لم يكن لديه صلاحيات، لا تعرض شيئًا
  if (!hasAccess) {
    return (
      <AdminLayout>
        <div className="flex flex-col justify-center items-center min-h-[60vh]">
          <FaUserShield className="text-error text-5xl mb-4" />
          <h2 className="text-xl font-bold mb-2">ليس لديك صلاحيات كافية</h2>
          <p className="text-foreground-muted">ليس لديك صلاحيات كافية للوصول إلى صفحة إدارة الأدوار والصلاحيات.</p>
        </div>
      </AdminLayout>
    );
  }
  
  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold flex items-center">
            <FaUserShield className="ml-2 text-primary" />
            إدارة الأدوار والصلاحيات
          </h1>
          
          <button
            className="btn btn-primary btn-sm"
            onClick={refreshData}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <>
                <FaSync className="ml-1 animate-spin" />
                جاري التحديث...
              </>
            ) : (
              <>
                <FaSync className="ml-1" />
                تحديث البيانات
              </>
            )}
          </button>
        </div>
        
        {/* معلومات عن الأدوار */}
        <div className="mb-6 p-4 bg-background-light/30 rounded-lg border border-primary/20">
          <div className="flex items-start">
            <div className="p-2 rounded-full bg-primary/20 text-primary ml-3">
              <FaInfoCircle />
            </div>
            <div>
              <h2 className="font-bold mb-1">نظام الأدوار والصلاحيات</h2>
              <p className="text-sm text-foreground-muted">
                يتيح نظام الأدوار والصلاحيات تحديد مستويات الوصول المختلفة للمستخدمين في المنصة. يمكنك إدارة أدوار المستخدمين وعرض الصلاحيات المرتبطة بكل دور.
              </p>
            </div>
          </div>
        </div>
        
        {/* بطاقات الأدوار */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <RoleCard
            role={UserRole.USER}
            count={userCounts[UserRole.USER]}
            onClick={handleRoleSelect}
            isSelected={selectedRole === UserRole.USER}
          />
          <RoleCard
            role={UserRole.MODERATOR}
            count={userCounts[UserRole.MODERATOR]}
            onClick={handleRoleSelect}
            isSelected={selectedRole === UserRole.MODERATOR}
          />
          <RoleCard
            role={UserRole.ADMIN}
            count={userCounts[UserRole.ADMIN]}
            onClick={handleRoleSelect}
            isSelected={selectedRole === UserRole.ADMIN}
          />
          <RoleCard
            role={UserRole.OWNER}
            count={userCounts[UserRole.OWNER]}
            onClick={handleRoleSelect}
            isSelected={selectedRole === UserRole.OWNER}
          />
        </div>
        
        {/* قائمة المستخدمين حسب الدور */}
        {selectedRole && (
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <UserRolesList
              users={roleUsers}
              role={selectedRole}
              onRefresh={refreshData}
            />
          </motion.div>
        )}
        
        {/* جدول الصلاحيات */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <PermissionsTable selectedRole={selectedRole} />
        </motion.div>
      </div>
    </AdminLayout>
  );
}
