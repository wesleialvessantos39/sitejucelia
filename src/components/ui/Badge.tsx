// /src/components/ui/Badge.tsx
import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'gold' | 'dark' | 'outline';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'gold',
  className = ''
}) => {
  const styles = {
    gold: 'bg-[#C5A059]/10 text-[#C5A059] border border-[#C5A059]/30',
    dark: 'bg-[#122038] text-slate-300 border border-white/10',
    outline: 'border border-[#C5A059]/50 text-[#C5A059]'
  };

  return (
    <span className={`inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-jakarta font-semibold tracking-widest uppercase ${styles[variant]} ${className}`}>
      {children}
    </span>
  );
};
