import React from 'react';
import { FaCoins, FaTrophy } from 'react-icons/fa';

interface RewardsCardProps {
  completedTasks: number;
  totalTasks: number;
  profitRate?: number;
}

const RewardsCard: React.FC<RewardsCardProps> = ({ 
  completedTasks, 
  totalTasks,
  profitRate = 3.0 
}) => {
  // حساب المكافأة المتوقعة بناءً على عدد المهام المكتملة
  const expectedReward = (completedTasks / totalTasks) * profitRate;
  
  return (
    <div className="bg-gradient-to-r from-yellow-500/20 to-yellow-600/20 p-4 rounded-xl">
      <div className="flex items-center mb-3">
        <FaTrophy className="text-yellow-500 ml-2 text-xl" />
        <h3 className="font-bold">مكافآت اليوم</h3>
      </div>
      
      <div className="flex justify-between items-center">
        <div>
          <p className="text-sm text-gray-400 mb-1">المكافأة المتوقعة</p>
          <div className="flex items-center">
            <FaCoins className="text-yellow-500 ml-1" />
            <span className="font-bold text-xl">{expectedReward.toFixed(2)}</span>
            <span className="text-sm mr-1">USDT</span>
          </div>
        </div>
        
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center">
            <div className="font-bold text-xl">{completedTasks}/{totalTasks}</div>
          </div>
          <p className="text-xs mt-1">مهام مكتملة</p>
        </div>
      </div>
      
      <div className="mt-3">
        <div className="text-xs text-gray-400 mb-1">نسبة الربح اليومي</div>
        <div className="flex items-center">
          <span className="font-bold text-lg">{profitRate}%</span>
        </div>
      </div>
    </div>
  );
};

export default RewardsCard;
