'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { FaTasks, FaCoins, FaPercentage, FaTrophy, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import Link from 'next/link';

interface TasksHeaderProps {
  completedTasks: number;
  totalTasks: number;
  totalRewards: string;
  profitRate: string;
  membershipLevel: string;
}

const TasksHeader: React.FC<TasksHeaderProps> = ({
  completedTasks,
  totalTasks,
  totalRewards,
  profitRate,
  membershipLevel
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      className="bg-gradient-to-br from-background-dark/90 to-background-dark/70 backdrop-blur-lg rounded-none shadow-lg border-b border-primary/20 overflow-hidden mb-0 sticky top-0 z-30"
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* خلفية زخرفية */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-0 left-0 w-60 h-60 rounded-full bg-primary/5 blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-60 h-60 rounded-full bg-primary/5 blur-3xl"></div>
      </div>

      {/* الشريط العلوي */}
      <div className="flex items-center justify-between p-2 border-b border-primary/10">
        <div className="flex items-center">
          <Link href="/tasks" className="flex items-center">
            <div className="p-2 rounded-full bg-gradient-to-br from-primary/30 to-primary-dark/30 text-primary ml-2 shadow-md">
              <FaTasks className="text-sm" />
            </div>
            <span className="text-sm font-bold">المهام اليومية</span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/me" className="flex items-center">
            <div className="p-2 rounded-full bg-gradient-to-br from-background-lighter/30 to-background-lighter/10 text-foreground ml-2">
              <FaTasks className="text-xs" />
            </div>
            <span className="text-xs">حسابي</span>
          </Link>

          <Link href="/wheel" className="flex items-center">
            <div className="p-2 rounded-full bg-gradient-to-br from-background-lighter/30 to-background-lighter/10 text-foreground ml-2">
              <FaTasks className="text-xs" />
            </div>
            <span className="text-xs">عجلة الحظ</span>
          </Link>

          <motion.button
            className="p-2 rounded-full bg-background-lighter/20 hover:bg-background-lighter/30 transition-colors"
            onClick={() => setExpanded(!expanded)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {expanded ? <FaChevronUp className="text-xs" /> : <FaChevronDown className="text-xs" />}
          </motion.button>
        </div>
      </div>

      {/* الإحصائيات */}
      <div className="grid grid-cols-4 gap-0">
        <div className="p-2 text-center border-l border-primary/10">
          <div className="flex items-center justify-center mb-1">
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <FaTasks className="text-primary text-xs" />
            </div>
          </div>
          <div className="text-xs text-foreground-muted">المهام المكتملة</div>
          <p className="text-sm font-bold">{completedTasks} من {totalTasks}</p>
        </div>

        <div className="p-2 text-center border-l border-primary/10">
          <div className="flex items-center justify-center mb-1">
            <div className="w-6 h-6 rounded-full bg-success/10 flex items-center justify-center">
              <FaCoins className="text-success text-xs" />
            </div>
          </div>
          <div className="text-xs text-foreground-muted">إجمالي المكافآت</div>
          <p className="text-sm font-bold">{totalRewards}</p>
        </div>

        <div className="p-2 text-center border-l border-primary/10">
          <div className="flex items-center justify-center mb-1">
            <div className="w-6 h-6 rounded-full bg-info/10 flex items-center justify-center">
              <FaPercentage className="text-info text-xs" />
            </div>
          </div>
          <div className="text-xs text-foreground-muted">معدل الربح</div>
          <p className="text-sm font-bold">{profitRate}</p>
        </div>

        <div className="p-2 text-center">
          <div className="flex items-center justify-center mb-1">
            <div className="w-6 h-6 rounded-full bg-secondary/10 flex items-center justify-center">
              <FaTrophy className="text-secondary text-xs" />
            </div>
          </div>
          <div className="text-xs text-foreground-muted">مستوى العضوية</div>
          <p className="text-sm font-bold">{membershipLevel}</p>
        </div>
      </div>

      {/* القسم الموسع */}
      <motion.div
        className="overflow-hidden"
        initial={{ height: 0 }}
        animate={{ height: expanded ? 'auto' : 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="p-3">
          <div className="text-xs text-foreground-muted mb-2">روابط سريعة</div>
          <div className="grid grid-cols-3 gap-2">
            <Link href="/membership" className="bg-background-lighter/20 p-2 rounded-lg text-center text-xs hover:bg-background-lighter/30 transition-colors">
              العضوية
            </Link>
            <Link href="/referrals" className="bg-background-lighter/20 p-2 rounded-lg text-center text-xs hover:bg-background-lighter/30 transition-colors">
              الإحالات
            </Link>
            <Link href="/transactions" className="bg-background-lighter/20 p-2 rounded-lg text-center text-xs hover:bg-background-lighter/30 transition-colors">
              المعاملات
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TasksHeader;
