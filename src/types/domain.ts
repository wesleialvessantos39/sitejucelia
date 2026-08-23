// /src/types/domain.ts

export type DomainStatus = 'active' | 'pending' | 'needs_verification' | 'inactive';

export interface SiteDomain {
  id: string;
  domain: string;
  normalized_domain: string;
  label: string;
  description: string | null;
  is_active: boolean;
  is_primary: boolean;
  ssl_status?: DomainStatus | string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  // Campos populados via join com profiles quando disponível
  creator_name?: string | null;
  creator_email?: string | null;
  updater_name?: string | null;
  updater_email?: string | null;
}

export interface CreateDomainInput {
  domain: string;
  label: string;
  description?: string | null;
  is_active?: boolean;
  is_primary?: boolean;
  ssl_status?: DomainStatus | string | null;
}

export interface UpdateDomainInput {
  domain?: string;
  label?: string;
  description?: string | null;
  is_active?: boolean;
  is_primary?: boolean;
  ssl_status?: DomainStatus | string | null;
}
