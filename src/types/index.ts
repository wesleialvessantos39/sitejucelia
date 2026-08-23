// /src/types/index.ts

export interface ServiceItem {
  id: string;
  title: string;
  shortDescription: string;
  fullDescription: string;
  iconName: string;
  category: 'estrutural' | 'laudos' | 'agronegocio' | 'gestao' | 'consultoria';
  deliverables: string[];
  normasTecnicas: string[];
}

export interface ProjectItem {
  id: string;
  title: string;
  category: 'estrutural' | 'metalicas' | 'agronegocio' | 'industriais' | 'consultoria' | 'fiscalizacao' | 'laudos' | 'residencial';
  categoryLabel: string;
  location: string;
  year?: string;
  area?: string;
  status: string;
  description: string;
  challenge: string;
  solution: string;
  imageUrl: string;
  gallery: string[];
  highlights: string[];
  servicesExecuted: string[];
  videoUrl?: string;
  videoTitle?: string;
  hasVideo?: boolean;
}

export interface DifferentialItem {
  id: string;
  titulo: string;
  descricao: string;
  icone: string;
  ordem: number;
  ativo: boolean;
  number?: string;
  title?: string;
  description?: string;
  iconName?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export interface ColorToken {
  name: string;
  hex: string;
  role: string;
  usage: string;
  rgb: string;
}

export interface TypographyToken {
  level: string;
  fontFamily: string;
  sizeDesktop: string;
  sizeMobile: string;
  weight: string;
  lineHeight: string;
  tracking: string;
  purpose: string;
}

export interface DashboardSlide {
  id: string;
  title: string;
  description?: string;
  image_url: string;
  storage_path?: string | null;
  order_index: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InstitutionalPhoto {
  id: string;
  title: string;
  category?: string;
  pose?: string;
  outfit?: string;
  caption?: string;
  image_url: string;
  storage_path?: string | null;
  is_primary: boolean;
  order_index: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InviteCode {
  id: string;
  code: string;
  created_by?: string | null;
  created_by_email?: string | null;
  created_at: string;
  expires_at?: string | null;
  status: 'pending' | 'used' | 'expired' | 'canceled';
  used_at?: string | null;
  used_by?: string | null;
  used_by_email?: string | null;
  max_uses: number;
  uses_count: number;
}

export * from './analytics';
export * from './backup';

