'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FaMedal, FaGem, FaCrown, FaStar, FaUser, FaLock } from 'react-icons/fa';
import { MembershipLevel } from '@/services/dailyTasks';

interface MembershipBadgeProps {
  level: string;
  color: string;
  icon: React.ReactNode;
  isActive: boolean;
}

const MembershipBadge: React.FC<MembershipBadgeProps> = ({ level, color, icon, isActive }) => {
  return (
    <div className="flex flex-col items-center">
      <motion.div 
        className={`w-16 h-16 rounded-full ${color} flex items-center justify-center mb-2 shadow-lg ${
          isActive ? 'ring-2 ring-white' : 'opacity-60'
        }`}
        whileHover={{ scale: 1.1 }}
        transition={{ duration: 0.2 }}
      >
        {icon}
      </motion.div>
      <div className="font-bold text-center text-sm">{level}</div>
    </div>
  );
};

interface MembershipBadgesProps {
  currentLevel: MembershipLevel;
}

const MembershipBadges: React.FC<MembershipBadgesProps> = ({ currentLevel }) => {
  // تكوين الشارات
  const badges = [
    {
      level: MembershipLevel.BASIC,
      name: 'Iseix Basic',
      arabicName: 'المستوى الأساسي',
      color: 'bg-gray-400',
      icon: <FaUser className="text-white text-2xl" />
    },
    {
      level: MembershipLevel.SILVER,
      name: 'Iseix Silver',
      arabicName: 'المستوى الفضي',
      color: 'bg-blue-300',
      icon: <FaStar className="text-white text-2xl" />
    },
    {
      level: MembershipLevel.GOLD,
      name: 'Iseix Gold',
      arabicName: 'المستوى الذهبي',
      color: 'bg-yellow-400',
      icon: <FaMedal className="text-white text-2xl" />
    },
    {
      level: MembershipLevel.PLATINUM,
      name: 'Iseix Platinum',
      arabicName: 'المستوى البلاتيني',
      color: 'bg-purple-400',
      icon: <FaCrown className="text-white text-2xl" />
    },
    {
      level: MembershipLevel.DIAMOND,
      name: 'Iseix Diamond',
      arabicName: 'المستوى الماسي',
      color: 'bg-cyan-400',
      icon: <FaGem className="text-white text-2xl" />
    },
    {
      level: MembershipLevel.ELITE,
      name: 'Iseix Elite',
      arabicName: 'المستوى النخبة',
      color: 'bg-red-400',
      icon: <FaGem className="text-white text-2xl" />
    }
  ];
  
  return (
    <div className="bg-gradient-to-br from-background-light/50 to-background-light/20 p-4 rounded-xl shadow-sm">
      <h2 className="text-xl font-bold mb-4">شارات العضوية</h2>
      
      <div className="grid grid-cols-3 gap-4">
        {badges.map((badge) => {
          const isUnlocked = badge.level <= currentLevel;
          
          return (
            <div 
              key={badge.level}
              className="p-3 rounded-lg"
            >
              <MembershipBadge 
                level={badge.name}
                color={badge.color}
                icon={badge.icon}
                isActive={isUnlocked}
              />
              {!isUnlocked && (
                <div className="text-center mt-2">
                  <FaLock className="inline-block text-foreground-muted" />
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      <div className="mt-4 text-sm text-foreground-muted text-center">
        مستواك الحالي: <span className="font-bold">{badges.find(b => b.level === currentLevel)?.name}</span>
      </div>
    </div>
  );
};

export default MembershipBadges;
