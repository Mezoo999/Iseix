'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { FaEnvelope, FaArrowLeft } from 'react-icons/fa';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ParticleBackground from '@/components/3d/ParticleBackground';
import { resetPassword } from '@/firebase/auth';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      await resetPassword(email);
      setSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      
      if (err.code === 'auth/user-not-found') {
        setError('لم يتم العثور على حساب مرتبط بهذا البريد الإلكتروني.');
      } else if (err.code === 'auth/invalid-email') {
        setError('البريد الإلكتروني غير صالح.');
      } else {
        setError('حدث خطأ أثناء إرسال رابط إعادة تعيين كلمة المرور. يرجى المحاولة مرة أخرى.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <ParticleBackground />
      <Navbar />

      <main className="pt-24 min-h-screen">
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-md mx-auto">
            <motion.div
              className="glass-effect p-8 rounded-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold mb-2">استعادة كلمة المرور</h1>
                <p className="text-foreground-muted">
                  أدخل بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور
                </p>
              </div>

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

              {success ? (
                <motion.div
                  className="bg-success/20 text-success p-4 rounded-lg mb-6"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ duration: 0.3 }}
                >
                  <p className="mb-2 font-medium">تم إرسال رابط إعادة تعيين كلمة المرور!</p>
                  <p>
                    تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني. يرجى التحقق من بريدك الإلكتروني واتباع التعليمات لإعادة تعيين كلمة المرور.
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-6">
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
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3 pr-10"
                        placeholder="أدخل بريدك الإلكتروني"
                        required
                      />
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    className="w-full bg-primary text-white py-3 rounded-lg font-medium transition-colors hover:bg-primary-dark"
                    disabled={isLoading}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        جاري الإرسال...
                      </span>
                    ) : (
                      'إرسال رابط إعادة التعيين'
                    )}
                  </motion.button>
                </form>
              )}

              <div className="text-center mt-8">
                <Link href="/login" className="text-primary hover:underline flex items-center justify-center">
                  <FaArrowLeft className="ml-2" />
                  العودة إلى تسجيل الدخول
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
