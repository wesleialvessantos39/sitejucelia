// /src/types/mediaDisplay.ts

export type MediaObjectFit = 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';

export type MediaAspectRatio = 'auto' | '16:9' | '4:3' | '3:2' | '1:1' | '4:5' | '9:16' | '21:9';

export type MediaContext =
  | 'hero_slide'
  | 'institutional_photo'
  | 'project_main'
  | 'project_gallery'
  | 'project_thumbnail'
  | 'project_video'
  | 'video_thumbnail'
  | 'video_card'
  | 'video_modal'
  | 'visual_identity'
  | 'blog_cover'
  | 'general';

export interface MediaDisplaySetting {
  id: string; // Ex: "dashboard_slide:slide-01", "institutional_photo:profile-1", "project:obra-01:main", "project_image:img-01", "visual_identity:site_logo"
  media_type: 'image' | 'video' | 'icon';
  media_id?: string;
  context: MediaContext;
  object_fit: MediaObjectFit;
  object_position?: string; // Ex: "50% 50%" ou calculado via focal_x/focal_y
  position_x: number; // 0 a 100
  position_y: number; // 0 a 100
  zoom: number; // 1.0 a 3.0
  aspect_ratio: MediaAspectRatio;
  focal_x: number; // 0 a 100
  focal_y: number; // 0 a 100
  updated_at?: string;
  updated_by?: string | null;
}

export type MediaDisplaySettingsMap = Record<string, MediaDisplaySetting>;

export const DEFAULT_MEDIA_DISPLAY_SETTINGS: Record<MediaContext, Omit<MediaDisplaySetting, 'id' | 'context' | 'media_type'>> = {
  hero_slide: {
    object_fit: 'cover',
    position_x: 50,
    position_y: 50,
    focal_x: 50,
    focal_y: 50,
    zoom: 1.0,
    aspect_ratio: 'auto',
    object_position: '50% 50%',
  },
  institutional_photo: {
    object_fit: 'cover',
    position_x: 50,
    position_y: 50,
    focal_x: 50,
    focal_y: 50,
    zoom: 1.0,
    aspect_ratio: '4:5',
    object_position: '50% 50%',
  },
  project_main: {
    object_fit: 'cover',
    position_x: 50,
    position_y: 50,
    focal_x: 50,
    focal_y: 50,
    zoom: 1.0,
    aspect_ratio: '16:9',
    object_position: '50% 50%',
  },
  project_gallery: {
    object_fit: 'cover',
    position_x: 50,
    position_y: 50,
    focal_x: 50,
    focal_y: 50,
    zoom: 1.0,
    aspect_ratio: '16:9',
    object_position: '50% 50%',
  },
  project_thumbnail: {
    object_fit: 'cover',
    position_x: 50,
    position_y: 50,
    focal_x: 50,
    focal_y: 50,
    zoom: 1.0,
    aspect_ratio: '16:9',
    object_position: '50% 50%',
  },
  project_video: {
    object_fit: 'cover',
    position_x: 50,
    position_y: 50,
    focal_x: 50,
    focal_y: 50,
    zoom: 1.0,
    aspect_ratio: '16:9',
    object_position: '50% 50%',
  },
  video_thumbnail: {
    object_fit: 'cover',
    position_x: 50,
    position_y: 50,
    focal_x: 50,
    focal_y: 50,
    zoom: 1.0,
    aspect_ratio: '16:9',
    object_position: '50% 50%',
  },
  video_card: {
    object_fit: 'cover',
    position_x: 50,
    position_y: 50,
    focal_x: 50,
    focal_y: 50,
    zoom: 1.0,
    aspect_ratio: '16:9',
    object_position: '50% 50%',
  },
  video_modal: {
    object_fit: 'contain',
    position_x: 50,
    position_y: 50,
    focal_x: 50,
    focal_y: 50,
    zoom: 1.0,
    aspect_ratio: '16:9',
    object_position: '50% 50%',
  },
  visual_identity: {
    object_fit: 'contain',
    position_x: 50,
    position_y: 50,
    focal_x: 50,
    focal_y: 50,
    zoom: 1.0,
    aspect_ratio: '1:1',
    object_position: '50% 50%',
  },
  blog_cover: {
    object_fit: 'cover',
    position_x: 50,
    position_y: 50,
    focal_x: 50,
    focal_y: 50,
    zoom: 1.0,
    aspect_ratio: '16:9',
    object_position: '50% 50%',
  },
  general: {
    object_fit: 'cover',
    position_x: 50,
    position_y: 50,
    focal_x: 50,
    focal_y: 50,
    zoom: 1.0,
    aspect_ratio: 'auto',
    object_position: '50% 50%',
  },
};
