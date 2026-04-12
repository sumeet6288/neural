'use client';

import { memo } from 'react';

interface SkeletonProps {
  className?: string;
  width?: string;
  height?: string;
}

export const Skeleton = memo(function Skeleton({ 
  className = '', 
  width = '100%', 
  height = '20px' 
}: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-white/10 rounded ${className}`}
      style={{ width, height }}
    />
  );
});

export const CardSkeleton = memo(function CardSkeleton() {
  return (
    <div className="glass-aip p-6 rounded-xl space-y-4">
      <Skeleton width="60%" height="24px" />
      <Skeleton width="40%" height="16px" />
      <Skeleton width="80%" height="40px" />
    </div>
  );
});

export const StatsSkeleton = memo(function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="glass-aip p-4 rounded-xl space-y-2">
          <Skeleton width="50%" height="14px" />
          <Skeleton width="70%" height="24px" />
        </div>
      ))}
    </div>
  );
});

export const CalculatorSkeleton = memo(function CalculatorSkeleton() {
  return (
    <div className="glass-aip rounded-2xl p-6 md:p-8 space-y-6">
      <Skeleton width="200px" height="32px" />
      <div className="space-y-4">
        <Skeleton width="100%" height="48px" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} width="100%" height="80px" />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} width="100%" height="80px" />
        ))}
      </div>
    </div>
  );
});
