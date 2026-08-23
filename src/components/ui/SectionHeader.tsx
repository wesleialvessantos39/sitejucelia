// /src/components/ui/SectionHeader.tsx
import React from 'react';
import { motion } from 'motion/react';
import { Badge } from './Badge';

interface SectionHeaderProps {
  badgeText: string;
  title: string;
  highlightTitle?: string;
  subtitle?: string;
  centered?: boolean;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  badgeText,
  title,
  highlightTitle,
  subtitle,
  centered = true,
  className = ''
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`mb-12 md:mb-16 ${centered ? 'text-center max-w-3xl mx-auto' : 'text-left'} ${className}`}
    >
      <Badge variant="gold" className="mb-4">
        {badgeText}
      </Badge>
      
      <h2 className="text-3xl md:text-4xl lg:text-5xl font-cinzel font-bold text-white leading-tight tracking-tight mt-2">
        {title}{' '}
        {highlightTitle && (
          <span className="gold-gradient-text block sm:inline">{highlightTitle}</span>
        )}
      </h2>

      {/* Decorative Gold Line */}
      <div className={`h-0.5 w-16 bg-gradient-to-r from-[#C5A059] to-transparent mt-4 mb-4 ${centered ? 'mx-auto' : ''}`} />

      {subtitle && (
        <p className="text-slate-400 font-jakarta text-base md:text-lg leading-relaxed mt-2">
          {subtitle}
        </p>
      )}
    </motion.div>
  );
};
