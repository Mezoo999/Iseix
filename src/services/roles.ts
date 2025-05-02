import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { logUserActivity } from './securityMonitoring';

// تعريف الأدوار المتاحة في النظام
export enum UserRole {
  USER = 'user',           // مستخدم عادي
  MODERATOR = 'moderator', // مشرف محتوى
  ADMIN = 'admin',         // مشرف
  OWNER = 'owner'          // مالك
}

// تعريف الصلاحيات المتاحة في النظام
export enum Permission {
  // صلاحيات المستخدم العادي
  VIEW_DASHBOARD = 'view_dashboard',
  PERFORM_TASKS = 'perform_tasks',
  WITHDRAW_FUNDS = 'withdraw_funds',
  DEPOSIT_FUNDS = 'deposit_funds',
  REFER_USERS = 'refer_users',
  
  // صلاحيات المشرف المحتوى
  MANAGE_NOTIFICATIONS = 'manage_notifications',
  VIEW_USER_PROFILES = 'view_user_profiles',
  RESPOND_TO_SUPPORT = 'respond_to_support',
  
  // صلاحيات المشرف
  MANAGE_USERS = 'manage_users',
  MANAGE_DEPOSITS = 'manage_deposits',
  MANAGE_WITHDRAWALS = 'manage_withdrawals',
  MANAGE_TRANSACTIONS = 'manage_transactions',
  MANAGE_REFERRALS = 'manage_referrals',
  MANAGE_TASKS = 'manage_tasks',
  MANAGE_MEMBERSHIP = 'manage_membership',
  
  // صلاحيات المالك
  MANAGE_ADMINS = 'manage_admins',
  MANAGE_SETTINGS = 'manage_settings',
  VIEW_ANALYTICS = 'view_analytics',
  MANAGE_ROLES = 'manage_roles'
}

// تعريف الصلاحيات لكل دور
export const rolePermissions: Record<UserRole, Permission[]> = {
  [UserRole.USER]: [
    Permission.VIEW_DASHBOARD,
    Permission.PERFORM_TASKS,
    Permission.WITHDRAW_FUNDS,
    Permission.DEPOSIT_FUNDS,
    Permission.REFER_USERS
  ],
  [UserRole.MODERATOR]: [
    // صلاحيات المستخدم العادي
    Permission.VIEW_DASHBOARD,
    Permission.PERFORM_TASKS,
    Permission.WITHDRAW_FUNDS,
    Permission.DEPOSIT_FUNDS,
    Permission.REFER_USERS,
    
    // صلاحيات إضافية للمشرف المحتوى
    Permission.MANAGE_NOTIFICATIONS,
    Permission.VIEW_USER_PROFILES,
    Permission.RESPOND_TO_SUPPORT
  ],
  [UserRole.ADMIN]: [
    // صلاحيات المشرف المحتوى
    Permission.VIEW_DASHBOARD,
    Permission.PERFORM_TASKS,
    Permission.WITHDRAW_FUNDS,
    Permission.DEPOSIT_FUNDS,
    Permission.REFER_USERS,
    Permission.MANAGE_NOTIFICATIONS,
    Permission.VIEW_USER_PROFILES,
    Permission.RESPOND_TO_SUPPORT,
    
    // صلاحيات إضافية للمشرف
    Permission.MANAGE_USERS,
    Permission.MANAGE_DEPOSITS,
    Permission.MANAGE_WITHDRAWALS,
    Permission.MANAGE_TRANSACTIONS,
    Permission.MANAGE_REFERRALS,
    Permission.MANAGE_TASKS,
    Permission.MANAGE_MEMBERSHIP
  ],
  [UserRole.OWNER]: [
    // جميع الصلاحيات
    ...Object.values(Permission)
  ]
};

// واجهة بيانات الدور
export interface UserRoleData {
  role: UserRole;
  customPermissions?: Permission[];
  assignedBy?: string;
  assignedAt?: Date;
}

/**
 * الحصول على دور المستخدم
 * @param userId معرف المستخدم
 * @returns وعد يحتوي على دور المستخدم
 */
export const getUserRole = async (userId: string): Promise<UserRoleData | null> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return null;
    }
    
    const userData = userDoc.data();
    
    // التحقق من الدور بناءً على البيانات الحالية
    if (userData.isOwner) {
      return { role: UserRole.OWNER };
    } else if (userData.isAdmin) {
      return { role: UserRole.ADMIN };
    } else if (userData.isModerator) {
      return { role: UserRole.MODERATOR };
    } else {
      return { role: UserRole.USER };
    }
  } catch (error) {
    console.error('[roles.ts] خطأ في الحصول على دور المستخدم:', error);
    return null;
  }
};

/**
 * التحقق مما إذا كان المستخدم لديه صلاحية معينة
 * @param userId معرف المستخدم
 * @param permission الصلاحية المطلوبة
 * @returns وعد يحتوي على قيمة منطقية تشير إلى ما إذا كان المستخدم لديه الصلاحية
 */
export const hasPermission = async (userId: string, permission: Permission): Promise<boolean> => {
  try {
    const userRole = await getUserRole(userId);
    
    if (!userRole) {
      return false;
    }
    
    // التحقق من الصلاحيات المخصصة أولاً إذا كانت موجودة
    if (userRole.customPermissions && userRole.customPermissions.includes(permission)) {
      return true;
    }
    
    // التحقق من الصلاحيات المرتبطة بالدور
    return rolePermissions[userRole.role].includes(permission);
  } catch (error) {
    console.error('[roles.ts] خطأ في التحقق من صلاحية المستخدم:', error);
    return false;
  }
};

/**
 * تعيين دور للمستخدم
 * @param userId معرف المستخدم
 * @param role الدور الجديد
 * @param adminId معرف المشرف الذي قام بالتعيين
 * @returns وعد يشير إلى نجاح العملية
 */
export const assignUserRole = async (
  userId: string,
  role: UserRole,
  adminId: string
): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return false;
    }
    
    // تحديث بيانات المستخدم بناءً على الدور الجديد
    const updates: Record<string, any> = {
      isOwner: role === UserRole.OWNER,
      isAdmin: role === UserRole.ADMIN || role === UserRole.OWNER,
      isModerator: role === UserRole.MODERATOR || role === UserRole.ADMIN || role === UserRole.OWNER,
      roleUpdatedAt: new Date(),
      roleUpdatedBy: adminId,
      role: role
    };
    
    await updateDoc(userRef, updates);
    
    // تسجيل النشاط
    await logUserActivity(
      adminId,
      'role_assignment',
      {
        targetUserId: userId,
        role: role,
        timestamp: new Date()
      }
    );
    
    return true;
  } catch (error) {
    console.error('[roles.ts] خطأ في تعيين دور للمستخدم:', error);
    return false;
  }
};

/**
 * تعيين صلاحيات مخصصة للمستخدم
 * @param userId معرف المستخدم
 * @param permissions الصلاحيات المخصصة
 * @param adminId معرف المشرف الذي قام بالتعيين
 * @returns وعد يشير إلى نجاح العملية
 */
export const assignCustomPermissions = async (
  userId: string,
  permissions: Permission[],
  adminId: string
): Promise<boolean> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return false;
    }
    
    // تحديث الصلاحيات المخصصة
    await updateDoc(userRef, {
      customPermissions: permissions,
      permissionsUpdatedAt: new Date(),
      permissionsUpdatedBy: adminId
    });
    
    // تسجيل النشاط
    await logUserActivity(
      adminId,
      'custom_permissions_assignment',
      {
        targetUserId: userId,
        permissions: permissions,
        timestamp: new Date()
      }
    );
    
    return true;
  } catch (error) {
    console.error('[roles.ts] خطأ في تعيين صلاحيات مخصصة للمستخدم:', error);
    return false;
  }
};

/**
 * الحصول على قائمة المستخدمين حسب الدور
 * @param role الدور المطلوب
 * @returns وعد يحتوي على قائمة المستخدمين
 */
export const getUsersByRole = async (role: UserRole): Promise<any[]> => {
  try {
    let usersQuery;
    
    switch (role) {
      case UserRole.OWNER:
        usersQuery = query(collection(db, 'users'), where('isOwner', '==', true));
        break;
      case UserRole.ADMIN:
        usersQuery = query(
          collection(db, 'users'),
          where('isAdmin', '==', true),
          where('isOwner', '==', false)
        );
        break;
      case UserRole.MODERATOR:
        usersQuery = query(
          collection(db, 'users'),
          where('isModerator', '==', true),
          where('isAdmin', '==', false),
          where('isOwner', '==', false)
        );
        break;
      case UserRole.USER:
      default:
        usersQuery = query(
          collection(db, 'users'),
          where('isModerator', '==', false),
          where('isAdmin', '==', false),
          where('isOwner', '==', false)
        );
        break;
    }
    
    const usersSnapshot = await getDocs(usersQuery);
    const users: any[] = [];
    
    usersSnapshot.forEach(doc => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        ...userData
      });
    });
    
    return users;
  } catch (error) {
    console.error('[roles.ts] خطأ في الحصول على قائمة المستخدمين حسب الدور:', error);
    return [];
  }
};

/**
 * الحصول على عدد المستخدمين حسب الدور
 * @returns وعد يحتوي على عدد المستخدمين لكل دور
 */
export const getUserCountByRole = async (): Promise<Record<UserRole, number>> => {
  try {
    const counts: Record<UserRole, number> = {
      [UserRole.USER]: 0,
      [UserRole.MODERATOR]: 0,
      [UserRole.ADMIN]: 0,
      [UserRole.OWNER]: 0
    };
    
    // الحصول على عدد المالكين
    const ownersQuery = query(collection(db, 'users'), where('isOwner', '==', true));
    const ownersSnapshot = await getDocs(ownersQuery);
    counts[UserRole.OWNER] = ownersSnapshot.size;
    
    // الحصول على عدد المشرفين
    const adminsQuery = query(
      collection(db, 'users'),
      where('isAdmin', '==', true),
      where('isOwner', '==', false)
    );
    const adminsSnapshot = await getDocs(adminsQuery);
    counts[UserRole.ADMIN] = adminsSnapshot.size;
    
    // الحصول على عدد مشرفي المحتوى
    const moderatorsQuery = query(
      collection(db, 'users'),
      where('isModerator', '==', true),
      where('isAdmin', '==', false),
      where('isOwner', '==', false)
    );
    const moderatorsSnapshot = await getDocs(moderatorsQuery);
    counts[UserRole.MODERATOR] = moderatorsSnapshot.size;
    
    // الحصول على عدد المستخدمين العاديين
    const usersQuery = query(
      collection(db, 'users'),
      where('isModerator', '==', false),
      where('isAdmin', '==', false),
      where('isOwner', '==', false)
    );
    const usersSnapshot = await getDocs(usersQuery);
    counts[UserRole.USER] = usersSnapshot.size;
    
    return counts;
  } catch (error) {
    console.error('[roles.ts] خطأ في الحصول على عدد المستخدمين حسب الدور:', error);
    return {
      [UserRole.USER]: 0,
      [UserRole.MODERATOR]: 0,
      [UserRole.ADMIN]: 0,
      [UserRole.OWNER]: 0
    };
  }
};

/**
 * الحصول على اسم الدور بالعربية
 * @param role الدور
 * @returns اسم الدور بالعربية
 */
export const getRoleNameInArabic = (role: UserRole): string => {
  switch (role) {
    case UserRole.OWNER:
      return 'مالك';
    case UserRole.ADMIN:
      return 'مشرف';
    case UserRole.MODERATOR:
      return 'مشرف محتوى';
    case UserRole.USER:
    default:
      return 'مستخدم';
  }
};

/**
 * الحصول على اسم الصلاحية بالعربية
 * @param permission الصلاحية
 * @returns اسم الصلاحية بالعربية
 */
export const getPermissionNameInArabic = (permission: Permission): string => {
  const permissionNames: Record<Permission, string> = {
    [Permission.VIEW_DASHBOARD]: 'عرض لوحة التحكم',
    [Permission.PERFORM_TASKS]: 'تنفيذ المهام',
    [Permission.WITHDRAW_FUNDS]: 'سحب الأموال',
    [Permission.DEPOSIT_FUNDS]: 'إيداع الأموال',
    [Permission.REFER_USERS]: 'دعوة المستخدمين',
    
    [Permission.MANAGE_NOTIFICATIONS]: 'إدارة الإشعارات',
    [Permission.VIEW_USER_PROFILES]: 'عرض ملفات المستخدمين',
    [Permission.RESPOND_TO_SUPPORT]: 'الرد على طلبات الدعم',
    
    [Permission.MANAGE_USERS]: 'إدارة المستخدمين',
    [Permission.MANAGE_DEPOSITS]: 'إدارة الإيداعات',
    [Permission.MANAGE_WITHDRAWALS]: 'إدارة السحوبات',
    [Permission.MANAGE_TRANSACTIONS]: 'إدارة المعاملات',
    [Permission.MANAGE_REFERRALS]: 'إدارة الإحالات',
    [Permission.MANAGE_TASKS]: 'إدارة المهام',
    [Permission.MANAGE_MEMBERSHIP]: 'إدارة العضويات',
    
    [Permission.MANAGE_ADMINS]: 'إدارة المشرفين',
    [Permission.MANAGE_SETTINGS]: 'إدارة الإعدادات',
    [Permission.VIEW_ANALYTICS]: 'عرض التحليلات',
    [Permission.MANAGE_ROLES]: 'إدارة الأدوار'
  };
  
  return permissionNames[permission] || permission;
};
