'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FaUser, FaEnvelope, FaLock, FaCamera, FaShieldAlt, FaIdCard } from 'react-icons/fa';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { updateUserProfile, updateUserPassword } from '@/firebase/auth';
import { uploadProfileImage } from '@/firebase/storage';

export default function ProfilePage() {
  const router = useRouter();
  const { currentUser, userData, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('personal');
  
  // حالة النموذج الشخصي
  const [personalForm, setPersonalForm] = useState({
    displayName: '',
    email: '',
    phoneNumber: '',
  });
  
  // حالة نموذج كلمة المرور
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  
  // حالة الصورة
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  
  // حالة التحميل والخطأ
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // تحميل بيانات المستخدم
  useEffect(() => {
    if (userData) {
      setPersonalForm({
        displayName: userData.displayName || '',
        email: userData.email || '',
        phoneNumber: userData.phoneNumber || '',
      });
    }
  }, [userData]);

  // التحقق من تسجيل الدخول
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }
  }, [currentUser, loading, router]);

  // إذا كان التحميل جاريًا، اعرض شاشة التحميل
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // إذا لم يكن هناك مستخدم، لا تعرض شيئًا (سيتم توجيهه إلى صفحة تسجيل الدخول)
  if (!currentUser || !userData) {
    return null;
  }
  
  // معالج تغيير النموذج الشخصي
  const handlePersonalChange = (e) => {
    const { name, value } = e.target;
    setPersonalForm({
      ...personalForm,
      [name]: value,
    });
  };
  
  // معالج تغيير نموذج كلمة المرور
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm({
      ...passwordForm,
      [name]: value,
    });
  };
  
  // معالج تغيير الصورة
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // معالج تحديث البيانات الشخصية
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    try {
      // تحديث البيانات الشخصية
      await updateUserProfile(personalForm);
      
      // تحديث صورة الملف الشخصي إذا تم تحديدها
      if (profileImage) {
        await uploadProfileImage(currentUser.uid, profileImage);
      }
      
      setSuccess('تم تحديث البيانات الشخصية بنجاح');
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('حدث خطأ أثناء تحديث البيانات الشخصية');
    } finally {
      setIsLoading(false);
    }
  };
  
  // معالج تحديث كلمة المرور
  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess('');
    
    // التحقق من تطابق كلمات المرور
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('كلمات المرور غير متطابقة');
      setIsLoading(false);
      return;
    }
    
    try {
      // تحديث كلمة المرور
      await updateUserPassword(passwordForm.currentPassword, passwordForm.newPassword);
      
      // إعادة تعيين النموذج
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      
      setSuccess('تم تحديث كلمة المرور بنجاح');
    } catch (err) {
      console.error('Error updating password:', err);
      
      if (err.code === 'auth/wrong-password') {
        setError('كلمة المرور الحالية غير صحيحة');
      } else if (err.code === 'auth/weak-password') {
        setError('كلمة المرور الجديدة ضعيفة جدًا');
      } else {
        setError('حدث خطأ أثناء تحديث كلمة المرور');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      
      <main className="pt-24 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <motion.h1
              className="text-3xl font-bold mb-2"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              الملف الشخصي
            </motion.h1>
            <motion.p
              className="text-foreground-muted"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              إدارة معلوماتك الشخصية وإعدادات الحساب
            </motion.p>
          </div>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* القائمة الجانبية */}
            <motion.div
              className="md:w-1/4"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="glass-effect p-6 rounded-xl">
                <div className="flex flex-col items-center mb-6">
                  <div className="w-24 h-24 rounded-full overflow-hidden mb-4 bg-background-light">
                    {imagePreview ? (
                      <img src={imagePreview} alt="صورة الملف الشخصي" className="w-full h-full object-cover" />
                    ) : (
                      userData.photoURL ? (
                        <img src={userData.photoURL} alt="صورة الملف الشخصي" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                          <FaUser size={32} />
                        </div>
                      )
                    )}
                  </div>
                  <h3 className="text-lg font-bold">{userData.displayName}</h3>
                  <p className="text-foreground-muted text-sm">{userData.email}</p>
                </div>
                
                <ul className="space-y-2">
                  <li>
                    <button
                      className={`w-full text-right py-2 px-4 rounded-lg transition-colors ${
                        activeTab === 'personal'
                          ? 'bg-primary text-white'
                          : 'hover:bg-background-light'
                      }`}
                      onClick={() => setActiveTab('personal')}
                    >
                      <FaUser className="inline ml-2" />
                      المعلومات الشخصية
                    </button>
                  </li>
                  <li>
                    <button
                      className={`w-full text-right py-2 px-4 rounded-lg transition-colors ${
                        activeTab === 'security'
                          ? 'bg-primary text-white'
                          : 'hover:bg-background-light'
                      }`}
                      onClick={() => setActiveTab('security')}
                    >
                      <FaLock className="inline ml-2" />
                      الأمان
                    </button>
                  </li>
                  <li>
                    <button
                      className={`w-full text-right py-2 px-4 rounded-lg transition-colors ${
                        activeTab === 'verification'
                          ? 'bg-primary text-white'
                          : 'hover:bg-background-light'
                      }`}
                      onClick={() => setActiveTab('verification')}
                    >
                      <FaIdCard className="inline ml-2" />
                      التحقق من الهوية
                    </button>
                  </li>
                </ul>
              </div>
            </motion.div>
            
            {/* المحتوى الرئيسي */}
            <motion.div
              className="md:w-3/4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="glass-effect p-6 rounded-xl">
                {/* رسائل النجاح والخطأ */}
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
                
                {success && (
                  <motion.div
                    className="bg-success/20 text-success p-4 rounded-lg mb-6"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    transition={{ duration: 0.3 }}
                  >
                    {success}
                  </motion.div>
                )}
                
                {/* المعلومات الشخصية */}
                {activeTab === 'personal' && (
                  <div>
                    <h2 className="text-xl font-bold mb-6">المعلومات الشخصية</h2>
                    
                    <form onSubmit={handleUpdateProfile}>
                      <div className="mb-6">
                        <label htmlFor="profileImage" className="block mb-2 font-medium">
                          صورة الملف الشخصي
                        </label>
                        <div className="flex items-center">
                          <div className="w-20 h-20 rounded-full overflow-hidden bg-background-light mr-4">
                            {imagePreview ? (
                              <img src={imagePreview} alt="صورة الملف الشخصي" className="w-full h-full object-cover" />
                            ) : (
                              userData.photoURL ? (
                                <img src={userData.photoURL} alt="صورة الملف الشخصي" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary">
                                  <FaUser size={24} />
                                </div>
                              )
                            )}
                          </div>
                          <div>
                            <label className="btn btn-outline flex items-center cursor-pointer">
                              <FaCamera className="ml-2" />
                              تغيير الصورة
                              <input
                                type="file"
                                id="profileImage"
                                accept="image/*"
                                className="hidden"
                                onChange={handleImageChange}
                              />
                            </label>
                            <p className="text-sm text-foreground-muted mt-2">
                              يجب أن تكون الصورة بصيغة JPG أو PNG وحجم أقصى 2MB
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label htmlFor="displayName" className="block mb-2 font-medium">
                          الاسم الكامل
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-foreground-muted">
                            <FaUser />
                          </div>
                          <input
                            type="text"
                            id="displayName"
                            name="displayName"
                            value={personalForm.displayName}
                            onChange={handlePersonalChange}
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
                            value={personalForm.email}
                            onChange={handlePersonalChange}
                            className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3 pr-10"
                            placeholder="أدخل بريدك الإلكتروني"
                            disabled
                          />
                        </div>
                        <p className="text-sm text-foreground-muted mt-1">
                          لا يمكن تغيير البريد الإلكتروني بعد إنشاء الحساب
                        </p>
                      </div>
                      
                      <div className="mb-6">
                        <label htmlFor="phoneNumber" className="block mb-2 font-medium">
                          رقم الهاتف
                        </label>
                        <div className="relative">
                          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-foreground-muted">
                            <FaUser />
                          </div>
                          <input
                            type="tel"
                            id="phoneNumber"
                            name="phoneNumber"
                            value={personalForm.phoneNumber}
                            onChange={handlePersonalChange}
                            className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3 pr-10"
                            placeholder="أدخل رقم هاتفك"
                          />
                        </div>
                      </div>
                      
                      <motion.button
                        type="submit"
                        className="btn btn-primary"
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
                            جاري الحفظ...
                          </span>
                        ) : (
                          'حفظ التغييرات'
                        )}
                      </motion.button>
                    </form>
                  </div>
                )}
                
                {/* الأمان */}
                {activeTab === 'security' && (
                  <div>
                    <h2 className="text-xl font-bold mb-6">إعدادات الأمان</h2>
                    
                    <div className="mb-8">
                      <h3 className="text-lg font-medium mb-4">تغيير كلمة المرور</h3>
                      
                      <form onSubmit={handleUpdatePassword}>
                        <div className="mb-4">
                          <label htmlFor="currentPassword" className="block mb-2 font-medium">
                            كلمة المرور الحالية
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-foreground-muted">
                              <FaLock />
                            </div>
                            <input
                              type="password"
                              id="currentPassword"
                              name="currentPassword"
                              value={passwordForm.currentPassword}
                              onChange={handlePasswordChange}
                              className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3 pr-10"
                              placeholder="أدخل كلمة المرور الحالية"
                              required
                            />
                          </div>
                        </div>
                        
                        <div className="mb-4">
                          <label htmlFor="newPassword" className="block mb-2 font-medium">
                            كلمة المرور الجديدة
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-foreground-muted">
                              <FaLock />
                            </div>
                            <input
                              type="password"
                              id="newPassword"
                              name="newPassword"
                              value={passwordForm.newPassword}
                              onChange={handlePasswordChange}
                              className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3 pr-10"
                              placeholder="أدخل كلمة المرور الجديدة"
                              required
                              minLength={8}
                            />
                          </div>
                          <p className="text-sm text-foreground-muted mt-1">
                            يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل، وتتضمن حرفًا كبيرًا، ورقمًا، ورمزًا خاصًا
                          </p>
                        </div>
                        
                        <div className="mb-6">
                          <label htmlFor="confirmPassword" className="block mb-2 font-medium">
                            تأكيد كلمة المرور الجديدة
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-foreground-muted">
                              <FaLock />
                            </div>
                            <input
                              type="password"
                              id="confirmPassword"
                              name="confirmPassword"
                              value={passwordForm.confirmPassword}
                              onChange={handlePasswordChange}
                              className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3 pr-10"
                              placeholder="أعد إدخال كلمة المرور الجديدة"
                              required
                            />
                          </div>
                        </div>
                        
                        <motion.button
                          type="submit"
                          className="btn btn-primary"
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
                              جاري التحديث...
                            </span>
                          ) : (
                            'تحديث كلمة المرور'
                          )}
                        </motion.button>
                      </form>
                    </div>
                    
                    <div className="mb-8">
                      <h3 className="text-lg font-medium mb-4">المصادقة الثنائية</h3>
                      
                      <div className="bg-warning/10 p-4 rounded-lg mb-4">
                        <p className="text-warning">
                          المصادقة الثنائية غير مفعلة حاليًا. نوصي بتفعيلها لزيادة أمان حسابك.
                        </p>
                      </div>
                      
                      <motion.button
                        className="btn btn-outline"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => alert('سيتم إضافة هذه الميزة قريبًا')}
                      >
                        <FaShieldAlt className="ml-2" />
                        تفعيل المصادقة الثنائية
                      </motion.button>
                    </div>
                  </div>
                )}
                
                {/* التحقق من الهوية */}
                {activeTab === 'verification' && (
                  <div>
                    <h2 className="text-xl font-bold mb-6">التحقق من الهوية</h2>
                    
                    <div className="bg-info/10 p-4 rounded-lg mb-6">
                      <p className="text-info">
                        التحقق من هويتك يساعدنا على حماية حسابك ويتيح لك الوصول إلى جميع ميزات المنصة.
                      </p>
                    </div>
                    
                    <div className="mb-8">
                      <h3 className="text-lg font-medium mb-4">حالة التحقق</h3>
                      
                      <div className="bg-warning/10 p-4 rounded-lg mb-4">
                        <p className="text-warning flex items-center">
                          <FaIdCard className="ml-2" />
                          لم يتم التحقق من هويتك بعد
                        </p>
                      </div>
                      
                      <motion.button
                        className="btn btn-primary"
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => alert('سيتم إضافة هذه الميزة قريبًا')}
                      >
                        بدء عملية التحقق
                      </motion.button>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}
