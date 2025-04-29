'use client';

import { useState, useEffect } from 'react';
import { FaCog, FaSave, FaSpinner, FaGlobe, FaCoins, FaUsers, FaPercentage, FaExchangeAlt, FaWallet } from 'react-icons/fa';
import AdminLayout from '@/components/admin/AdminLayout';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useRouter } from 'next/navigation';

interface PlatformSettings {
  name: string;
  description: string;
  version: string;
  isMaintenanceMode: boolean;
  maintenanceMessage: string;
  minDepositAmount: number;
  maxDepositAmount: number;
  minWithdrawalAmount: number;
  maxWithdrawalAmount: number;
  withdrawalFeePercentage: number;
  referralCommissionPercentage: number;
  contactEmail: string;
  supportTelegram: string;
  termsUrl: string;
  privacyUrl: string;
}

export default function AdminSettings() {
  const { currentUser, userData } = useAuth();
  const router = useRouter();
  const [settings, setSettings] = useState<PlatformSettings>({
    name: 'Iseix',
    description: 'منصة Iseix للاستثمار والربح',
    version: '1.0.0',
    isMaintenanceMode: false,
    maintenanceMessage: 'المنصة تحت الصيانة حالياً، يرجى المحاولة لاحقاً.',
    minDepositAmount: 10,
    maxDepositAmount: 10000,
    minWithdrawalAmount: 10,
    maxWithdrawalAmount: 10000,
    withdrawalFeePercentage: 2,
    referralCommissionPercentage: 5,
    contactEmail: 'support@iseix.com',
    supportTelegram: '@iseix_support',
    termsUrl: '/terms',
    privacyUrl: '/privacy'
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (currentUser) {
      // التحقق من أن المستخدم هو مالك المنصة (أنت)
      if (!userData?.isOwner) {
        console.log('غير مصرح لهذا المستخدم بالوصول إلى هذه الصفحة');
        router.push('/dashboard');
      } else {
        console.log('مرحباً بك في صفحة إعدادات المنصة');
        loadSettings();
      }
    } else if (!currentUser) {
      router.push('/login');
    }
  }, [currentUser, userData, router]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      // جلب إعدادات المنصة من قاعدة البيانات
      const settingsDoc = await getDoc(doc(db, 'settings', 'platform'));
      
      if (settingsDoc.exists()) {
        const data = settingsDoc.data() as PlatformSettings;
        setSettings(data);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field: keyof PlatformSettings, value: any) => {
    setSettings({
      ...settings,
      [field]: value
    });
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      // حفظ الإعدادات في قاعدة البيانات
      await setDoc(doc(db, 'settings', 'platform'), settings);
      
      setSaveMessage('تم حفظ الإعدادات بنجاح');
      
      // إخفاء رسالة النجاح بعد 3 ثوانٍ
      setTimeout(() => {
        setSaveMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('حدث خطأ أثناء حفظ الإعدادات');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout
      title="إعدادات المنصة"
      description="تعديل إعدادات المنصة العامة."
    >
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <FaSpinner className="animate-spin text-3xl text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* إعدادات عامة */}
          <div className="bg-background-light p-6 rounded-xl shadow-sm">
            <div className="flex items-center mb-4">
              <div className="p-2 rounded-full bg-primary/10 text-primary ml-3">
                <FaGlobe />
              </div>
              <h3 className="text-xl font-bold">إعدادات عامة</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">اسم المنصة</label>
                <input
                  type="text"
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                  value={settings.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium">الإصدار</label>
                <input
                  type="text"
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                  value={settings.version}
                  onChange={(e) => handleChange('version', e.target.value)}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium">وصف المنصة</label>
                <textarea
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                  value={settings.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                />
              </div>
              
              <div className="md:col-span-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary ml-2"
                    checked={settings.isMaintenanceMode}
                    onChange={(e) => handleChange('isMaintenanceMode', e.target.checked)}
                  />
                  <label className="font-medium">وضع الصيانة</label>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <label className="block mb-2 font-medium">رسالة الصيانة</label>
                <textarea
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                  value={settings.maintenanceMessage}
                  onChange={(e) => handleChange('maintenanceMessage', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* إعدادات المالية */}
          <div className="bg-background-light p-6 rounded-xl shadow-sm">
            <div className="flex items-center mb-4">
              <div className="p-2 rounded-full bg-success/10 text-success ml-3">
                <FaCoins />
              </div>
              <h3 className="text-xl font-bold">إعدادات المالية</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">الحد الأدنى للإيداع (USDT)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                  value={settings.minDepositAmount}
                  onChange={(e) => handleChange('minDepositAmount', parseFloat(e.target.value))}
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium">الحد الأقصى للإيداع (USDT)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                  value={settings.maxDepositAmount}
                  onChange={(e) => handleChange('maxDepositAmount', parseFloat(e.target.value))}
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium">الحد الأدنى للسحب (USDT)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                  value={settings.minWithdrawalAmount}
                  onChange={(e) => handleChange('minWithdrawalAmount', parseFloat(e.target.value))}
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium">الحد الأقصى للسحب (USDT)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                  value={settings.maxWithdrawalAmount}
                  onChange={(e) => handleChange('maxWithdrawalAmount', parseFloat(e.target.value))}
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium">رسوم السحب (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                  value={settings.withdrawalFeePercentage}
                  onChange={(e) => handleChange('withdrawalFeePercentage', parseFloat(e.target.value))}
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium">عمولة الإحالة (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                  value={settings.referralCommissionPercentage}
                  onChange={(e) => handleChange('referralCommissionPercentage', parseFloat(e.target.value))}
                />
              </div>
            </div>
          </div>
          
          {/* إعدادات التواصل */}
          <div className="bg-background-light p-6 rounded-xl shadow-sm">
            <div className="flex items-center mb-4">
              <div className="p-2 rounded-full bg-info/10 text-info ml-3">
                <FaUsers />
              </div>
              <h3 className="text-xl font-bold">إعدادات التواصل</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 font-medium">البريد الإلكتروني للدعم</label>
                <input
                  type="email"
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                  value={settings.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium">حساب تيليجرام للدعم</label>
                <input
                  type="text"
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                  value={settings.supportTelegram}
                  onChange={(e) => handleChange('supportTelegram', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium">رابط شروط الاستخدام</label>
                <input
                  type="text"
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                  value={settings.termsUrl}
                  onChange={(e) => handleChange('termsUrl', e.target.value)}
                />
              </div>
              
              <div>
                <label className="block mb-2 font-medium">رابط سياسة الخصوصية</label>
                <input
                  type="text"
                  className="bg-background-light border border-background-lighter text-foreground rounded-lg block w-full p-3"
                  value={settings.privacyUrl}
                  onChange={(e) => handleChange('privacyUrl', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* زر الحفظ */}
          <div className="flex justify-end">
            <button
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors flex items-center"
              onClick={handleSaveSettings}
              disabled={isSaving}
            >
              {isSaving ? (
                <span className="flex items-center">
                  <FaSpinner className="animate-spin ml-2" />
                  جاري الحفظ...
                </span>
              ) : (
                <span className="flex items-center">
                  <FaSave className="ml-2" />
                  حفظ الإعدادات
                </span>
              )}
            </button>
          </div>
          
          {/* رسالة الحفظ */}
          {saveMessage && (
            <div className="bg-success/10 p-4 rounded-lg">
              <p className="text-success">{saveMessage}</p>
            </div>
          )}
          
          {/* ملاحظة */}
          <div className="bg-info/10 p-4 rounded-lg">
            <p className="text-info font-medium">ملاحظة</p>
            <p className="text-sm">
              تغيير بعض الإعدادات قد يتطلب إعادة تشغيل المنصة لتطبيق التغييرات.
            </p>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
