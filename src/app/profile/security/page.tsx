'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaShieldAlt, FaKey, FaLock, FaHistory, FaExclamationTriangle, FaCheck, FaInfoCircle } from 'react-icons/fa';
import { useAuth } from '@/contexts/AuthContext';
import { PageLoader } from '@/components/ui/Loaders';
import Card from '@/components/ui/Card';
import { getUserSecurityEvents, SecurityEvent } from '@/services/securityMonitoring';

export default function SecuritySettingsPage() {
  const router = useRouter();
  const { currentUser, userData, loading, updatePassword } = useAuth();
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  // جلب الأحداث الأمنية
  useEffect(() => {
    const fetchSecurityEvents = async () => {
      if (!currentUser) return;

      try {
        setIsLoading(true);
        const events = await getUserSecurityEvents(currentUser.uid);
        setSecurityEvents(events);
      } catch (error) {
        console.error('Error fetching security events:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchSecurityEvents();
  }, [currentUser]);

  // تغيير كلمة المرور
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // التحقق من صحة المدخلات
    if (newPassword !== confirmPassword) {
      setPasswordError('كلمات المرور غير متطابقة');
      return;
    }
    
    if (newPassword.length < 8) {
      setPasswordError('يجب أن تكون كلمة المرور 8 أحرف على الأقل');
      return;
    }
    
    try {
      setIsChangingPassword(true);
      setPasswordError('');
      setPasswordSuccess('');
      
      await updatePassword(currentPassword, newPassword);
      
      setPasswordSuccess('تم تغيير كلمة المرور بنجاح');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      if (error.code === 'auth/wrong-password') {
        setPasswordError('كلمة المرور الحالية غير صحيحة');
      } else {
        setPasswordError('حدث خطأ أثناء تغيير كلمة المرور. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  // تنسيق التاريخ
  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'غير معروف';
    
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // الحصول على أيقونة الحدث الأمني
  const getSecurityEventIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <FaExclamationTriangle className="text-error" />;
      case 'high':
        return <FaExclamationTriangle className="text-warning" />;
      case 'medium':
        return <FaInfoCircle className="text-info" />;
      case 'low':
        return <FaInfoCircle className="text-success" />;
      default:
        return <FaInfoCircle className="text-foreground-muted" />;
    }
  };

  // الحصول على لون الحدث الأمني
  const getSecurityEventColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-error/30 bg-error/5';
      case 'high':
        return 'border-warning/30 bg-warning/5';
      case 'medium':
        return 'border-info/30 bg-info/5';
      case 'low':
        return 'border-success/30 bg-success/5';
      default:
        return 'border-foreground-muted/30 bg-foreground-muted/5';
    }
  };

  // إذا كان التحميل جاريًا، اعرض شاشة التحميل
  if (loading) {
    return <PageLoader />;
  }

  // إذا لم يكن هناك مستخدم، لا تعرض شيئًا (سيتم توجيهه إلى صفحة تسجيل الدخول)
  if (!currentUser || !userData) {
    return null;
  }

  return (
    <main className="min-h-screen pt-20 pb-24">
      <div className="container mx-auto px-4">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center">
            <FaShieldAlt className="ml-2 text-primary" />
            إعدادات الأمان
          </h1>
          <p className="text-foreground-muted">إدارة إعدادات الأمان وكلمة المرور</p>
        </div>

        {/* تغيير كلمة المرور */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <FaKey className="ml-2 text-primary" />
              تغيير كلمة المرور
            </h2>
            
            <form onSubmit={handleChangePassword}>
              <div className="mb-4">
                <label htmlFor="currentPassword" className="block text-sm mb-1">
                  كلمة المرور الحالية
                </label>
                <input
                  type="password"
                  id="currentPassword"
                  className="w-full p-2 rounded-md border border-background-lighter bg-background-light"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="newPassword" className="block text-sm mb-1">
                  كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  id="newPassword"
                  className="w-full p-2 rounded-md border border-background-lighter bg-background-light"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              
              <div className="mb-4">
                <label htmlFor="confirmPassword" className="block text-sm mb-1">
                  تأكيد كلمة المرور الجديدة
                </label>
                <input
                  type="password"
                  id="confirmPassword"
                  className="w-full p-2 rounded-md border border-background-lighter bg-background-light"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={8}
                />
              </div>
              
              {passwordError && (
                <div className="mb-4 p-2 bg-error/10 text-error rounded-md text-sm">
                  {passwordError}
                </div>
              )}
              
              {passwordSuccess && (
                <div className="mb-4 p-2 bg-success/10 text-success rounded-md text-sm flex items-center">
                  <FaCheck className="ml-1" />
                  {passwordSuccess}
                </div>
              )}
              
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={isChangingPassword}
              >
                {isChangingPassword ? 'جاري تغيير كلمة المرور...' : 'تغيير كلمة المرور'}
              </button>
            </form>
          </Card>
        </motion.div>

        {/* الأحداث الأمنية */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <FaHistory className="ml-2 text-primary" />
              سجل الأحداث الأمنية
            </h2>
            
            {isLoading ? (
              <div className="text-center p-4">
                <div className="spinner"></div>
                <p className="mt-2 text-foreground-muted">جاري تحميل الأحداث الأمنية...</p>
              </div>
            ) : securityEvents.length > 0 ? (
              <div className="space-y-3">
                {securityEvents.map((event) => (
                  <div
                    key={event.id}
                    className={`p-3 border rounded-md ${getSecurityEventColor(event.severity)}`}
                  >
                    <div className="flex items-start">
                      <div className="p-2 rounded-full bg-background-lighter ml-3">
                        {getSecurityEventIcon(event.severity)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <h4 className="font-bold text-sm">{event.description}</h4>
                          <span className="text-xs text-foreground-muted">
                            {formatDate(event.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground-muted mt-1">
                          نوع الحدث: {event.type}
                        </p>
                        {event.isResolved && (
                          <p className="text-xs text-success mt-1 flex items-center">
                            <FaCheck className="ml-1" />
                            تمت المعالجة
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-4 text-foreground-muted">
                لا توجد أحداث أمنية
              </div>
            )}
          </Card>
        </motion.div>

        {/* نصائح الأمان */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Card className="p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <FaLock className="ml-2 text-primary" />
              نصائح الأمان
            </h2>
            
            <ul className="space-y-2 text-sm">
              <li className="flex items-start">
                <FaCheck className="ml-2 mt-1 text-success" />
                <span>استخدم كلمة مرور قوية تحتوي على أحرف كبيرة وصغيرة وأرقام ورموز.</span>
              </li>
              <li className="flex items-start">
                <FaCheck className="ml-2 mt-1 text-success" />
                <span>لا تشارك كلمة المرور الخاصة بك مع أي شخص.</span>
              </li>
              <li className="flex items-start">
                <FaCheck className="ml-2 mt-1 text-success" />
                <span>قم بتغيير كلمة المرور بانتظام.</span>
              </li>
              <li className="flex items-start">
                <FaCheck className="ml-2 mt-1 text-success" />
                <span>تحقق من سجل الأحداث الأمنية بانتظام للتأكد من عدم وجود نشاط مشبوه.</span>
              </li>
              <li className="flex items-start">
                <FaCheck className="ml-2 mt-1 text-success" />
                <span>لا تقم بتسجيل الدخول من أجهزة عامة أو غير موثوقة.</span>
              </li>
            </ul>
          </Card>
        </motion.div>
      </div>
    </main>
  );
}
