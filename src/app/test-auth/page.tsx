'use client';

import { useState } from 'react';
import { registerUser, loginUser } from '@/firebase/auth';

export default function TestAuth() {
  const [email, setEmail] = useState('test@example.com');
  const [password, setPassword] = useState('Test123456!');
  const [displayName, setDisplayName] = useState('مستخدم اختبار');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    setLoading(true);
    setResult('');
    try {
      const userCredential = await registerUser(email, password, displayName);
      setResult(`تم التسجيل بنجاح: ${userCredential.user.uid}`);
    } catch (error: any) {
      setResult(`خطأ في التسجيل: ${error.code} - ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    setLoading(true);
    setResult('');
    try {
      const userCredential = await loginUser(email, password);
      setResult(`تم تسجيل الدخول بنجاح: ${userCredential.user.uid}`);
    } catch (error: any) {
      setResult(`خطأ في تسجيل الدخول: ${error.code} - ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">اختبار المصادقة</h1>
      <p className="mb-4 text-red-500">هذه صفحة للاختبار فقط. استخدم هذه الصفحة لاختبار وظائف المصادقة.</p>
      <p className="mb-4">1. قم بإدخال بريد إلكتروني وكلمة مرور واسم.</p>
      <p className="mb-4">2. انقر على "تسجيل مستخدم جديد" لإنشاء حساب جديد.</p>
      <p className="mb-4">3. انقر على "تسجيل الدخول" لتسجيل الدخول باستخدام البريد الإلكتروني وكلمة المرور.</p>

      <div className="mb-4">
        <label className="block mb-2">البريد الإلكتروني:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="border p-2 w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2">كلمة المرور:</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="border p-2 w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block mb-2">الاسم:</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="border p-2 w-full"
        />
      </div>

      <div className="flex space-x-4">
        <button
          onClick={handleRegister}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          {loading ? 'جاري التنفيذ...' : 'تسجيل مستخدم جديد'}
        </button>

        <button
          onClick={handleLogin}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          {loading ? 'جاري التنفيذ...' : 'تسجيل الدخول'}
        </button>
      </div>

      {result && (
        <div className="mt-4 p-4 bg-gray-100 rounded">
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
}
