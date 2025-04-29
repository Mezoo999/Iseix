'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaHistory, FaCalendarAlt, FaCoins, FaChevronDown, FaChevronUp, FaSearch } from 'react-icons/fa';

interface TaskReward {
  id: string;
  amount: number;
  currency: string;
  timestamp: Date;
  taskId?: string;
  taskTitle?: string;
}

interface TaskRewardsHistoryProps {
  rewards: TaskReward[];
  isLoading: boolean;
}

export default function TaskRewardsHistory({ rewards, isLoading }: TaskRewardsHistoryProps) {
  const [expanded, setExpanded] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // تنسيق التاريخ
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // تصفية المكافآت حسب البحث
  const filteredRewards = rewards.filter(reward => 
    reward.taskTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    formatDate(reward.timestamp).includes(searchTerm)
  );

  // تقسيم المكافآت إلى صفحات
  const totalPages = Math.ceil(filteredRewards.length / itemsPerPage);
  const paginatedRewards = filteredRewards.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // حساب إجمالي المكافآت
  const totalRewards = rewards.reduce((total, reward) => total + reward.amount, 0);

  // التنقل بين الصفحات
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <motion.div
      className="card card-primary"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div 
        className="flex items-center justify-between mb-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center">
          <div className="p-3 rounded-full bg-primary/20 text-primary ml-3">
            <FaHistory className="text-xl" />
          </div>
          <div>
            <h3 className="text-lg font-bold">سجل المكافآت</h3>
            <p className="text-sm text-foreground-muted">تاريخ المكافآت التي حصلت عليها</p>
          </div>
        </div>
        <div className="flex items-center">
          <div className="ml-4 text-center">
            <p className="text-sm text-foreground-muted">إجمالي المكافآت</p>
            <p className="font-bold text-success">{totalRewards.toFixed(2)} USDT</p>
          </div>
          <button className="p-2 rounded-full bg-background-light/30 hover:bg-background-light/50 transition-colors">
            {expanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* بحث */}
            {rewards.length > 0 && (
              <div className="mb-4 relative">
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                  <FaSearch className="text-foreground-muted" />
                </div>
                <input
                  type="text"
                  className="form-input pr-10"
                  placeholder="بحث في سجل المكافآت..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            )}

            {/* قائمة المكافآت */}
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-foreground-muted">جاري تحميل سجل المكافآت...</p>
              </div>
            ) : rewards.length === 0 ? (
              <div className="text-center py-8 bg-background-light/30 rounded-lg">
                <FaCoins className="text-4xl mx-auto mb-4 text-foreground-muted opacity-50" />
                <p className="text-foreground-muted font-medium">لم تحصل على أي مكافآت بعد</p>
                <p className="text-sm text-foreground-muted mt-2">أكمل المهام اليومية للحصول على مكافآت</p>
              </div>
            ) : filteredRewards.length === 0 ? (
              <div className="text-center py-8 bg-background-light/30 rounded-lg">
                <FaSearch className="text-4xl mx-auto mb-4 text-foreground-muted opacity-50" />
                <p className="text-foreground-muted font-medium">لا توجد نتائج تطابق بحثك</p>
                <p className="text-sm text-foreground-muted mt-2">جرب كلمات بحث مختلفة</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {paginatedRewards.map((reward, index) => (
                    <motion.div
                      key={reward.id}
                      className="p-3 rounded-lg bg-background-light/30 border border-background-lighter"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ y: -2, boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center">
                          <div className="p-2 rounded-full bg-success/20 text-success ml-3">
                            <FaCoins />
                          </div>
                          <div>
                            <p className="font-medium">{reward.taskTitle || 'مكافأة مهمة'}</p>
                            <div className="flex items-center text-xs text-foreground-muted">
                              <FaCalendarAlt className="ml-1" />
                              {formatDate(reward.timestamp)}
                            </div>
                          </div>
                        </div>
                        <div className="text-success font-bold">
                          +{reward.amount.toFixed(2)} {reward.currency}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* ترقيم الصفحات */}
                {totalPages > 1 && (
                  <div className="flex justify-center items-center mt-4 space-x-2 space-x-reverse">
                    <button
                      className="p-2 rounded-lg bg-background-light/30 hover:bg-background-light/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                    >
                      السابق
                    </button>
                    
                    <div className="flex items-center space-x-1 space-x-reverse">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                          <button
                            key={i}
                            className={`w-8 h-8 rounded-lg ${
                              pageNum === currentPage
                                ? 'bg-primary text-foreground-inverted'
                                : 'bg-background-light/30 hover:bg-background-light/50'
                            }`}
                            onClick={() => goToPage(pageNum)}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                    </div>
                    
                    <button
                      className="p-2 rounded-lg bg-background-light/30 hover:bg-background-light/50 disabled:opacity-50 disabled:cursor-not-allowed"
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                    >
                      التالي
                    </button>
                  </div>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
