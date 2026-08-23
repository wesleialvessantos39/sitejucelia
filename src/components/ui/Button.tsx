// /src/components/ui/Button.tsx
import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';

interface ButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  variant?: 'gold' | 'outline' | 'dark' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'gold',
  size = 'md',
  children,
  icon,
  iconPosition = 'right',
  fullWidth = false,
  className = '',
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-jakarta font-semibold transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-[#C5A059] focus:ring-offset-2 focus:ring-offset-[#0A1220] cursor-pointer';

  const sizeStyles = {
    sm: 'px-4 py-2 text-xs tracking-wider uppercase gap-2',
    md: 'px-6 py-3 text-sm tracking-wider uppercase gap-2.5',
    lg: 'px-8 py-4 text-base tracking-wider uppercase gap-3'
  };

  const variantStyles = {
    gold: 'bg-gradient-to-r from-[#D4AF37] via-[#C5A059] to-[#9A7B38] text-[#0A1220] hover:brightness-110',
    outline: 'border border-[#C5A059]/60 text-[#F8F9FA] hover:border-[#C5A059] hover:bg-[#C5A059]/10 hover:text-[#C5A059]',
    dark: 'bg-[#122038] border border-white/10 text-[#F8F9FA] hover:bg-[#182A4A] hover:border-[#C5A059]/40',
    ghost: 'text-[#C5A059] hover:bg-[#C5A059]/10'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {icon && iconPosition === 'left' && <span className="inline-block">{icon}</span>}
      <span>{children}</span>
      {icon && iconPosition === 'right' && <span className="inline-block">{icon}</span>}
    </motion.button>
  );
};
