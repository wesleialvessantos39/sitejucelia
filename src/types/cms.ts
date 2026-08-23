export type ProjectCategory = 'residencial' | 'comercial' | 'laudos' | 'agro';

export interface CMSProject {
  id?: string;
  title: string;
  category: ProjectCategory;
  category_label: string;
  city: string;
  area?: string;
  year?: string;
  description: string;
  services_executed: string[];
  cover_url: string;
  gallery: string[];
  video_url?: string;
  video_title?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CMSBlogPost {
  id?: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  cover_url?: string;
  author: string;
  category: string;
  published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CMSMediaItem {
  id?: string;
  title: string;
  type: 'photo' | 'video' | 'laudo_pdf';
  url: string;
  description?: string;
  tags?: string[];
  created_at?: string;
}
