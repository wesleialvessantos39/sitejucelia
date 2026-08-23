// /src/utils/securityUtils.ts

/**
 * Módulo de Validação e Sanitização de Segurança
 * Fornece proteção contra XSS, injeção de scripts, URLs perigosas e validação de uploads.
 */

// Lista de esquemas de URL estritamente proibidos (XSS e RCE)
const DISALLOWED_URL_PROTOCOLS = ['javascript:', 'vbscript:', 'data:', 'file:'];

// Extensões de arquivos maliciosos ou executáveis bloqueadas categoricamente
export const DANGEROUS_EXTENSIONS = [
  'exe', 'bat', 'cmd', 'sh', 'bash', 'zsh', 'js', 'jsx', 'ts', 'tsx', 
  'html', 'htm', 'php', 'phtml', 'php3', 'php4', 'php5', 'phps', 
  'vbs', 'com', 'scr', 'msi', 'dll', 'jar', 'apk', 'app', 'ipa', 
  'cgi', 'pl', 'py', 'pyc', 'pyo', 'asp', 'aspx', 'jsp', 'jspx', 
  'svgz', 'hta', 'cpl', 'msc', 'ws', 'wsf'
];

// Limites rigorosos de tamanho de upload por categoria (em Bytes)
export const MAX_FILE_SIZES = {
  IMAGE: 10 * 1024 * 1024,      // 10 MB para fotos e imagens
  VIDEO: 100 * 1024 * 1024,     // 100 MB para vídeos de obras
  DOCUMENT: 50 * 1024 * 1024,   // 50 MB para laudos e projetos técnicos
  PROPOSAL_ATTACHMENT: 30 * 1024 * 1024 // 30 MB para plantas e anexos
};

// MIME Types permitidos por categoria
export const ALLOWED_MIME_TYPES = {
  IMAGE: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  VIDEO: ['video/mp4', 'video/webm', 'video/quicktime'],
  DOCUMENT: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'image/jpeg',
    'image/png',
    'image/webp'
  ],
};

/**
 * Sanitiza e valida URLs antes de renderização ou persistência.
 * Retorna uma URL segura ou string vazia se for identificada tentativa de injeção.
 */
export function sanitizeUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';
  const trimmed = url.trim();
  
  const lower = trimmed.toLowerCase();
  for (const protocol of DISALLOWED_URL_PROTOCOLS) {
    if (lower.startsWith(protocol)) {
      console.warn(`[Segurança] URL perigosa bloqueada com protocolo proibido: ${protocol}`);
      return '';
    }
  }

  // Se começar com barras relativas ou protocolos web seguros
  if (
    trimmed.startsWith('/') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('mailto:') ||
    trimmed.startsWith('tel:')
  ) {
    return trimmed;
  }

  return '';
}

/**
 * Sanitiza strings para exibição segura sem injeção de HTML/scripts
 */
export function sanitizePlainText(text?: string | null): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/[<>]/g, '') // remove tags básicas de script/HTML
    .trim();
}

/**
 * Validação rigorosa de arquivo para Upload (Extensão + MIME Type + Tamanho)
 */
export function validateUploadFile(
  file: File,
  category: 'IMAGE' | 'VIDEO' | 'DOCUMENT' | 'PROPOSAL_ATTACHMENT'
): { isValid: boolean; errorMessage?: string } {
  if (!file) {
    return { isValid: false, errorMessage: 'Nenhum arquivo fornecido para validação.' };
  }

  const rawExt = file.name.split('.').pop()?.toLowerCase() || '';

  // 1. Verificação de Extensão Perigosa
  if (!rawExt || DANGEROUS_EXTENSIONS.includes(rawExt)) {
    return {
      isValid: false,
      errorMessage: `O formato de arquivo .${rawExt} é restrito por motivos de segurança e não pode ser enviado.`,
    };
  }

  // 2. Verificação de Tamanho Máximo
  const maxSize = MAX_FILE_SIZES[category] || MAX_FILE_SIZES.DOCUMENT;
  if (file.size > maxSize) {
    const sizeInMb = Math.round(maxSize / (1024 * 1024));
    return {
      isValid: false,
      errorMessage: `O arquivo excede o limite máximo permitido de ${sizeInMb} MB.`,
    };
  }

  // 3. Verificação de MIME Type por categoria
  if (category === 'IMAGE') {
    const allowed = ALLOWED_MIME_TYPES.IMAGE;
    if (file.type && !allowed.includes(file.type.toLowerCase())) {
      // Extensões de imagem permitidas
      const validImgExts = ['jpg', 'jpeg', 'png', 'webp', 'avif'];
      if (!validImgExts.includes(rawExt)) {
        return {
          isValid: false,
          errorMessage: `Tipo de imagem não suportado. Formatos aceitos: JPEG, PNG, WEBP e AVIF.`,
        };
      }
    }
  }

  if (category === 'VIDEO') {
    const allowed = ALLOWED_MIME_TYPES.VIDEO;
    if (file.type && !allowed.includes(file.type.toLowerCase())) {
      const validVidExts = ['mp4', 'webm', 'mov'];
      if (!validVidExts.includes(rawExt)) {
        return {
          isValid: false,
          errorMessage: `Tipo de vídeo não suportado. Formatos aceitos: MP4, WebM e MOV.`,
        };
      }
    }
  }

  if (category === 'DOCUMENT' || category === 'PROPOSAL_ATTACHMENT') {
    const allowed = ALLOWED_MIME_TYPES.DOCUMENT;
    if (file.type && !allowed.includes(file.type.toLowerCase())) {
      const validDocExts = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'jpg', 'jpeg', 'png', 'webp', 'dwg', 'dxf', 'zip', 'rar'];
      if (!validDocExts.includes(rawExt)) {
        return {
          isValid: false,
          errorMessage: `Formato de documento não permitido. Aceitos: PDF, Office, Imagens e Plantas Técnicas.`,
        };
      }
    }
  }

  return { isValid: true };
}

/**
 * Cria um nome de arquivo higienizado e seguro com UUID/timestamp
 */
export function generateSafeStoragePath(folder: string, originalFileName: string, prefix = 'asset'): string {
  const rawExt = originalFileName.split('.').pop()?.toLowerCase() || 'dat';
  const cleanExt = rawExt.replace(/[^a-z0-9]/g, '');
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  
  const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
  return `${cleanFolder}/${prefix}_${timestamp}_${randomSuffix}.${cleanExt}`;
}
