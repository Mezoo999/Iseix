'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaChartLine, FaCalendarAlt, FaMoneyBillWave, FaLock, FaUnlock } from 'react-icons/fa';
import ActionButton from '@/components/ui/ActionButton';

interface InvestmentPlanProps {
  id: string;
  name: string;
  description: string;
  minAmount: number;
  maxAmount: number;
  dailyProfitRate: number;
  duration: number;
  features: string[];
  isPopular?: boolean;
  onInvest: (planId: string, amount: number) => void;
}

export default function InvestmentPlanCard({
  id,
  name,
  description,
  minAmount,
  maxAmount,
  dailyProfitRate,
  duration,
  features,
  isPopular = false,
  onInvest
}: InvestmentPlanProps) {
  const [amount, setAmount] = useState(minAmount);
  const [isHovered, setIsHovered] = useState(false);
  
  // حساب الربح اليومي
  const dailyProfit = amount * (dailyProfitRate / 100);
  
  // حساب إجمالي الربح المتوقع
  const totalProfit = dailyProfit * duration;
  
  // حساب إجمالي العائد
  const totalReturn = amount + totalProfit;
  
  // التعامل مع تغيير المبلغ
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value);
    if (isNaN(value)) {
      setAmount(minAmount);
    } else {
      setAmount(Math.min(Math.max(value, minAmount), maxAmount));
    }
  };
  
  // التعامل مع النقر على زر الاستثمار
  const handleInvest = () => {
    onInvest(id, amount);
  };
  
  return (
    <motion.div
      className={`rounded-xl overflow-hidden ${isPopular ? 'border-2 border-primary' : 'border border-background-lighter'}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ 
        y: -5,
        boxShadow: '0 10px 30px -15px rgba(0, 0, 0, 0.3)',
        transition: { duration: 0.3 }
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      {isPopular && (
        <div className="bg-primary text-white text-center py-1 text-sm font-bold">
          الأكثر شعبية
        </div>
      )}
      
      <div className="p-6 bg-background-light">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold mb-1">{name}</h3>
            <p className="text-foreground-muted text-sm">{description}</p>
          </div>
          <div className="p-3 rounded-full bg-primary/10 text-primary">
            <FaChartLine className="text-xl" />
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-foreground-muted">الربح اليومي:</span>
            <span className="font-bold text-success">{dailyProfitRate}%</span>
          </div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-foreground-muted">المدة:</span>
            <div className="flex items-center">
              <FaCalendarAlt className="ml-1 text-primary" />
              <span>{duration} يوم</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-foreground-muted">الحد الأدنى:</span>
            <span>{minAmount} USDT</span>
          </div>
        </div>
        
        <div className="mb-6">
          <label className="block text-sm text-foreground-muted mb-2">مبلغ الاستثمار:</label>
          <div className="flex">
            <input
              type="number"
              value={amount}
              onChange={handleAmountChange}
              min={minAmount}
              max={maxAmount}
              step={100}
              className="flex-1 bg-background border border-background-lighter rounded-r-lg p-3 text-left"
            />
            <div className="bg-background-lighter p-3 rounded-l-lg">
              USDT
            </div>
          </div>
          <div className="flex justify-between text-xs mt-1">
            <span>الحد الأدنى: {minAmount} USDT</span>
            <span>الحد الأقصى: {maxAmount} USDT</span>
          </div>
        </div>
        
        <motion.div 
          className="mb-6 p-4 bg-background rounded-lg"
          animate={{ 
            backgroundColor: isHovered ? 'rgba(var(--color-primary), 0.1)' : 'rgba(var(--color-background), 1)'
          }}
          transition={{ duration: 0.3 }}
        >
          <h4 className="font-bold mb-3 text-center">الأرباح المتوقعة</h4>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <div className="text-primary font-bold">{dailyProfit.toFixed(2)}</div>
              <div className="text-xs text-foreground-muted">يوميًا</div>
            </div>
            <div>
              <div className="text-primary font-bold">{totalProfit.toFixed(2)}</div>
              <div className="text-xs text-foreground-muted">إجمالي الربح</div>
            </div>
            <div>
              <div className="text-primary font-bold">{totalReturn.toFixed(2)}</div>
              <div className="text-xs text-foreground-muted">إجمالي العائد</div>
            </div>
          </div>
        </motion.div>
        
        <div className="mb-6">
          <h4 className="font-bold mb-2">المميزات:</h4>
          <ul className="space-y-2">
            {features.map((feature, index) => (
              <motion.li 
                key={index}
                className="flex items-center text-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <div className="p-1 rounded-full bg-success/20 text-success ml-2">
                  <FaUnlock className="text-xs" />
                </div>
                {feature}
              </motion.li>
            ))}
          </ul>
        </div>
        
        <ActionButton
          variant="primary"
          fullWidth
          onClick={handleInvest}
        >
          استثمر الآن
        </ActionButton>
      </div>
    </motion.div>
  );
}
