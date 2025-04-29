'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaUser, FaLock, FaGoogle, FaFacebook, FaSignInAlt } from 'react-icons/fa';

import PageTemplate from '@/components/layout/PageTemplate';
import ParticleBackground from '@/components/3d/ParticleBackground';
import { loginUser } from '@/firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import { FadeInView } from '@/components/ui/AnimatedElements';
import Card from '@/components/ui/Card';
import ActionButton from '@/components/ui/ActionButton';

export default function LoginPage() {
  const router = useRouter();
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // إذا كان المستخدم مسجل الدخول بالفعل، قم بتوجيهه إلى لوحة التحكم
  // استخدام useEffect لتجنب التوجيه أثناء التقديم
  useEffect(() => {
    if (currentUser) {
      router.push('/dashboard');
    }
  }, [currentUser, router]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // التحقق من صحة البيانات
    if (!formData.email.trim()) {
      setError('يرجى إدخال البريد الإلكتروني');
      setIsLoading(false);
      return;
    }

    if (!formData.password.trim()) {
      setError('يرجى إدخال كلمة المرور');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Submitting login form with email:', formData.email);

      // تسجيل الدخول باستخدام Firebase
      await loginUser(formData.email, formData.password);

      console.log('Login successful, redirecting to dashboard');

      // توجيه المستخدم إلى لوحة التحكم
      // استخدام setTimeout لتأخير التوجيه قليلاً للسماح بتحديث حالة المصادقة
      setTimeout(() => {
        router.push('/dashboard');
      }, 500);
    } catch (err: any) {
      console.error('Login error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);

      // رسائل خطأ مخصصة بناءً على نوع الخطأ
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setError('البريد الإلكتروني أو كلمة المرور غير صحيحة.');
      } else if (err.code === 'auth/too-many-requests') {
        setError('تم تعطيل الوصول إلى هذا الحساب مؤقتًا بسبب محاولات تسجيل دخول متكررة. يمكنك إعادة تعيين كلمة المرور أو المحاولة مرة أخرى لاحقًا.');
      } else if (err.code === 'auth/user-disabled') {
        setError('تم تعطيل هذا الحساب. يرجى الاتصال بالدعم.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('حدث خطأ في الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.');
      } else if (err.code === 'auth/invalid-email') {
        setError('البريد الإلكتروني غير صالح. يرجى التحقق من صحة البريد الإلكتروني.');
      } else {
        setError(`حدث خطأ أثناء تسجيل الدخول: ${err.message || 'خطأ غير معروف'}. يرجى المحاولة مرة أخرى.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ParticleBackground />
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full px-4">
          <FadeInView direction="up" delay={0.1}>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">تسجيل الدخول</h1>
              <p className="text-foreground-muted">مرحبًا بعودتك! يرجى تسجيل الدخول للوصول إلى حسابك.</p>
            </div>
            <Card className="glass-effect p-6">
              {error && (
                <motion.div
                  className="bg-error/20 text-error p-4 rounded-lg mb-6"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                >
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="email" className="block mb-2 font-medium">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-foreground-muted">
                      <FaUser />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3 pr-10"
                      placeholder="أدخل بريدك الإلكتروني"
                      required
                    />
                  </div>
                </div>

                <div className="mb-6">
                  <label htmlFor="password" className="block mb-2 font-medium">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-foreground-muted">
                      <FaLock />
                    </div>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3 pr-10"
                      placeholder="أدخل كلمة المرور"
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="rememberMe"
                      name="rememberMe"
                      checked={formData.rememberMe}
                      onChange={handleChange}
                      className="w-4 h-4 bg-background-light border-background-lighter rounded"
                    />
                    <label htmlFor="rememberMe" className="mr-2 text-sm">
                      تذكرني
                    </label>
                  </div>
                  <Link
                    href="/forgot-password"
                    className="text-primary text-sm hover:underline"
                  >
                    نسيت كلمة المرور؟
                  </Link>
                </div>

                <ActionButton
                  type="submit"
                  variant="primary"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      جاري تسجيل الدخول...
                    </span>
                  ) : (
                    'تسجيل الدخول'
                  )}
                </ActionButton>
              </form>

              <div className="relative flex items-center justify-center mt-8 mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-background-lighter"></div>
                </div>
                <div className="relative px-4 bg-background text-foreground-muted text-sm">
                  أو تسجيل الدخول باستخدام
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <ActionButton
                  type="button"
                  variant="secondary"
                  icon={<FaGoogle className="ml-2" />}
                >
                  جوجل
                </ActionButton>
                <ActionButton
                  type="button"
                  variant="secondary"
                  icon={<FaFacebook className="ml-2" />}
                >
                  فيسبوك
                </ActionButton>
              </div>

              <div className="text-center mt-8">
                <p className="text-foreground-muted">
                  ليس لديك حساب؟{' '}
                  <Link href="/register" className="text-primary hover:underline">
                    إنشاء حساب جديد
                  </Link>
                </p>
              </div>
            </Card>
          </FadeInView>
        </div>
      </div>
    </>
  );
}
