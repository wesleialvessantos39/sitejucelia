// /src/types/proposals.ts

export type ProposalProjectType =
  | 'residencial'
  | 'comercial'
  | 'industrial'
  | 'galpao'
  | 'agronegocio'
  | 'institucional'
  | 'misto'
  | 'outro';

export type ProposalStructureType =
  | 'concreto_armado'
  | 'metalica'
  | 'mista'
  | 'alvenaria_estrutural'
  | 'madeira'
  | 'pre_moldado'
  | 'reforco_estrutural'
  | 'outro';

export type ProposalServiceType =
  | 'projeto_estrutural'
  | 'pre_dimensionamento'
  | 'avaliacao_estrutural'
  | 'pericia_tecnica'
  | 'laudo_vistoria'
  | 'reforma_ampliacao'
  | 'reforco_estrutural'
  | 'consultoria_obra'
  | 'outro';

export type ProposalStage =
  | 'estudo_preliminar'
  | 'anteprojeto'
  | 'projeto_arquitetonico_pronto'
  | 'obra_nao_iniciada'
  | 'fundacao_em_andamento'
  | 'estrutura_em_andamento'
  | 'reforma_edificacao_existente'
  | 'patologia_ou_sinistro';

export type ProposalStatus =
  | 'new'
  | 'in_analysis'
  | 'awaiting_info'
  | 'drafting'
  | 'sent'
  | 'converted'
  | 'closed'
  | 'cancelled';

export type ProposalPriority =
  | 'low'
  | 'normal'
  | 'high'
  | 'urgent';

export interface ProposalAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  path: string;
  created_at: string;
}

export interface ProposalRequest {
  id: string;
  created_at: string;
  updated_at: string;
  
  // Solicitante
  requester_name: string;
  requester_email: string;
  requester_phone: string;
  requester_whatsapp?: string | null;
  company_name?: string | null;
  city: string;
  state: string;

  // Dados da Obra
  project_type: ProposalProjectType;
  project_use?: string | null;
  location: string;
  area_m2: number | null;
  floors: number | null;
  structure_type: ProposalStructureType;
  service_type: ProposalServiceType;
  current_stage: ProposalStage;
  expected_start_date?: string | null;

  // Checklists Técnicos
  has_architectural_project: boolean;
  has_soil_report: boolean;
  has_structural_project: boolean;
  has_topography: boolean;
  description: string;
  technical_notes?: string | null;

  // Arquivos anexados
  attachments: ProposalAttachment[];

  // Gestão Administrativa
  status: ProposalStatus;
  priority: ProposalPriority;
  assigned_to?: string | null;
  admin_notes?: string | null;
  estimated_value?: number | null;
  last_contact_at?: string | null;
}

export interface CreateProposalDTO {
  requester_name: string;
  requester_email: string;
  requester_phone: string;
  requester_whatsapp?: string;
  company_name?: string;
  city: string;
  state: string;

  project_type: ProposalProjectType;
  project_use?: string;
  location: string;
  area_m2?: number | null;
  floors?: number | null;
  structure_type: ProposalStructureType;
  service_type: ProposalServiceType;
  current_stage: ProposalStage;
  expected_start_date?: string;

  has_architectural_project: boolean;
  has_soil_report: boolean;
  has_structural_project: boolean;
  has_topography: boolean;
  description: string;
  technical_notes?: string;

  attachments?: ProposalAttachment[];
}
