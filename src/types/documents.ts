// /src/types/documents.ts

export type DocumentCategory =
  | 'Laudos Técnicos'
  | 'Artigos Técnicos'
  | 'Memorial Descritivo'
  | 'Relatórios'
  | 'Materiais Educativos'
  | 'Normas e Referências'
  | 'Engenharia Civil'
  | 'Segurança e Prevenção'
  | 'Outros';

export type DocumentType =
  | 'PDF'
  | 'Documento Técnico'
  | 'Artigo'
  | 'Relatório'
  | 'Memorial'
  | 'Guia'
  | 'Planilha'
  | 'Apresentação'
  | 'Outro';

export interface TechnicalDocument {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: DocumentCategory | string;
  document_type: DocumentType | string;
  file_name: string;
  file_path: string;
  file_url: string;
  mime_type: string;
  file_size: number; // bytes
  thumbnail_url?: string | null;
  is_published: boolean;
  is_featured: boolean;
  order_index: number;
  downloads_count?: number;
  created_at: string;
  updated_at: string;
  published_at?: string | null;
  created_by?: string | null;
  updated_by?: string | null;
  deleted_at?: string | null;
}

export type TechnicalDocumentInsert = Omit<
  TechnicalDocument,
  'id' | 'created_at' | 'updated_at'
> & {
  id?: string;
  created_at?: string;
  updated_at?: string;
};

export type TechnicalDocumentUpdate = Partial<
  Omit<TechnicalDocument, 'id' | 'created_at'>
>;
