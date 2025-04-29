'use client';

import { motion } from 'framer-motion';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: string;
  animate?: boolean;
}

export function Skeleton({
  className = '',
  width = '100%',
  height = '1rem',
  rounded = 'rounded-md',
  animate = true
}: SkeletonProps) {
  return (
    <div
      className={`bg-background-lighter ${rounded} overflow-hidden ${className}`}
      style={{ width, height }}
    >
      {animate && (
        <motion.div
          className="w-full h-full bg-gradient-to-r from-background-lighter via-background-light to-background-lighter"
          animate={{ x: ['0%', '100%', '0%'] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-background-light p-6 rounded-xl">
      <Skeleton height="2rem" className="mb-4" />
      <Skeleton height="1rem" className="mb-2" width="80%" />
      <Skeleton height="1rem" className="mb-2" width="90%" />
      <Skeleton height="1rem" className="mb-4" width="70%" />
      <Skeleton height="3rem" rounded="rounded-lg" />
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="flex flex-col items-center p-6">
      <Skeleton width="6rem" height="6rem" rounded="rounded-full" className="mb-4" />
      <Skeleton height="1.5rem" width="10rem" className="mb-2" />
      <Skeleton height="1rem" width="8rem" className="mb-4" />
      <div className="w-full space-y-2">
        <Skeleton height="2.5rem" rounded="rounded-lg" />
        <Skeleton height="2.5rem" rounded="rounded-lg" />
        <Skeleton height="2.5rem" rounded="rounded-lg" />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full">
      <div className="flex mb-4 bg-background p-3 rounded-lg">
        <Skeleton width="25%" height="1.5rem" className="ml-2" />
        <Skeleton width="25%" height="1.5rem" className="ml-2" />
        <Skeleton width="25%" height="1.5rem" className="ml-2" />
        <Skeleton width="25%" height="1.5rem" />
      </div>
      
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex p-3 border-b border-background-lighter">
            <Skeleton width="25%" height="1.2rem" className="ml-2" />
            <Skeleton width="25%" height="1.2rem" className="ml-2" />
            <Skeleton width="25%" height="1.2rem" className="ml-2" />
            <Skeleton width="25%" height="1.2rem" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="bg-background-light p-4 rounded-xl">
          <Skeleton height="1rem" width="50%" className="mb-2" />
          <Skeleton height="2rem" className="mb-1" />
        </div>
      ))}
    </div>
  );
}

export function InvestmentCardSkeleton() {
  return (
    <div className="bg-background-light p-6 rounded-xl">
      <div className="flex justify-between mb-4">
        <div>
          <Skeleton height="1.5rem" width="8rem" className="mb-2" />
          <Skeleton height="1rem" width="4rem" />
        </div>
        <Skeleton width="3rem" height="3rem" rounded="rounded-full" />
      </div>
      
      <div className="space-y-2 mb-4">
        <div className="flex justify-between">
          <Skeleton width="40%" height="1rem" />
          <Skeleton width="30%" height="1rem" />
        </div>
        <div className="flex justify-between">
          <Skeleton width="40%" height="1rem" />
          <Skeleton width="30%" height="1rem" />
        </div>
        <div className="flex justify-between">
          <Skeleton width="40%" height="1rem" />
          <Skeleton width="30%" height="1rem" />
        </div>
      </div>
      
      <Skeleton height="0.5rem" className="mb-2" rounded="rounded-full" />
      <Skeleton height="2.5rem" rounded="rounded-lg" />
    </div>
  );
}
