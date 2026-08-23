// /src/utils/domainUtils.ts

export interface DomainValidationResult {
  isValid: boolean;
  normalized: string;
  error?: string;
}

/**
 * Normaliza uma string de domínio:
 * - Remove espaços no início e fim
 * - Converte para minúsculas
 * - Remove http:// ou https://
 * - Remove www. opcional se solicitado, ou mantém conforme entrada
 * - Remove barras e caminhos finais
 * - Remove query strings e fragmentos
 */
export function normalizeDomain(input: string): string {
  if (!input) return '';

  let cleaned = input.trim().toLowerCase();

  // Remove protocolo
  cleaned = cleaned.replace(/^https?:\/\//i, '');

  // Remove barras no início
  cleaned = cleaned.replace(/^\/+/, '');

  // Remove caminhos, query strings ou hashes se o usuário colou uma URL completa
  const pathIndex = cleaned.search(/[/?#]/);
  if (pathIndex !== -1) {
    cleaned = cleaned.substring(0, pathIndex);
  }

  // Remove portas (ex: :3000, :80, :443) se houver
  const portIndex = cleaned.indexOf(':');
  if (portIndex !== -1) {
    cleaned = cleaned.substring(0, portIndex);
  }

  // Remove ponto final residual
  cleaned = cleaned.replace(/\.+$/, '');

  return cleaned.trim();
}

/**
 * Valida se a string fornecida representa um domínio ou subdomínio tecnicamente válido
 */
export function validateDomain(input: string): DomainValidationResult {
  if (!input || !input.trim()) {
    return {
      isValid: false,
      normalized: '',
      error: 'O nome do domínio não pode estar vazio.',
    };
  }

  const rawInput = input.trim();

  // Verifica se o usuário inseriu caminhos ou query strings
  if (rawInput.includes('/') && !rawInput.startsWith('http://') && !rawInput.startsWith('https://')) {
    const afterSlash = rawInput.split('/')[1];
    if (afterSlash && afterSlash.trim().length > 0 && !afterSlash.startsWith('?')) {
      return {
        isValid: false,
        normalized: normalizeDomain(rawInput),
        error: 'Informe apenas o domínio (ex: exemplo.com.br). Não inclua páginas internas ou caminhos.',
      };
    }
  }

  if (rawInput.includes('?') || rawInput.includes('#')) {
    return {
      isValid: false,
      normalized: normalizeDomain(rawInput),
      error: 'O domínio não deve conter parâmetros de busca (?) ou âncoras (#).',
    };
  }

  const normalized = normalizeDomain(rawInput);

  if (!normalized) {
    return {
      isValid: false,
      normalized: '',
      error: 'O domínio informado é inválido.',
    };
  }

  // Permite localhost apenas para desenvolvimento local
  if (normalized === 'localhost') {
    return {
      isValid: true,
      normalized,
    };
  }

  // Regex para validação rigorosa de domínios e subdomínios:
  // - Cada label pode ter de 1 a 63 caracteres alfanuméricos ou hífens
  // - Não pode começar nem terminar com hífen
  // - Deve ter pelo menos um ponto separando o TLD
  // - TLD deve ter pelo menos 2 caracteres alfabéticos
  const domainRegex = /^(?:[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?\.)+[a-zA-Z]{2,63}$/;

  if (!domainRegex.test(normalized)) {
    return {
      isValid: false,
      normalized,
      error: 'Formato de domínio inválido. Exemplo correto: seusite.com.br ou app.seusite.com',
    };
  }

  return {
    isValid: true,
    normalized,
  };
}

/**
 * Formata um domínio para URL completa com HTTPS
 */
export function formatDomainUrl(domain: string, isHttps = true): string {
  const normalized = normalizeDomain(domain);
  if (!normalized) return '#';
  const protocol = isHttps ? 'https://' : 'http://';
  return `${protocol}${normalized}`;
}

/**
 * Obtém o hostname atual de forma segura no navegador
 */
export function getCurrentHostname(): string {
  if (typeof window === 'undefined' || !window.location || !window.location.hostname) {
    return '';
  }
  return window.location.hostname.trim().toLowerCase();
}

/**
 * Identifica se o hostname atual pertence a ambiente de desenvolvimento, teste ou preview
 */
export function isDevelopmentOrPreviewHostname(hostname: string): boolean {
  if (!hostname) return true;

  const normalized = normalizeDomain(hostname);

  // Localhost e IPs locais
  if (
    normalized === 'localhost' ||
    normalized === '127.0.0.1' ||
    normalized === '0.0.0.0' ||
    normalized === '::1' ||
    normalized.endsWith('.local') ||
    normalized.endsWith('.internal')
  ) {
    return true;
  }

  // Ambientes de preview e containers Cloud Run / Firebase / Vercel / Netlify
  if (
    normalized.endsWith('.run.app') ||
    normalized.endsWith('.web.app') ||
    normalized.endsWith('.firebaseapp.com') ||
    normalized.endsWith('.vercel.app') ||
    normalized.endsWith('.netlify.app') ||
    normalized.includes('ais-dev-') ||
    normalized.includes('ais-pre-') ||
    normalized.includes('googleusercontent.com')
  ) {
    return true;
  }

  return false;
}

/**
 * Gera variantes de busca para um hostname (com e sem www)
 * Permite encontrar correspondência de forma robusta e transparente
 */
export function getDomainLookupVariants(hostname: string): string[] {
  const normalized = normalizeDomain(hostname);
  if (!normalized) return [];

  const variants = new Set<string>();
  variants.add(normalized);

  if (normalized.startsWith('www.')) {
    const withoutWww = normalized.replace(/^www\./, '');
    if (withoutWww) variants.add(withoutWww);
  } else {
    variants.add(`www.${normalized}`);
  }

  return Array.from(variants);
}

/**
 * Constrói a URL canônica completa para o domínio ativo e caminho fornecido
 */
export function buildCanonicalUrl(domain: string | null | undefined, pathname = '/'): string {
  const cleanPath = pathname.startsWith('/') ? pathname : `/${pathname}`;

  if (domain && domain.trim()) {
    const normalized = normalizeDomain(domain);
    return `https://${normalized}${cleanPath === '/' ? '' : cleanPath}`;
  }

  if (typeof window !== 'undefined' && window.location.origin) {
    return `${window.location.origin}${cleanPath === '/' ? '' : cleanPath}`;
  }

  return `https://juceliasantanaengencivil.com.br${cleanPath === '/' ? '' : cleanPath}`;
}

/**
 * Atualiza dinamicamente as tags canônicas e Open Graph do DOM para o domínio atual
 */
export function updateDocumentCanonicalUrl(url: string): void {
  if (typeof document === 'undefined' || !url) return;

  try {
    // Atualiza link canonical
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (canonicalLink) {
      canonicalLink.href = url;
    } else {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      canonicalLink.href = url;
      document.head.appendChild(canonicalLink);
    }

    // Atualiza og:url
    let ogUrl = document.querySelector('meta[property="og:url"]') as HTMLMetaElement | null;
    if (ogUrl) {
      ogUrl.content = url;
    }

    // Atualiza twitter:url
    let twitterUrl = document.querySelector('meta[name="twitter:url"]') as HTMLMetaElement | null;
    if (twitterUrl) {
      twitterUrl.content = url;
    }
  } catch (err) {
    console.warn('[domainUtils] Não foi possível atualizar tags canônicas do documento:', err);
  }
}

/**
 * Traduz mensagens de erro técnicas do Supabase/PostgREST/PostgreSQL para português claro e amigável
 */
export function formatDatabaseErrorMessage(err: any): string {
  if (!err) {
    return 'Ocorreu um erro inesperado. Por favor, tente novamente.';
  }

  const rawMessage: string = (
    typeof err === 'string'
      ? err
      : err.message || err.error_description || err.details || err.hint || JSON.stringify(err)
  ).trim();

  const lower = rawMessage.toLowerCase();

  // Tabela inexistente no Supabase ou cache de esquema desatualizado
  if (
    lower.includes("could not find the table 'public.site_domains'") ||
    lower.includes('relation "public.site_domains" does not exist') ||
    lower.includes('relation "site_domains" does not exist') ||
    lower.includes("table 'public.site_domains' in the schema cache") ||
    (lower.includes('site_domains') && lower.includes('schema cache'))
  ) {
    return "A tabela de domínios ('site_domains') ainda não foi criada no banco de dados Supabase. Execute o script 'supabase/schema.sql' no Editor SQL do seu painel Supabase para criar a estrutura.";
  }

  // Tabela inexistente genérica
  if (lower.includes('in the schema cache') || lower.includes('does not exist')) {
    return 'A estrutura do banco de dados ainda não foi inicializada no Supabase. Execute o script SQL no painel do Supabase.';
  }

  // Chave duplicada / restrição única
  if (
    lower.includes('duplicate key value') ||
    lower.includes('unique constraint') ||
    lower.includes('site_domains_normalized_domain_key')
  ) {
    return 'Este domínio já está cadastrado no sistema.';
  }

  // Políticas de segurança RLS / Permissão negada
  if (
    lower.includes('row-level security') ||
    lower.includes('permission denied') ||
    lower.includes('violates row-level security policy')
  ) {
    return 'Permissão negada. Apenas administradores autorizados têm permissão para alterar os domínios do site.';
  }

  // Falha de autenticação / JWT expirado
  if (
    lower.includes('jwt expired') ||
    lower.includes('invalid jwt') ||
    lower.includes('auth session missing') ||
    lower.includes('invalid refresh token')
  ) {
    return 'Sua sessão expirou. Por favor, faça login novamente no painel administrativo.';
  }

  // Erro de rede ou indisponibilidade
  if (
    lower.includes('failed to fetch') ||
    lower.includes('networkerror') ||
    lower.includes('network request failed') ||
    lower.includes('timeout')
  ) {
    return 'Erro de conexão com o servidor Supabase. Verifique sua conexão com a internet e tente novamente.';
  }

  // Se já for uma mensagem em português personalizada, preserva
  if (
    rawMessage.startsWith('O domínio') ||
    rawMessage.startsWith('Domínio') ||
    rawMessage.startsWith('Por favor') ||
    rawMessage.startsWith('Formato') ||
    rawMessage.startsWith('Permissão') ||
    rawMessage.startsWith('A tabela') ||
    rawMessage.startsWith('Sua sessão') ||
    rawMessage.startsWith('Erro de')
  ) {
    return rawMessage;
  }

  // Retorna a mensagem limpa
  return rawMessage;
}

