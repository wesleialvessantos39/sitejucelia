// /src/utils/auditFormatter.ts

export interface HumanizedAuditItem {
  title: string;
  category: 'users' | 'theme' | 'documents' | 'invites' | 'content' | 'system' | 'domains';
  categoryLabel: string;
  badgeColor: string; // Classes Tailwind para fundo e texto do badge
  description: string;
  detailsList: Array<{ label: string; value: string }>;
  isCritical: boolean;
}

/**
 * Tradutor e decodificador amigável de chaves de aparência/tema para português
 */
const THEME_FIELD_TRANSLATIONS: Record<string, string> = {
  bg_primary: 'Fundo Principal',
  bg_secondary: 'Fundo Secundário',
  color_primary: 'Cor Primária (Dourado)',
  color_secondary: 'Cor Secundária (Azul Profundo)',
  color_titles: 'Cor dos Títulos',
  color_text: 'Cor do Texto Principal',
  color_buttons: 'Cor dos Botões de Ação',
  color_button_text: 'Texto dos Botões',
  color_accent: 'Cor de Destaque',
  color_border: 'Cor das Bordas e Divisores',
  color_cards: 'Cor dos Cards e Painéis',
  primary_color: 'Cor Principal da Marca',
  secondary_color: 'Cor Secundária de Destaque',
  background_color: 'Cor de Fundo da Aplicação',
  text_color: 'Cor do Texto Principal',
  font_family: 'Família Tipográfica',
  card_style: 'Estilo dos Cartões e Painéis',
  border_radius: 'Raio de Borda (Bordas Arredondadas)',
  logo_url: 'Logotipo Oficial',
  banner_url: 'Banner Principal',
  accent_color: 'Cor de Realce Dourado',
  header_bg: 'Cor do Cabeçalho Superior',
  footer_bg: 'Cor do Rodapé Institucional',
  button_style: 'Estilo dos Botões de Ação',
  hero_title: 'Título da Seção Hero',
  hero_subtitle: 'Subtítulo da Seção Hero',
  site_logo: 'Logotipo Principal do Site',
  site_icon: 'Ícone/Favicon do Sistema',
  founder_photo: 'Foto da Fundadora (Jucélia Santana)',
  office_photo: 'Foto do Escritório/Fachada',
  hero_background: 'Imagem de Fundo da Seção Hero',
  about_background: 'Imagem da Seção Sobre',
  contact_background: 'Imagem da Seção de Contato',
};

/**
 * Mapeador e formatador central de ações administrativas para apresentação executiva
 */
export function formatAuditAction(action: string, details: any, entityType?: string): HumanizedAuditItem {
  const safeAction = (action || '').toUpperCase();
  const safeDetails = details && typeof details === 'object' ? details : {};

  // 1. AÇÕES DE USUÁRIOS E PERMISSÕES
  if (
    safeAction.includes('USER') ||
    safeAction.includes('ROLE') ||
    safeAction.includes('ADMIN') ||
    entityType === 'profiles'
  ) {
    if (safeAction === 'PROMOTE_USER_TO_ADMIN' || safeAction === 'PROMOTE_TO_ADMIN') {
      return {
        title: 'Promoção a Administrador',
        category: 'users',
        categoryLabel: 'Controle de Acessos',
        badgeColor: 'bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30',
        description: `O usuário ${safeDetails.target_name || safeDetails.target_email || 'selecionado'} foi promovido ao cargo de Administrador com acesso total ao painel.`,
        detailsList: [
          { label: 'E-mail do Usuário', value: safeDetails.target_email || 'Não informado' },
          { label: 'Nova Função', value: 'Administrador do Sistema' },
        ],
        isCritical: true,
      };
    }

    if (safeAction === 'DEMOTE_ADMIN_TO_USER' || safeAction === 'DEMOTE_TO_USER') {
      return {
        title: 'Rebaixamento para Usuário',
        category: 'users',
        categoryLabel: 'Controle de Acessos',
        badgeColor: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        description: `Os privilégios administrativos de ${safeDetails.target_name || safeDetails.target_email || 'usuário'} foram revogados.`,
        detailsList: [
          { label: 'E-mail do Usuário', value: safeDetails.target_email || 'Não informado' },
          { label: 'Nova Função', value: 'Usuário Padrão' },
        ],
        isCritical: true,
      };
    }

    if (safeAction === 'SUSPEND_USER' || safeAction === 'SUSPEND_USER_ACCOUNT') {
      return {
        title: 'Suspensão de Conta de Usuário',
        category: 'users',
        categoryLabel: 'Segurança de Usuários',
        badgeColor: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
        description: `O acesso do usuário ${safeDetails.target_name || safeDetails.target_email || 'selecionado'} foi suspenso temporariamente.`,
        detailsList: [
          { label: 'E-mail', value: safeDetails.target_email || 'Não informado' },
          { label: 'Status Aplicado', value: 'Suspenso (Acesso Bloqueado)' },
        ],
        isCritical: true,
      };
    }

    if (safeAction === 'ACTIVATE_USER' || safeAction === 'REACTIVATE_USER' || safeAction === 'ACTIVATE_USER_ACCOUNT') {
      return {
        title: 'Reativação de Conta de Usuário',
        category: 'users',
        categoryLabel: 'Segurança de Usuários',
        badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
        description: `A conta do usuário ${safeDetails.target_name || safeDetails.target_email || 'selecionado'} foi ativada com sucesso.`,
        detailsList: [
          { label: 'E-mail', value: safeDetails.target_email || 'Não informado' },
          { label: 'Status Aplicado', value: 'Ativo (Acesso Liberado)' },
        ],
        isCritical: false,
      };
    }

    if (safeAction === 'DELETE_USER' || safeAction === 'DELETE_ADMIN' || safeAction === 'DELETE_USER_PROFILE') {
      return {
        title: safeAction === 'DELETE_ADMIN' ? 'Exclusão Definitiva de Administrador' : 'Exclusão Definitiva de Usuário',
        category: 'users',
        categoryLabel: 'Segurança e Contas',
        badgeColor: 'bg-rose-600/20 text-rose-300 border border-rose-500/40',
        description: `O cadastro de ${safeDetails.target_name || safeDetails.target_email || 'usuário'} foi permanentemente excluído do banco de dados.`,
        detailsList: [
          { label: 'E-mail Excluído', value: safeDetails.target_email || 'Não informado' },
          { label: 'Função Anterior', value: safeDetails.target_role === 'admin' ? 'Administrador' : 'Usuário Comum' },
        ],
        isCritical: true,
      };
    }

    if (safeAction === 'CREATE_USER' || safeAction === 'SIGNUP_USER') {
      return {
        title: 'Cadastro de Novo Usuário',
        category: 'users',
        categoryLabel: 'Contas e Acessos',
        badgeColor: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
        description: `Novo cadastro realizado por ${safeDetails.full_name || safeDetails.email || 'usuário'}.`,
        detailsList: [
          { label: 'Nome Completo', value: safeDetails.full_name || 'Não informado' },
          { label: 'E-mail', value: safeDetails.email || 'Não informado' },
          { label: 'Código de Convite Usado', value: safeDetails.invite_code || 'Não informado' },
        ],
        isCritical: false,
      };
    }

    if (safeAction === 'UPDATE_USER' || safeAction === 'UPDATE_USER_PROFILE') {
      return {
        title: 'Atualização de Perfil de Usuário',
        category: 'users',
        categoryLabel: 'Gestão de Usuários',
        badgeColor: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
        description: `Informações cadastrais foram atualizadas para o e-mail ${safeDetails.user_email || 'usuário'}.`,
        detailsList: [
          { label: 'Campos Modificados', value: Array.isArray(safeDetails.updated_fields) ? safeDetails.updated_fields.join(', ') : 'Dados de Perfil' },
        ],
        isCritical: false,
      };
    }
  }

  // 2. AÇÕES DE CONVITES & TOKENS
  if (safeAction.includes('INVITE') || entityType === 'invite_codes') {
    if (safeAction === 'CREATE_INVITE_CODE' || safeAction === 'GENERATE_INVITE_CODE') {
      return {
        title: 'Geração de Código de Convite',
        category: 'invites',
        categoryLabel: 'Gestão de Convites',
        badgeColor: 'bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30',
        description: `Um novo código de convite de uso restrito foi gerado (${safeDetails.code || 'JS-ENG-XXXX'}).`,
        detailsList: [
          { label: 'Código Gerado', value: safeDetails.code || 'JS-ENG-XXXX' },
          { label: 'Validade Configurada', value: safeDetails.expires_in_days ? `${safeDetails.expires_in_days} dias` : 'Padrão do Sistema' },
        ],
        isCritical: false,
      };
    }

    if (safeAction === 'USE_INVITE_CODE') {
      return {
        title: 'Consumo de Código de Convite',
        category: 'invites',
        categoryLabel: 'Gestão de Convites',
        badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
        description: `O código de convite ${safeDetails.code || ''} foi utilizado com sucesso no cadastro.`,
        detailsList: [
          { label: 'Código Consumido', value: safeDetails.code || 'Não informado' },
          { label: 'Usuário Beneficiado', value: safeDetails.used_by_email || 'Não informado' },
        ],
        isCritical: false,
      };
    }

    if (safeAction === 'CANCEL_INVITE_CODE') {
      return {
        title: 'Cancelamento de Código de Convite',
        category: 'invites',
        categoryLabel: 'Gestão de Convites',
        badgeColor: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        description: `O convite ${safeDetails.code || ''} foi cancelado por um administrador e invalidado para novos cadastros.`,
        detailsList: [
          { label: 'Código Cancelado', value: safeDetails.code || 'Não informado' },
        ],
        isCritical: true,
      };
    }

    if (safeAction === 'DELETE_INVITE_CODE') {
      return {
        title: 'Exclusão de Código de Convite',
        category: 'invites',
        categoryLabel: 'Gestão de Convites',
        badgeColor: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
        description: `Registro do convite ${safeDetails.code || ''} foi removido do banco de dados.`,
        detailsList: [
          { label: 'Código Excluído', value: safeDetails.code || 'Não informado' },
        ],
        isCritical: false,
      };
    }
  }

  // 3. AÇÕES DE IDENTIDADE VISUAL, ENQUADRAMENTO DE MÍDIA, TEMA E APARÊNCIA
  if (
    safeAction.includes('MEDIA_DISPLAY') ||
    entityType === 'media_display_settings'
  ) {
    if (safeAction.includes('RESET')) {
      return {
        title: 'Restauração de Enquadramento Padrão',
        category: 'theme',
        categoryLabel: 'Enquadramento e Mídia',
        badgeColor: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        description: `O enquadramento da mídia ${safeDetails.media_key || ''} foi restaurado para a proporção e foco originais.`,
        detailsList: [
          { label: 'Chave da Mídia', value: safeDetails.media_key || 'Não informado' },
          { label: 'Ação', value: 'Restauração de Padrão' },
        ],
        isCritical: false,
      };
    }

    return {
      title: 'Ajuste de Enquadramento e Foco Visual',
      category: 'theme',
      categoryLabel: 'Enquadramento e Mídia',
      badgeColor: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      description: `Ajuste milimétrico de foco (X: ${safeDetails.focal_x ?? safeDetails.position_x ?? 50}%, Y: ${safeDetails.focal_y ?? safeDetails.position_y ?? 50}%), zoom (${safeDetails.zoom ?? 1.0}x) e modo (${safeDetails.object_fit || 'cover'}).`,
      detailsList: [
        { label: 'Chave da Mídia', value: safeDetails.media_key || 'Não informado' },
        { label: 'Modo de Enquadramento', value: safeDetails.object_fit || 'cover' },
        { label: 'Ponto Focal (X / Y)', value: `${safeDetails.focal_x ?? 50}% / ${safeDetails.focal_y ?? 50}%` },
        { label: 'Nível de Zoom', value: `${Number(safeDetails.zoom || 1.0).toFixed(2)}x` },
      ],
      isCritical: false,
    };
  }

  if (
    safeAction.includes('THEME') ||
    safeAction.includes('APPEARANCE') ||
    safeAction.includes('VISUAL') ||
    entityType === 'theme_settings' ||
    entityType === 'visual_identity'
  ) {
    const detailsList: Array<{ label: string; value: string }> = [];

    // Traduz chaves brutas de tema para nomes amigáveis
    if (safeDetails && typeof safeDetails === 'object') {
      Object.entries(safeDetails).forEach(([key, val]) => {
        if (key === 'action' || key === 'timestamp') return;
        const translatedKey = THEME_FIELD_TRANSLATIONS[key] || key.replace(/_/g, ' ').toUpperCase();
        let formattedVal = String(val);
        if (typeof val === 'boolean') formattedVal = val ? 'Ativado' : 'Desativado';
        detailsList.push({ label: translatedKey, value: formattedVal });
      });
    }

    return {
      title: 'Atualização da Identidade Visual e Cores',
      category: 'theme',
      categoryLabel: 'Aparência e Identidade',
      badgeColor: 'bg-purple-500/15 text-purple-300 border border-purple-500/30',
      description: 'Personalização do layout institucional, paleta de cores ou tipografia do portal.',
      detailsList: detailsList.length > 0 ? detailsList.slice(0, 4) : [{ label: 'Modificações', value: 'Configurações de Tema salvas' }],
      isCritical: false,
    };
  }

  // 4. AÇÕES DE DOCUMENTOS E ACERVO TÉCNICO
  if (safeAction.includes('DOCUMENT') || entityType === 'technical_documents' || entityType === 'documents') {
    if (safeAction.includes('CREATE') || safeAction.includes('UPLOAD')) {
      return {
        title: 'Upload de Documento Técnico',
        category: 'documents',
        categoryLabel: 'Acervo de Documentos',
        badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
        description: `Novo arquivo técnico adicionado: ${safeDetails.title || safeDetails.name || 'Documento Técnico'}.`,
        detailsList: [
          { label: 'Título do Documento', value: safeDetails.title || safeDetails.name || 'Sem título' },
          { label: 'Categoria', value: safeDetails.category || 'Geral' },
        ],
        isCritical: false,
      };
    }

    if (safeAction.includes('DELETE')) {
      return {
        title: 'Exclusão de Documento Técnico',
        category: 'documents',
        categoryLabel: 'Acervo de Documentos',
        badgeColor: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
        description: `O arquivo ${safeDetails.title || safeDetails.name || 'documento'} foi removido do acervo público.`,
        detailsList: [
          { label: 'Documento Excluído', value: safeDetails.title || safeDetails.name || 'Não informado' },
        ],
        isCritical: true,
      };
    }
  }

  // 5. AÇÕES DE CONTEÚDO E ARTIGOS
  if (
    safeAction.includes('POST') ||
    safeAction.includes('ARTICLE') ||
    safeAction.includes('CONTENT') ||
    entityType === 'articles' ||
    entityType === 'site_content'
  ) {
    return {
      title: 'Atualização de Conteúdo Institucional',
      category: 'content',
      categoryLabel: 'Gestão de Conteúdo',
      badgeColor: 'bg-blue-500/15 text-blue-300 border border-blue-500/30',
      description: `Modificação realizada em conteúdos editoriais ou seções do portal (${safeDetails.title || safeDetails.section || 'Geral'}).`,
      detailsList: [
        { label: 'Seção / Título', value: safeDetails.title || safeDetails.section || 'Geral' },
      ],
      isCritical: false,
    };
  }

  // 5. AÇÕES DE GERENCIAMENTO DE DOMÍNIOS (ETAPA 18)
  if (safeAction.includes('DOMAIN') || entityType === 'site_domains') {
    if (safeAction === 'DOMAIN_CREATED') {
      return {
        title: 'Cadastro de Domínio do Site',
        category: 'domains',
        categoryLabel: 'Gerenciamento de Domínios',
        badgeColor: 'bg-[#C5A059]/15 text-[#C5A059] border border-[#C5A059]/30',
        description: `O domínio "${safeDetails.domain || safeDetails.normalized_domain || 'novo domínio'}" (${safeDetails.label || 'Identificação'}) foi cadastrado com sucesso no sistema.`,
        detailsList: [
          { label: 'Domínio', value: safeDetails.domain || 'Não informado' },
          { label: 'Domínio Normalizado', value: safeDetails.normalized_domain || 'Não informado' },
          { label: 'Rótulo / Identificação', value: safeDetails.label || 'Principal' },
          { label: 'Domínio Principal', value: safeDetails.is_primary ? 'Sim' : 'Não' },
        ],
        isCritical: false,
      };
    }

    if (safeAction === 'DOMAIN_UPDATED') {
      return {
        title: 'Atualização de Domínio',
        category: 'domains',
        categoryLabel: 'Gerenciamento de Domínios',
        badgeColor: 'bg-sky-500/15 text-sky-400 border border-sky-500/30',
        description: `As informações do domínio "${safeDetails.domain || safeDetails.normalized_domain || ''}" foram atualizadas.`,
        detailsList: [
          { label: 'Domínio', value: safeDetails.domain || 'Não informado' },
          { label: 'Rótulo', value: safeDetails.label || 'Atualizado' },
          { label: 'Status', value: safeDetails.is_active ? 'Ativo' : 'Inativo' },
        ],
        isCritical: false,
      };
    }

    if (safeAction === 'DOMAIN_ACTIVATED') {
      return {
        title: 'Ativação de Domínio',
        category: 'domains',
        categoryLabel: 'Gerenciamento de Domínios',
        badgeColor: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30',
        description: `O domínio "${safeDetails.domain || safeDetails.normalized_domain || ''}" foi ativado para roteamento e acesso.`,
        detailsList: [
          { label: 'Domínio', value: safeDetails.domain || 'Não informado' },
          { label: 'Novo Status', value: 'Ativo' },
        ],
        isCritical: false,
      };
    }

    if (safeAction === 'DOMAIN_DEACTIVATED') {
      return {
        title: 'Desativação de Domínio',
        category: 'domains',
        categoryLabel: 'Gerenciamento de Domínios',
        badgeColor: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
        description: `O domínio "${safeDetails.domain || safeDetails.normalized_domain || ''}" foi desativado temporariamente.`,
        detailsList: [
          { label: 'Domínio', value: safeDetails.domain || 'Não informado' },
          { label: 'Novo Status', value: 'Inativo' },
        ],
        isCritical: true,
      };
    }

    if (safeAction === 'DOMAIN_SET_PRIMARY') {
      return {
        title: 'Definição de Domínio Principal',
        category: 'domains',
        categoryLabel: 'Gerenciamento de Domínios',
        badgeColor: 'bg-[#C5A059]/20 text-[#C5A059] border border-[#C5A059]/40',
        description: `O domínio "${safeDetails.domain || safeDetails.normalized_domain || ''}" foi definido como o Domínio Principal oficial da plataforma.`,
        detailsList: [
          { label: 'Domínio Principal', value: safeDetails.domain || 'Não informado' },
          { label: 'Status', value: 'Principal Ativo' },
        ],
        isCritical: true,
      };
    }

    if (safeAction === 'DOMAIN_DELETED') {
      return {
        title: 'Exclusão de Domínio',
        category: 'domains',
        categoryLabel: 'Gerenciamento de Domínios',
        badgeColor: 'bg-rose-500/15 text-rose-400 border border-rose-500/30',
        description: `O domínio "${safeDetails.domain || safeDetails.normalized_domain || ''}" foi removido permanentemente do banco de dados.`,
        detailsList: [
          { label: 'Domínio Excluído', value: safeDetails.domain || 'Não informado' },
        ],
        isCritical: true,
      };
    }
  }

  // 6. AÇÕES DE AUDITORIA E LIMPEZA DE LOGS
  if (
    safeAction === 'CLEAR_ALL_AUDIT_LOGS' ||
    safeAction === 'DELETE_AUDIT_LOG' ||
    safeAction === 'DELETE_AUDIT_LOGS_BATCH' ||
    entityType === 'admin_audit_logs'
  ) {
    if (safeAction === 'CLEAR_ALL_AUDIT_LOGS') {
      return {
        title: 'Limpeza Geral do Histórico de Auditoria',
        category: 'system',
        categoryLabel: 'Segurança e Logs',
        badgeColor: 'bg-rose-500/20 text-rose-300 border border-rose-500/40',
        description: 'Todo o histórico de registros e logs de auditoria administrativa foi excluído permanentemente do banco de dados.',
        detailsList: [
          { label: 'Operação', value: 'Exclusão Completa de Logs' },
          { label: 'Data da Limpeza', value: safeDetails.cleared_at || 'Registrado' },
        ],
        isCritical: true,
      };
    }

    return {
      title: 'Exclusão de Registros de Auditoria',
      category: 'system',
      categoryLabel: 'Segurança e Logs',
      badgeColor: 'bg-amber-500/15 text-amber-300 border border-amber-500/30',
      description: 'Registros específicos de auditoria foram removidos permanentemente do banco de dados.',
      detailsList: [
        { label: 'Total Removidos', value: String(safeDetails.deleted_count || 1) },
      ],
      isCritical: true,
    };
  }

  // 6. CASO PADRÃO (GENÉRICO HUMANIZADO)
  const readableTitle = safeAction
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^\w/, (c) => c.toUpperCase());

  const genericDetails: Array<{ label: string; value: string }> = [];
  if (safeDetails && typeof safeDetails === 'object') {
    Object.entries(safeDetails).slice(0, 3).forEach(([k, v]) => {
      genericDetails.push({
        label: k.replace(/_/g, ' ').toUpperCase(),
        value: typeof v === 'object' ? JSON.stringify(v) : String(v),
      });
    });
  }

  return {
    title: readableTitle || 'Operação Administrativa Registrada',
    category: 'system',
    categoryLabel: 'Sistema e Auditoria',
    badgeColor: 'bg-slate-500/15 text-slate-300 border border-slate-500/30',
    description: `Ação registrada para a entidade ${entityType || 'Geral'}.`,
    detailsList: genericDetails.length > 0 ? genericDetails : [{ label: 'Status', value: 'Executado com sucesso' }],
    isCritical: false,
  };
}
