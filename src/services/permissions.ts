import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { logUserActivity } from './securityMonitoring';
import { getUserRole, hasPermission, Permission, UserRole } from './roles';

/**
 * التحقق مما إذا كان المستخدم مشرفًا
 * @param userId معرف المستخدم
 * @returns وعد يحتوي على قيمة منطقية تشير إلى ما إذا كان المستخدم مشرفًا
 */
export const isUserAdmin = async (userId: string): Promise<boolean> => {
  try {
    const userRole = await getUserRole(userId);
    return userRole?.role === UserRole.ADMIN || userRole?.role === UserRole.OWNER;
  } catch (error) {
    console.error('[permissions.ts] خطأ في التحقق من صلاحيات المشرف:', error);
    return false;
  }
};

/**
 * التحقق مما إذا كان المستخدم مالكًا
 * @param userId معرف المستخدم
 * @returns وعد يحتوي على قيمة منطقية تشير إلى ما إذا كان المستخدم مالكًا
 */
export const isUserOwner = async (userId: string): Promise<boolean> => {
  try {
    const userRole = await getUserRole(userId);
    return userRole?.role === UserRole.OWNER;
  } catch (error) {
    console.error('[permissions.ts] خطأ في التحقق من صلاحيات المالك:', error);
    return false;
  }
};

/**
 * التحقق مما إذا كان المستخدم مشرف محتوى
 * @param userId معرف المستخدم
 * @returns وعد يحتوي على قيمة منطقية تشير إلى ما إذا كان المستخدم مشرف محتوى
 */
export const isUserModerator = async (userId: string): Promise<boolean> => {
  try {
    const userRole = await getUserRole(userId);
    return userRole?.role === UserRole.MODERATOR || userRole?.role === UserRole.ADMIN || userRole?.role === UserRole.OWNER;
  } catch (error) {
    console.error('[permissions.ts] خطأ في التحقق من صلاحيات مشرف المحتوى:', error);
    return false;
  }
};

/**
 * التحقق من صلاحيات المستخدم للوصول إلى صفحة المشرف
 * @param userId معرف المستخدم
 * @param pageName اسم الصفحة (اختياري)
 * @returns وعد يحتوي على كائن يحتوي على معلومات الصلاحية
 */
export const checkAdminAccess = async (
  userId: string,
  pageName?: string
): Promise<{ hasAccess: boolean; reason?: string }> => {
  try {
    // تحديد الصلاحية المطلوبة بناءً على اسم الصفحة
    let requiredPermission: Permission;

    switch (pageName) {
      case 'users':
        requiredPermission = Permission.MANAGE_USERS;
        break;
      case 'deposits':
        requiredPermission = Permission.MANAGE_DEPOSITS;
        break;
      case 'withdrawals':
        requiredPermission = Permission.MANAGE_WITHDRAWALS;
        break;
      case 'transactions':
        requiredPermission = Permission.MANAGE_TRANSACTIONS;
        break;
      case 'referrals':
        requiredPermission = Permission.MANAGE_REFERRALS;
        break;
      case 'tasks':
        requiredPermission = Permission.MANAGE_TASKS;
        break;
      case 'membership':
        requiredPermission = Permission.MANAGE_MEMBERSHIP;
        break;
      case 'roles':
        requiredPermission = Permission.MANAGE_ROLES;
        break;
      case 'settings':
        requiredPermission = Permission.MANAGE_SETTINGS;
        break;
      case 'analytics':
        requiredPermission = Permission.VIEW_ANALYTICS;
        break;
      case 'admin_dashboard':
      default:
        // للوصول إلى لوحة المشرف، يجب أن يكون المستخدم مشرفًا على الأقل
        const isAdmin = await isUserAdmin(userId);
        const isOwner = await isUserOwner(userId);

        if (isAdmin || isOwner) {
          // تسجيل نشاط الوصول الناجح
          const metadata = {
            success: true,
            timestamp: new Date()
          };

          // إضافة اسم الصفحة إذا كان محددًا
          if (pageName) metadata.page = pageName;
          else metadata.page = 'admin';

          await logUserActivity(
            userId,
            'admin_access',
            metadata
          );

          return { hasAccess: true };
        }

        // تسجيل محاولة وصول غير مصرح بها
        const metadata = {
          success: false,
          timestamp: new Date()
        };

        // إضافة اسم الصفحة إذا كان محددًا
        if (pageName) metadata.page = pageName;
        else metadata.page = 'admin';

        await logUserActivity(
          userId,
          'unauthorized_access',
          metadata
        );

        return {
          hasAccess: false,
          reason: 'ليس لديك صلاحيات كافية للوصول إلى لوحة المشرف'
        };
    }

    // التحقق من الصلاحية المطلوبة
    const hasRequiredPermission = await hasPermission(userId, requiredPermission);

    if (hasRequiredPermission) {
      // تسجيل نشاط الوصول الناجح
      const metadata = {
        success: true,
        timestamp: new Date()
      };

      // إضافة اسم الصفحة إذا كان محددًا
      if (pageName) metadata.page = pageName;
      else metadata.page = 'admin';

      // إضافة الصلاحية المطلوبة إذا كانت محددة
      if (requiredPermission) metadata.permission = requiredPermission;

      await logUserActivity(
        userId,
        'admin_access',
        metadata
      );

      return { hasAccess: true };
    }

    // تسجيل محاولة وصول غير مصرح بها
    const metadata = {
      success: false,
      timestamp: new Date()
    };

    // إضافة اسم الصفحة إذا كان محددًا
    if (pageName) metadata.page = pageName;
    else metadata.page = 'admin';

    // إضافة الصلاحية المطلوبة إذا كانت محددة
    if (requiredPermission) metadata.permission = requiredPermission;

    await logUserActivity(
      userId,
      'unauthorized_access',
      metadata
    );

    return {
      hasAccess: false,
      reason: 'ليس لديك صلاحيات كافية للوصول إلى هذه الصفحة'
    };
  } catch (error) {
    console.error('[permissions.ts] خطأ في التحقق من صلاحيات الوصول:', error);

    return {
      hasAccess: false,
      reason: 'حدث خطأ أثناء التحقق من الصلاحيات'
    };
  }
};

/**
 * التحقق من صلاحيات المستخدم للوصول إلى وظيفة معينة
 * @param userId معرف المستخدم
 * @param functionName اسم الوظيفة
 * @returns وعد يحتوي على كائن يحتوي على معلومات الصلاحية
 */
export const checkFunctionAccess = async (
  userId: string,
  functionName: string
): Promise<{ hasAccess: boolean; reason?: string }> => {
  try {
    // تحديد الصلاحية المطلوبة بناءً على اسم الوظيفة
    let requiredPermission: Permission;

    switch (functionName) {
      case 'approveDeposit':
      case 'rejectDeposit':
        requiredPermission = Permission.MANAGE_DEPOSITS;
        break;
      case 'approveWithdrawal':
      case 'rejectWithdrawal':
        requiredPermission = Permission.MANAGE_WITHDRAWALS;
        break;
      case 'addUserBalance':
      case 'updateUserBalance':
        requiredPermission = Permission.MANAGE_USERS;
        break;
      case 'upgradeUserMembership':
        requiredPermission = Permission.MANAGE_MEMBERSHIP;
        break;
      case 'assignUserRole':
      case 'assignCustomPermissions':
        requiredPermission = Permission.MANAGE_ROLES;
        break;
      case 'updateSystemSettings':
        requiredPermission = Permission.MANAGE_SETTINGS;
        break;
      case 'createTask':
      case 'updateTask':
      case 'deleteTask':
        requiredPermission = Permission.MANAGE_TASKS;
        break;
      case 'sendNotification':
      case 'deleteNotification':
        requiredPermission = Permission.MANAGE_NOTIFICATIONS;
        break;
      default:
        // للوظائف غير المحددة، يجب أن يكون المستخدم مشرفًا على الأقل
        const isAdmin = await isUserAdmin(userId);
        const isOwner = await isUserOwner(userId);

        if (isAdmin || isOwner) {
          // تسجيل نشاط الوصول الناجح
          const metadata = {
            success: true,
            timestamp: new Date()
          };

          // إضافة اسم الوظيفة إذا كان محددًا
          if (functionName) metadata.function = functionName;

          await logUserActivity(
            userId,
            'function_access',
            metadata
          );

          return { hasAccess: true };
        }

        // تسجيل محاولة وصول غير مصرح بها
        const metadata = {
          success: false,
          timestamp: new Date()
        };

        // إضافة اسم الوظيفة إذا كان محددًا
        if (functionName) metadata.function = functionName;

        await logUserActivity(
          userId,
          'unauthorized_function',
          metadata
        );

        return {
          hasAccess: false,
          reason: 'ليس لديك صلاحيات كافية للوصول إلى هذه الوظيفة'
        };
    }

    // التحقق من الصلاحية المطلوبة
    const hasRequiredPermission = await hasPermission(userId, requiredPermission);

    if (hasRequiredPermission) {
      // تسجيل نشاط الوصول الناجح
      const metadata = {
        success: true,
        timestamp: new Date()
      };

      // إضافة اسم الوظيفة إذا كان محددًا
      if (functionName) metadata.function = functionName;

      // إضافة الصلاحية المطلوبة إذا كانت محددة
      if (requiredPermission) metadata.permission = requiredPermission;

      await logUserActivity(
        userId,
        'function_access',
        metadata
      );

      return { hasAccess: true };
    }

    // تسجيل محاولة وصول غير مصرح بها
    const metadata = {
      success: false,
      timestamp: new Date()
    };

    // إضافة اسم الوظيفة إذا كان محددًا
    if (functionName) metadata.function = functionName;

    // إضافة الصلاحية المطلوبة إذا كانت محددة
    if (requiredPermission) metadata.permission = requiredPermission;

    await logUserActivity(
      userId,
      'unauthorized_function',
      metadata
    );

    return {
      hasAccess: false,
      reason: 'ليس لديك صلاحيات كافية للوصول إلى هذه الوظيفة'
    };
  } catch (error) {
    console.error('[permissions.ts] خطأ في التحقق من صلاحيات الوظيفة:', error);

    return {
      hasAccess: false,
      reason: 'حدث خطأ أثناء التحقق من الصلاحيات'
    };
  }
};
