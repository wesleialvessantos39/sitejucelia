// /src/components/ui/ManagedMedia.tsx
import React, { CSSProperties } from 'react';
import { useMediaDisplay } from '../../context/MediaDisplayContext';
import { MediaContext, MediaDisplaySetting } from '../../types/mediaDisplay';

interface ManagedMediaProps {
  id?: string;
  mediaKey: string;
  src: string;
  alt: string;
  context?: MediaContext;
  isVideo?: boolean;
  posterUrl?: string;
  className?: string;
  containerClassName?: string;
  customSetting?: Partial<MediaDisplaySetting>;
  loading?: 'lazy' | 'eager';
  decoding?: 'async' | 'sync' | 'auto';
  autoPlay?: boolean;
  muted?: boolean;
  loop?: boolean;
  controls?: boolean;
  playsInline?: boolean;
  onClick?: (e: React.MouseEvent) => void;
  onError?: (e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement, Event>) => void;
}

export const ManagedMedia: React.FC<ManagedMediaProps> = ({
  id,
  mediaKey,
  src,
  alt,
  context = 'general',
  isVideo = false,
  posterUrl,
  className = '',
  containerClassName = '',
  customSetting,
  loading = 'lazy',
  decoding = 'async',
  autoPlay = false,
  muted = true,
  loop = false,
  controls = false,
  playsInline = true,
  onClick,
  onError,
}) => {
  const { getSettingForMedia } = useMediaDisplay();
  const dbSetting = getSettingForMedia(mediaKey, context);
  const setting = { ...dbSetting, ...customSetting };

  // Cálculo da proporção para aspect-ratio
  const getAspectRatioStyle = (): string | undefined => {
    if (!setting.aspect_ratio || setting.aspect_ratio === 'auto') return undefined;
    switch (setting.aspect_ratio) {
      case '16:9': return '16 / 9';
      case '4:3': return '4 / 3';
      case '3:2': return '3 / 2';
      case '1:1': return '1 / 1';
      case '4:5': return '4 / 5';
      case '9:16': return '9 / 16';
      case '21:9': return '21 / 9';
      default: return undefined;
    }
  };

  const focalPosition = `${setting.focal_x ?? setting.position_x ?? 50}% ${setting.focal_y ?? setting.position_y ?? 50}%`;
  const zoomLevel = setting.zoom && setting.zoom > 1.0 ? setting.zoom : 1.0;

  const mediaStyle: CSSProperties = {
    objectFit: setting.object_fit || 'cover',
    objectPosition: focalPosition,
    transform: zoomLevel > 1.0 ? `scale(${zoomLevel})` : undefined,
    transformOrigin: focalPosition,
    transition: 'transform 0.3s ease-out, object-position 0.3s ease-out',
  };

  const containerStyle: CSSProperties = {
    aspectRatio: getAspectRatioStyle(),
  };

  if (isVideo) {
    return (
      <div
        id={id ? `${id}-container` : undefined}
        className={`relative overflow-hidden w-full h-full ${containerClassName}`}
        style={containerStyle}
        onClick={onClick}
      >
        <video
          id={id}
          src={src}
          poster={posterUrl}
          autoPlay={autoPlay}
          muted={muted}
          loop={loop}
          controls={controls}
          playsInline={playsInline}
          onError={onError}
          className={`w-full h-full ${className}`}
          style={mediaStyle}
        />
      </div>
    );
  }

  return (
    <div
      id={id ? `${id}-container` : undefined}
      className={`relative overflow-hidden w-full h-full ${containerClassName}`}
      style={containerStyle}
      onClick={onClick}
    >
      <img
        id={id}
        src={src}
        alt={alt}
        loading={loading}
        decoding={decoding}
        onError={onError}
        className={`w-full h-full ${className}`}
        style={mediaStyle}
      />
    </div>
  );
};
