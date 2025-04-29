'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FaUserShield, FaMoneyBillWave, FaSpinner, FaCheckCircle } from 'react-icons/fa';

import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function MakeAdminPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleSetAdmin = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/admin/set-admin');
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error('Error setting admin:', error);
      setResult({
        success: false,
        message: 'حدث خطأ أثناء تعيين المستخدم كمدير'
      });
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
              تعيين مدير المنصة
            </motion.h1>
            <motion.p
              className="text-foreground-muted"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              تعيين المستخدم PAeCtT8GNoYwRTiLM1CjYL59a3J3 كمدير للمنصة وإضافة 100,000 USDT إلى حسابه
            </motion.p>
          </div>
          
          <motion.div
            className="glass-effect p-6 rounded-xl mb-8 max-w-2xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {result && (
              <div className={`${result.success ? 'bg-success/20 text-success' : 'bg-error/20 text-error'} p-4 rounded-lg mb-6 flex items-start`}>
                {result.success ? (
                  <FaCheckCircle className="mt-1 ml-2 flex-shrink-0" />
                ) : (
                  <FaSpinner className="mt-1 ml-2 flex-shrink-0" />
                )}
                <div>{result.message}</div>
              </div>
            )}
            
            <div className="space-y-6">
              <div className="bg-background-light/30 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="p-3 rounded-full bg-primary/10 ml-3">
                    <FaUserShield className="text-primary text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold">تعيين كمدير</h3>
                    <p className="text-foreground-muted text-sm">
                      سيتم تعيين المستخدم PAeCtT8GNoYwRTiLM1CjYL59a3J3 كمدير ومالك للمنصة
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-background-light/30 p-4 rounded-lg">
                <div className="flex items-center mb-3">
                  <div className="p-3 rounded-full bg-success/10 ml-3">
                    <FaMoneyBillWave className="text-success text-xl" />
                  </div>
                  <div>
                    <h3 className="font-bold">إضافة رصيد</h3>
                    <p className="text-foreground-muted text-sm">
                      سيتم إضافة 100,000 USDT إلى حساب المستخدم
                    </p>
                  </div>
                </div>
              </div>
              
              <button
                className={`btn ${isLoading ? 'btn-disabled' : 'btn-primary'} w-full py-3`}
                onClick={handleSetAdmin}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <FaSpinner className="animate-spin ml-2" />
                    جاري المعالجة...
                  </span>
                ) : (
                  <span className="flex items-center justify-center">
                    تنفيذ العملية
                  </span>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      </main>
      
      <Footer />
    </>
  );
}
