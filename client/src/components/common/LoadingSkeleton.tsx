import React from 'react';
import { cn } from '../../utils/cn';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'card' | 'circle' | 'line';
}

export const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({
  className,
  variant = 'line'
}) => {
  return (
    <div
      className={cn(
        'animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-2xl relative overflow-hidden',
        variant === 'circle' && 'rounded-full aspect-square',
        variant === 'card' && 'h-40 w-full glass-pane border-white/5',
        variant === 'line' && 'h-4 w-full',
        className
      )}
    >
      {/* Glare reflect animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
    </div>
  );
};

export default LoadingSkeleton;
