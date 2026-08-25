// /src/components/ui/SmartText.tsx
import React, { useState, useId, useMemo, useEffect } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useTextDisplay } from '../../context/TextDisplayContext';
import { PublicTextSection, TextDisplayMode } from '../../types/textDisplay';

export interface SmartTextProps {
  text: string;
  section: PublicTextSection;
  className?: string;
  style?: React.CSSProperties;
  forceMode?: TextDisplayMode;
  forceMaxLines?: number;
  as?: 'p' | 'span' | 'div';
  id?: string;
  toggleClassName?: string;
  collapseLabel?: string;
  expandLabel?: string;
}

export const SmartText: React.FC<SmartTextProps> = ({
  text,
  section,
  className = '',
  style,
  forceMode,
  forceMaxLines,
  as: Component = 'p',
  id: explicitId,
  toggleClassName = '',
  collapseLabel: customCollapseLabel,
  expandLabel: customExpandLabel,
}) => {
  const generatedId = useId();
  const contentId = explicitId || `smart-text-${generatedId}`;
  const buttonId = `smart-text-btn-${generatedId}`;

  const { resolveConfig, settings } = useTextDisplay();
  const config = resolveConfig(section);

  const effectiveMode = forceMode || config.mode;
  const effectiveMaxLines = forceMaxLines || config.maxLines;

  // Estado de expansão: começa com o configurado
  const [isExpanded, setIsExpanded] = useState<boolean>(() => config.initiallyExpanded);

  // Sincroniza se a configuração global mudar
  useEffect(() => {
    setIsExpanded(config.initiallyExpanded);
  }, [config.initiallyExpanded]);

  const cleanText = typeof text === 'string' ? text : '';
  const charCount = cleanText.trim().length;

  // Verificação de elegibilidade para redução
  const isEligibleForReduction = useMemo(() => {
    if (!config.enabled) return false;
    if (effectiveMode === 'full') return false;
    if (settings.automaticDetection && charCount < config.minimumCharacters) {
      return false;
    }
    return true;
  }, [config.enabled, effectiveMode, settings.automaticDetection, charCount, config.minimumCharacters]);

  if (!cleanText) {
    return null;
  }

  // Se não for elegível ou modo full, renderiza o texto integralmente
  if (!isEligibleForReduction || effectiveMode === 'full') {
    return (
      <Component id={contentId} className={className} style={style}>
        {cleanText}
      </Component>
    );
  }

  // Modo COMPACT (apenas clamp, sem botão de expansão)
  if (effectiveMode === 'compact') {
    const clampStyles: React.CSSProperties = {
      ...style,
      display: '-webkit-box',
      WebkitBoxOrient: 'vertical',
      WebkitLineClamp: effectiveMaxLines,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    };

    return (
      <Component
        id={contentId}
        className={`${className} transition-all duration-300`}
        style={clampStyles}
        title={cleanText}
      >
        {cleanText}
      </Component>
    );
  }

  // Modo COLLAPSIBLE (clamp + toggle expansível)
  const isCurrentlyClamped = !isExpanded;
  const clampStyles: React.CSSProperties = isCurrentlyClamped
    ? {
        ...style,
        display: '-webkit-box',
        WebkitBoxOrient: 'vertical',
        WebkitLineClamp: effectiveMaxLines,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }
    : {
        ...style,
      };

  const expandText = customExpandLabel || config.expandLabel || 'Ler mais...';
  const collapseText = customCollapseLabel || config.collapseLabel || 'Ler menos';

  return (
    <div className="inline-block w-full">
      <Component
        id={contentId}
        className={`${className} transition-[max-height,opacity] duration-300 ease-in-out`}
        style={clampStyles}
      >
        {cleanText}
      </Component>

      {config.showToggle && (
        <button
          id={buttonId}
          type="button"
          onClick={() => setIsExpanded((prev) => !prev)}
          aria-expanded={isExpanded}
          aria-controls={contentId}
          className={`mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-[#C5A059] hover:text-[#DFB76C] focus:outline-none focus-visible:ring-1 focus-visible:ring-[#C5A059] transition-colors duration-200 cursor-pointer ${toggleClassName}`}
        >
          <span>{isExpanded ? collapseText : expandText}</span>
          {isExpanded ? (
            <ChevronUp className="w-3.5 h-3.5 shrink-0 transition-transform" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 shrink-0 transition-transform" />
          )}
        </button>
      )}
    </div>
  );
};
