// /src/data/engineerPhotos.ts

export interface EngineerPhoto {
  id: string;
  number: number;
  title: string;
  category: string;
  pose: string;
  outfit: string;
  caption: string;
  url: string;
  filename: string;
  importUrl: string;
}

// URLs padrão de referência (alimentadas prioritariamente via Supabase Storage)
const DEFAULT_PROFILE_URL = 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80';

// A foto principal para o Perfil Institucional (Seção Sobre)
export const INSTITUTIONAL_PHOTO: EngineerPhoto = {
  id: 'foto-quadro',
  number: 1,
  title: 'Retrato Institucional — Engª Jucélia Santana',
  category: 'Engenharia Contemporânea',
  pose: 'Postura contemporânea e ágil no planejamento técnico',
  outfit: 'Colete alfaiataria institucional e calça jeans premium',
  caption: 'Soluções modernas de engenharia civil aliando agilidade, segurança estrutural e conformidade NBR/ABNT.',
  url: DEFAULT_PROFILE_URL,
  filename: 'foto_perfil_01.jpg',
  importUrl: DEFAULT_PROFILE_URL
};

export const PROFILE_PHOTOS: EngineerPhoto[] = [
  {
    id: 'perfil-1',
    number: 1,
    title: 'Engª Jucélia Santana — Perfil 1',
    category: 'Perfil Profissional',
    pose: 'Atuação Executiva e Consultoria',
    outfit: 'Engenheira Civil',
    caption: 'Engª Jucélia Santana - Engenharia Civil e Projetos.',
    url: DEFAULT_PROFILE_URL,
    filename: 'foto_perfil_01.jpg',
    importUrl: DEFAULT_PROFILE_URL
  },
  {
    id: 'perfil-2',
    number: 2,
    title: 'Engª Jucélia Santana — Perfil 2',
    category: 'Perfil Profissional',
    pose: 'Atuação Executiva e Consultoria',
    outfit: 'Engenheira Civil',
    caption: 'Engª Jucélia Santana - Engenharia Civil e Projetos.',
    url: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=1200&q=80',
    filename: 'foto_perfil_02.jpg',
    importUrl: 'https://images.unsplash.com/photo-1580894732444-8ecded7900cd?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'perfil-3',
    number: 3,
    title: 'Engª Jucélia Santana — Perfil 3',
    category: 'Perfil Profissional',
    pose: 'Atuação Executiva e Consultoria',
    outfit: 'Engenheira Civil',
    caption: 'Engª Jucélia Santana - Engenharia Civil e Projetos.',
    url: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1200&q=80',
    filename: 'foto_perfil_03.jpg',
    importUrl: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'perfil-4',
    number: 4,
    title: 'Engª Jucélia Santana — Perfil 4',
    category: 'Perfil Profissional',
    pose: 'Atuação Executiva e Consultoria',
    outfit: 'Engenheira Civil',
    caption: 'Engª Jucélia Santana - Engenharia Civil e Projetos.',
    url: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&w=1200&q=80',
    filename: 'foto_perfil_04.jpg',
    importUrl: 'https://images.unsplash.com/photo-1573496799652-408c2ac9fe98?auto=format&fit=crop&w=1200&q=80'
  },
  {
    id: 'perfil-5',
    number: 5,
    title: 'Engª Jucélia Santana — Perfil 5',
    category: 'Perfil Profissional',
    pose: 'Atuação Executiva e Consultoria',
    outfit: 'Engenheira Civil',
    caption: 'Engª Jucélia Santana - Engenharia Civil e Projetos.',
    url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80',
    filename: 'foto_perfil_05.jpg',
    importUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80'
  }
];

export const ENGINEER_PHOTOS: EngineerPhoto[] = PROFILE_PHOTOS;





