// /src/components/admin/MediaDisplayEditorModal.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Sliders,
  RotateCcw,
  Check,
  ZoomIn,
  Move,
  Sparkles,
  Layers,
  Crop,
  AlertCircle,
  Eye
} from 'lucide-react';
import {
  MediaDisplaySetting,
  MediaObjectFit,
  MediaAspectRatio,
  MediaContext,
  DEFAULT_MEDIA_DISPLAY_SETTINGS,
} from '../../types/mediaDisplay';
import { useMediaDisplay } from '../../context/MediaDisplayContext';
import { useAuth } from '../../context/AuthContext';

interface MediaDisplayEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  mediaKey: string;
  mediaUrl: string;
  mediaTitle: string;
  mediaType?: 'image' | 'video' | 'icon';
  context?: MediaContext;
  onSaved?: () => void;
}

const OBJECT_FIT_OPTIONS: { value: MediaObjectFit; label: string; desc: string }[] = [
  { value: 'cover', label: 'Cover (Preencher e Recortar)', desc: 'Cobre toda a área preservando proporção' },
  { value: 'contain', label: 'Contain (Conter sem Cortar)', desc: 'Exibe a imagem inteira sem cortes' },
  { value: 'fill', label: 'Fill (Esticar)', desc: 'Preenche ignorando a proporção' },
  { value: 'scale-down', label: 'Scale Down', desc: 'Reduz se for maior que o container' },
];

const ASPECT_RATIO_OPTIONS: { value: MediaAspectRatio; label: string }[] = [
  { value: 'auto', label: 'Automático / Original' },
  { value: '16:9', label: '16:9 (Panorâmico / Vídeo)' },
  { value: '4:3', label: '4:3 (Padrão de TV / Foto)' },
  { value: '3:2', label: '3:2 (Fotografia Clássica)' },
  { value: '1:1', label: '1:1 (Quadrado)' },
  { value: '4:5', label: '4:5 (Retrato Vertical)' },
  { value: '9:16', label: '9:16 (Stories / Vertical)' },
  { value: '21:9', label: '21:9 (Ultra-Wide)' },
];

export const MediaDisplayEditorModal: React.FC<MediaDisplayEditorModalProps> = ({
  isOpen,
  onClose,
  mediaKey,
  mediaUrl,
  mediaTitle,
  mediaType = 'image',
  context = 'general',
  onSaved,
}) => {
  const { user, profile } = useAuth();
  const { getSettingForMedia, saveSetting, resetSetting } = useMediaDisplay();

  const [currentSetting, setCurrentSetting] = useState<MediaDisplaySetting>(() =>
    getSettingForMedia(mediaKey, context)
  );

  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const isDraggingFocalPointRef = useRef(false);

  useEffect(() => {
    if (isOpen) {
      const initial = getSettingForMedia(mediaKey, context);
      setCurrentSetting(initial);
      setShowResetConfirm(false);
      setFeedbackMsg(null);
    }
  }, [isOpen, mediaKey, context, getSettingForMedia]);

  if (!isOpen) return null;

  const handleFocalPointMove = (clientX: number, clientY: number) => {
    if (!previewContainerRef.current) return;
    const rect = previewContainerRef.current.getBoundingClientRect();
    const x = Math.round(Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100)));
    const y = Math.round(Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100)));

    setCurrentSetting((prev) => ({
      ...prev,
      focal_x: x,
      focal_y: y,
      position_x: x,
      position_y: y,
      object_position: `${x}% ${y}%`,
    }));
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingFocalPointRef.current = true;
    handleFocalPointMove(e.clientX, e.clientY);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDraggingFocalPointRef.current) {
      handleFocalPointMove(e.clientX, e.clientY);
    }
  };

  const handleMouseUp = () => {
    isDraggingFocalPointRef.current = false;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      handleFocalPointMove(touch.clientX, touch.clientY);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      setFeedbackMsg(null);

      await saveSetting(
        mediaKey,
        currentSetting,
        profile?.id || user?.id,
        profile?.email || user?.email
      );

      setFeedbackMsg({ text: 'Enquadramento salvo com sucesso!', type: 'success' });
      setTimeout(() => {
        if (onSaved) onSaved();
        onClose();
      }, 1000);
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Erro ao salvar enquadramento.', type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setIsResetting(true);
      setFeedbackMsg(null);

      await resetSetting(mediaKey, profile?.id || user?.id, profile?.email || user?.email);
      const defaultSetting = DEFAULT_MEDIA_DISPLAY_SETTINGS[context] || DEFAULT_MEDIA_DISPLAY_SETTINGS.general;

      setCurrentSetting({
        id: mediaKey,
        media_type: mediaType,
        context,
        ...defaultSetting,
      });

      setFeedbackMsg({ text: 'Enquadramento restaurado para o padrão.', type: 'success' });
      setShowResetConfirm(false);
      setTimeout(() => {
        if (onSaved) onSaved();
        onClose();
      }, 1000);
    } catch (err: any) {
      setFeedbackMsg({ text: err.message || 'Erro ao restaurar padrão.', type: 'error' });
    } finally {
      setIsResetting(false);
    }
  };

  // Helper de proporção para container de preview
  const getPreviewAspectRatio = () => {
    switch (currentSetting.aspect_ratio) {
      case '16:9': return 'aspect-video';
      case '4:3': return 'aspect-4/3';
      case '3:2': return 'aspect-3/2';
      case '1:1': return 'aspect-square';
      case '4:5': return 'aspect-4/5';
      case '9:16': return 'aspect-9/16';
      case '21:9': return 'aspect-21/9';
      default: return 'aspect-video';
    }
  };

  return (
    <div
      id="media-display-editor-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md overflow-y-auto"
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="relative w-full max-w-4xl bg-[#0E1B2E] border border-[#C5A059]/40 rounded-3xl shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
        
        {/* Header do Modal */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-[#0B1526]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C5A059]/20 text-[#C5A059] flex items-center justify-center border border-[#C5A059]/30">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-cinzel font-bold text-white flex items-center gap-2">
                Ajustar Enquadramento de Mídia
              </h3>
              <p className="text-xs text-slate-400 font-jakarta line-clamp-1">
                {mediaTitle} <span className="text-[#C5A059]/70 font-mono">({mediaKey})</span>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Message */}
        {feedbackMsg && (
          <div className={`px-6 py-3 text-xs font-jakarta flex items-center gap-2 ${
            feedbackMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-b border-red-500/30'
          }`}>
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Corpo com Grid: Preview à esquerda / Controles à direita */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 overflow-y-auto">
          
          {/* Coluna de Pré-visualização Interativa (7 cols) */}
          <div className="lg:col-span-7 flex flex-col space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold font-jakarta text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#C5A059]" />
                Prévia em Tempo Real (Clique para posicionar o foco)
              </span>
              <span className="text-[11px] font-mono text-[#C5A059] bg-[#C5A059]/10 px-2 py-0.5 rounded-md border border-[#C5A059]/20">
                Foco: {currentSetting.focal_x}% X, {currentSetting.focal_y}% Y
              </span>
            </div>

            {/* Container Interativo do Preview */}
            <div
              ref={previewContainerRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onTouchMove={handleTouchMove}
              onTouchStart={(e) => {
                if (e.touches.length > 0) {
                  handleFocalPointMove(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              className={`relative w-full max-h-[380px] bg-[#070D18] border-2 border-dashed border-[#C5A059]/50 rounded-2xl overflow-hidden cursor-crosshair select-none flex items-center justify-center ${getPreviewAspectRatio()}`}
            >
              {mediaType === 'video' ? (
                <video
                  src={mediaUrl}
                  muted
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full pointer-events-none transition-all duration-150"
                  style={{
                    objectFit: currentSetting.object_fit,
                    objectPosition: `${currentSetting.focal_x}% ${currentSetting.focal_y}%`,
                    transform: `scale(${currentSetting.zoom})`,
                    transformOrigin: `${currentSetting.focal_x}% ${currentSetting.focal_y}%`,
                  }}
                />
              ) : (
                <img
                  src={mediaUrl}
                  alt={mediaTitle}
                  className="w-full h-full pointer-events-none transition-all duration-150"
                  style={{
                    objectFit: currentSetting.object_fit,
                    objectPosition: `${currentSetting.focal_x}% ${currentSetting.focal_y}%`,
                    transform: `scale(${currentSetting.zoom})`,
                    transformOrigin: `${currentSetting.focal_x}% ${currentSetting.focal_y}%`,
                  }}
                />
              )}

              {/* Ponto Focal Visual Animado */}
              <div
                className="absolute w-7 h-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400 bg-amber-400/40 backdrop-blur-sm pointer-events-none flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.9)] animate-pulse"
                style={{
                  left: `${currentSetting.focal_x}%`,
                  top: `${currentSetting.focal_y}%`,
                }}
              >
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>

              {/* Guia de Grade de Terços Suave */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none border border-white/10">
                <div className="border-r border-b border-white/5" />
                <div className="border-r border-b border-white/5" />
                <div className="border-b border-white/5" />
                <div className="border-r border-b border-white/5" />
                <div className="border-r border-b border-white/5" />
                <div className="border-b border-white/5" />
                <div className="border-r border-white/5" />
                <div className="border-r border-white/5" />
                <div />
              </div>
            </div>

            <p className="text-[11px] text-slate-400 font-jakarta flex items-center gap-1.5">
              <Move className="w-3.5 h-3.5 text-[#C5A059]" />
              Arraste ou clique diretamente na foto para reposicionar o foco visual onde está o elemento principal.
            </p>
          </div>

          {/* Coluna de Controles (5 cols) */}
          <div className="lg:col-span-5 space-y-5 bg-[#0B1526] p-5 rounded-2xl border border-white/10">
            
            {/* Object Fit */}
            <div className="space-y-2">
              <label className="text-xs font-bold font-jakarta text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#C5A059]" />
                Modo de Enquadramento (Object-Fit)
              </label>
              <select
                value={currentSetting.object_fit}
                onChange={(e) =>
                  setCurrentSetting((prev) => ({
                    ...prev,
                    object_fit: e.target.value as MediaObjectFit,
                  }))
                }
                className="w-full bg-[#122038] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#C5A059]"
              >
                {OBJECT_FIT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Aspect Ratio */}
            <div className="space-y-2">
              <label className="text-xs font-bold font-jakarta text-slate-200 flex items-center gap-2">
                <Crop className="w-4 h-4 text-[#C5A059]" />
                Proporção da Moldura (Aspect-Ratio)
              </label>
              <select
                value={currentSetting.aspect_ratio}
                onChange={(e) =>
                  setCurrentSetting((prev) => ({
                    ...prev,
                    aspect_ratio: e.target.value as MediaAspectRatio,
                  }))
                }
                className="w-full bg-[#122038] border border-white/15 rounded-xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-[#C5A059]"
              >
                {ASPECT_RATIO_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Slider de Zoom */}
            <div className="space-y-2">
              <div className="flex justify-between items-center text-xs">
                <label className="font-bold font-jakarta text-slate-200 flex items-center gap-2">
                  <ZoomIn className="w-4 h-4 text-[#C5A059]" />
                  Ajuste de Zoom
                </label>
                <span className="font-mono text-[#C5A059] font-bold">
                  {currentSetting.zoom.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="1.0"
                max="2.5"
                step="0.05"
                value={currentSetting.zoom}
                onChange={(e) =>
                  setCurrentSetting((prev) => ({
                    ...prev,
                    zoom: parseFloat(e.target.value) || 1.0,
                  }))
                }
                className="w-full h-2 bg-[#122038] rounded-lg appearance-none cursor-pointer accent-[#C5A059]"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>1.0x (Normal)</span>
                <span>1.75x</span>
                <span>2.5x (Máximo)</span>
              </div>
            </div>

            {/* Posição Horizontal X */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-jakarta">Posição Horizontal (Eixo X):</span>
                <span className="font-mono text-white font-bold">{currentSetting.focal_x}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={currentSetting.focal_x}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 50;
                  setCurrentSetting((prev) => ({
                    ...prev,
                    focal_x: val,
                    position_x: val,
                    object_position: `${val}% ${prev.focal_y}%`,
                  }));
                }}
                className="w-full h-1.5 bg-[#122038] rounded-lg appearance-none cursor-pointer accent-[#C5A059]"
              />
            </div>

            {/* Posição Vertical Y */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-300 font-jakarta">Posição Vertical (Eixo Y):</span>
                <span className="font-mono text-white font-bold">{currentSetting.focal_y}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={currentSetting.focal_y}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10) || 50;
                  setCurrentSetting((prev) => ({
                    ...prev,
                    focal_y: val,
                    position_y: val,
                    object_position: `${prev.focal_x}% ${val}%`,
                  }));
                }}
                className="w-full h-1.5 bg-[#122038] rounded-lg appearance-none cursor-pointer accent-[#C5A059]"
              />
            </div>

            {/* Confirmação de Reset inline */}
            {showResetConfirm && (
              <div className="p-3 bg-red-900/30 border border-red-500/40 rounded-xl space-y-2 text-xs text-red-200">
                <p>Restaurar o enquadramento padrão desta mídia?</p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isResetting}
                    className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold cursor-pointer"
                  >
                    {isResetting ? 'Restaurando...' : 'Sim, Restaurar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white cursor-pointer"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer com Botões */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-6 border-t border-white/10 bg-[#0B1526]">
          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            disabled={isSaving || isResetting}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/15 hover:border-red-500/50 hover:bg-red-500/10 text-slate-300 hover:text-red-300 text-xs font-jakarta font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Restaurar Padrão</span>
          </button>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving || isResetting}
              className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl border border-white/15 hover:bg-white/10 text-white text-xs font-jakarta font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || isResetting}
              className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#d4b068] text-[#070D18] text-xs font-jakarta font-bold uppercase tracking-wider shadow-lg shadow-[#C5A059]/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{isSaving ? 'Salvando no Supabase...' : 'Salvar Enquadramento'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
