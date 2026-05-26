import React from 'react';
import { cn } from '../../utils/cn';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  glow?: 'cyan' | 'purple' | 'pink' | 'none';
  hoverable?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  glow = 'none',
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={cn(
        'glass-pane rounded-3xl p-6 relative overflow-hidden transition-all duration-300',
        hoverable && 'glass-pane-hover',
        glow === 'cyan' && 'shadow-neon-cyan/15 border-cyber-cyan/30',
        glow === 'purple' && 'shadow-neon-purple/15 border-cyber-purple/30',
        glow === 'pink' && 'shadow-neon-pink/15 border-cyber-pink/30',
        className
      )}
      {...props}
    >
      {/* Visual top border reflection effect */}
      <div className="absolute inset-x-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />
      
      {/* Content wrapper */}
      <div className="relative z-10">{children}</div>
    </div>
  );
};

export default GlassCard;
