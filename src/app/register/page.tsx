'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaLock, FaCheck, FaGoogle, FaFacebook, FaLink, FaUserPlus } from 'react-icons/fa';

import PageTemplate from '@/components/layout/PageTemplate';
import ParticleBackground from '@/components/3d/ParticleBackground';
import { registerUser } from '@/firebase/auth';
import { useAuth } from '@/contexts/AuthContext';
import { FadeInView } from '@/components/ui/AnimatedElements';
import Card from '@/components/ui/Card';
import ActionButton from '@/components/ui/ActionButton';

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  });
  const [referralCode, setReferralCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);

  // الحصول على رمز الإحالة من معلمات البحث
  useEffect(() => {
    if (searchParams) {
      const ref = searchParams.get('ref');
      console.log('Referral code from URL:', ref);
      if (ref) {
        setReferralCode(ref);
      }
    }
  }, [searchParams]);

  // إذا كان المستخدم مسجل الدخول بالفعل، قم بتوجيهه إلى لوحة التحكم
  if (currentUser) {
    router.push('/dashboard');
    return null;
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });

    // تقييم قوة كلمة المرور
    if (name === 'password') {
      let strength = 0;
      if (value.length >= 8) strength += 1;
      if (/[A-Z]/.test(value)) strength += 1;
      if (/[0-9]/.test(value)) strength += 1;
      if (/[^A-Za-z0-9]/.test(value)) strength += 1;
      setPasswordStrength(strength);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // التحقق من صحة البيانات
    if (!formData.fullName.trim()) {
      setError('يرجى إدخال الاسم الكامل');
      setIsLoading(false);
      return;
    }

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

    // التحقق من تطابق كلمات المرور
    if (formData.password !== formData.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      setIsLoading(false);
      return;
    }

    // التحقق من قوة كلمة المرور
    if (passwordStrength < 3) {
      setError('يرجى اختيار كلمة مرور أقوى تحتوي على حرف كبير ورقم ورمز خاص');
      setIsLoading(false);
      return;
    }

    // التحقق من الموافقة على الشروط والأحكام
    if (!formData.agreeTerms) {
      setError('يرجى الموافقة على الشروط والأحكام وسياسة الخصوصية');
      setIsLoading(false);
      return;
    }

    try {
      console.log('Registering user with email:', formData.email);
      console.log('Using referral code:', referralCode || 'No referral code');

      // تسجيل المستخدم باستخدام Firebase
      const userCredential = await registerUser(formData.email, formData.password, formData.fullName, referralCode);

      console.log('Registration successful, user ID:', userCredential.user.uid);
      console.log('Registration successful, redirecting to dashboard');

      // عرض رسالة نجاح للمستخدم
      setError('');

      // توجيه المستخدم إلى لوحة التحكم
      // استخدام setTimeout لتأخير التوجيه قليلاً للسماح بتحديث حالة المصادقة
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (err) {
      console.error('Registration error:', err);
      console.error('Error code:', err.code);
      console.error('Error message:', err.message);

      // رسائل خطأ مخصصة بناءً على نوع الخطأ
      if (err.code === 'auth/email-already-in-use') {
        setError('البريد الإلكتروني مستخدم بالفعل. يرجى استخدام بريد إلكتروني آخر أو تسجيل الدخول.');
      } else if (err.code === 'auth/invalid-email') {
        setError('البريد الإلكتروني غير صالح. يرجى التحقق من صحة البريد الإلكتروني.');
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور ضعيفة جدًا. يرجى اختيار كلمة مرور أقوى.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('حدث خطأ في الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.');
      } else if (err.code === 'auth/operation-not-allowed') {
        setError('تسجيل المستخدمين غير مفعل حاليًا. يرجى الاتصال بالدعم.');
      } else {
        setError(`حدث خطأ أثناء إنشاء الحساب: ${err.message || 'خطأ غير معروف'}. يرجى المحاولة مرة أخرى.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // تحديد لون شريط قوة كلمة المرور
  const getPasswordStrengthColor = () => {
    if (passwordStrength === 0) return 'bg-background-lighter';
    if (passwordStrength === 1) return 'bg-error';
    if (passwordStrength === 2) return 'bg-warning';
    if (passwordStrength === 3) return 'bg-info';
    return 'bg-success';
  };

  // تحديد نص قوة كلمة المرور
  const getPasswordStrengthText = () => {
    if (passwordStrength === 0) return 'غير آمنة';
    if (passwordStrength === 1) return 'ضعيفة';
    if (passwordStrength === 2) return 'متوسطة';
    if (passwordStrength === 3) return 'قوية';
    return 'قوية جدًا';
  };

  return (
    <>
      <ParticleBackground />
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-md w-full px-4">
          <FadeInView direction="up" delay={0.1}>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold mb-2">إنشاء حساب جديد</h1>
              <p className="text-foreground-muted">انضم إلى منصة Iseix وابدأ رحلتك الاستثمارية</p>
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
                  <label htmlFor="fullName" className="block mb-2 font-medium">
                    الاسم الكامل
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-foreground-muted">
                      <FaUser />
                    </div>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3 pr-10"
                      placeholder="أدخل اسمك الكامل"
                      required
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <label htmlFor="email" className="block mb-2 font-medium">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-foreground-muted">
                      <FaEnvelope />
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

                <div className="mb-4">
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
                      minLength={8}
                    />
                  </div>

                  {/* مؤشر قوة كلمة المرور */}
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex justify-between mb-1">
                        <div className="text-sm text-foreground-muted">قوة كلمة المرور:</div>
                        <div className={`text-sm ${
                          passwordStrength <= 1 ? 'text-error' :
                          passwordStrength === 2 ? 'text-warning' :
                          passwordStrength === 3 ? 'text-info' : 'text-success'
                        }`}>
                          {getPasswordStrengthText()}
                        </div>
                      </div>
                      <div className="w-full h-1.5 bg-background-lighter rounded-full overflow-hidden">
                        <div
                          className={`h-full ${getPasswordStrengthColor()}`}
                          style={{ width: `${(passwordStrength / 4) * 100}%` }}
                        ></div>
                      </div>
                      <div className="mt-1 text-xs text-foreground-muted">
                        كلمة المرور يجب أن تحتوي على 8 أحرف على الأقل، حرف كبير، رقم، ورمز خاص.
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-6">
                  <label htmlFor="confirmPassword" className="block mb-2 font-medium">
                    تأكيد كلمة المرور
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-foreground-muted">
                      <FaCheck />
                    </div>
                    <input
                      type="password"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3 pr-10"
                      placeholder="أعد إدخال كلمة المرور"
                      required
                    />
                  </div>
                </div>

                {/* حقل رمز الإحالة */}
                <div className="mb-6">
                  <label htmlFor="referralCode" className="block mb-2 font-medium">
                    رمز الإحالة <span className="text-foreground-muted text-sm">(اختياري)</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-foreground-muted">
                      <FaLink />
                    </div>
                    <input
                      type="text"
                      id="referralCode"
                      name="referralCode"
                      value={referralCode}
                      onChange={(e) => setReferralCode(e.target.value)}
                      className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3 pr-10"
                      placeholder="أدخل رمز الإحالة إذا كان لديك"
                    />
                  </div>
                  <p className="mt-1 text-xs text-foreground-muted">
                    إذا تمت دعوتك من قبل صديق، أدخل رمز الإحالة الخاص به للحصول على مكافآت إضافية
                  </p>
                </div>

                {/* رمز الإحالة المكتشف تلقائيًا */}
                {referralCode && (
                  <div className="mb-6">
                    <div className="bg-success/10 p-4 rounded-lg flex items-start">
                      <FaLink className="text-success mt-1 ml-2 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-success">تمت دعوتك بواسطة رمز إحالة</p>
                        <p className="text-sm text-foreground-muted">
                          ستحصل أنت والشخص الذي دعاك على مكافآت عند الإيداع
                        </p>
                        <div className="mt-2 bg-background-light p-2 rounded text-sm">
                          <span className="text-foreground-muted">رمز الإحالة: </span>
                          <span className="font-mono">{referralCode}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div className="flex items-center mb-6">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    className="w-4 h-4 bg-background-light border-background-lighter rounded"
                    required
                  />
                  <label htmlFor="agreeTerms" className="mr-2 text-sm">
                    أوافق على{' '}
                    <Link href="/terms" className="text-primary hover:underline">
                      الشروط والأحكام
                    </Link>{' '}
                    و{' '}
                    <Link href="/privacy" className="text-primary hover:underline">
                      سياسة الخصوصية
                    </Link>
                  </label>
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
                      جاري إنشاء الحساب...
                    </span>
                  ) : (
                    'إنشاء حساب'
                  )}
                </ActionButton>
              </form>

              <div className="relative flex items-center justify-center mt-8 mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-background-lighter"></div>
                </div>
                <div className="relative px-4 bg-background text-foreground-muted text-sm">
                  أو التسجيل باستخدام
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
                  لديك حساب بالفعل؟{' '}
                  <Link href="/login" className="text-primary hover:underline">
                    تسجيل الدخول
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

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    }>
      <RegisterPageContent />
    </Suspense>
  );
}
