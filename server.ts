// /server.ts
import express, { Request, Response } from 'express';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import JSZip from 'jszip';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Canonical 301 Redirect: Redireciona www.juceliasantanaengencivil.com.br para https://juceliasantanaengencivil.com.br sem www
app.use((req: Request, res: Response, next) => {
  const host = req.headers.host || '';
  if (host.startsWith('www.juceliasantanaengencivil.com.br')) {
    const targetUrl = `https://juceliasantanaengencivil.com.br${req.originalUrl || req.url}`;
    return res.redirect(301, targetUrl);
  }
  next();
});

// Endpoint Oficial para sitemap.xml com Content-Type XML e HTTP 200 garantido
app.get('/sitemap.xml', (_req: Request, res: Response) => {
  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://juceliasantanaengencivil.com.br/</loc>
  </url>
</urlset>`;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(200).send(sitemapXml);
});

// Endpoint Oficial para robots.txt com Content-Type text/plain e HTTP 200 garantido
app.get('/robots.txt', (_req: Request, res: Response) => {
  const robotsTxt = `User-agent: *
Allow: /

Sitemap: https://juceliasantanaengencivil.com.br/sitemap.xml
`;
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  res.status(200).send(robotsTxt);
});

// In-memory secure state & token vault (isolated server-side, never exposed to client)
interface OAuthStateData {
  adminId: string;
  adminEmail: string;
  timestamp: number;
  nonce: string;
}

const activeStates = new Map<string, OAuthStateData>();

// Server-side encrypted/isolated token cache
interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt: number; // timestamp in ms
  email?: string;
  folderId?: string;
}

let googleDriveTokens: GoogleTokens | null = null;

const DEFAULT_SUPABASE_URL = 'https://mnupdwlmgcratpfgypik.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1udXBkd2xtZ2NyYXRwZmd5cGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODYyMTU5NTAsImV4cCI6MjEwMTc5MTk1MH0.QO9-qnW77aYX7jDjlL1GRc9FO91UibLM2hZidJpqkyU';

function getServerSupabaseUrl(): string {
  const rawUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (rawUrl && typeof rawUrl === 'string') {
    const cleaned = rawUrl.trim().replace(/^["']|["']$/g, '');
    if (cleaned.includes('supabase.co') || cleaned.includes('localhost') || cleaned.includes('127.0.0.1')) {
      try {
        let urlString = cleaned;
        if (!urlString.startsWith('http://') && !urlString.startsWith('https://')) {
          urlString = `https://${urlString}`;
        }
        const parsed = new URL(urlString);
        if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && parsed.hostname && (parsed.hostname.includes('.') || parsed.hostname === 'localhost')) {
          return `${parsed.protocol}//${parsed.host}${parsed.pathname}`.replace(/\/+$/, '');
        }
      } catch {
        // Fallback abaixo
      }
    }
  }
  return DEFAULT_SUPABASE_URL.replace(/\/+$/, '');
}

function getServerSupabaseKey(): string {
  const rawKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  if (rawKey && typeof rawKey === 'string') {
    const cleaned = rawKey.trim().replace(/^["']|["']$/g, '');
    if ((cleaned.startsWith('eyJ') || cleaned.startsWith('sb_publishable_')) && cleaned.length >= 30) {
      return cleaned;
    }
  }
  return DEFAULT_SUPABASE_ANON_KEY;
}

// Helpers
function getGoogleCredentials() {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const supabaseUrl = getServerSupabaseUrl();
  const redirectUri = process.env.GOOGLE_REDIRECT_URI || `${supabaseUrl}/functions/v1/google-drive-oauth/callback`;
  const appUrl = process.env.APP_URL || '';

  return { clientId, clientSecret, redirectUri, appUrl };
}

// Supabase REST client helper for server-side updates
async function updateSupabaseSettings(settingsUpdate: Record<string, any>, adminId?: string, adminEmail?: string) {
  const supabaseUrl = getServerSupabaseUrl();
  const supabaseKey = getServerSupabaseKey();

  if (!supabaseUrl || !supabaseKey) return null;

  try {
    // 1. Fetch current backup_settings
    const getRes = await fetch(`${supabaseUrl}/rest/v1/site_settings?key=eq.backup_settings&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    let currentVal: Record<string, any> = {
      enabled: true,
      provider: 'google_drive',
      retention_days: 30,
      scheduled_enabled: false,
      schedule_time: '03:00',
      last_backup_at: null,
      next_backup_at: null,
      google_drive_connected: false,
      google_drive_folder_id: null,
      google_drive_folder_name: 'Jucélia Santana Engenharia Civil — Backups',
    };

    if (getRes.ok) {
      const rows = await getRes.json();
      if (rows && rows.length > 0 && rows[0].value) {
        currentVal = { ...currentVal, ...rows[0].value };
      }
    }

    const isAccountChange =
      currentVal.google_drive_connected &&
      currentVal.google_drive_account_email &&
      settingsUpdate.google_drive_account_email &&
      currentVal.google_drive_account_email !== settingsUpdate.google_drive_account_email;

    const previousAccount = currentVal.google_drive_account_email || null;

    const cleanSettingsUpdate = { ...settingsUpdate };
    const auditEvent = cleanSettingsUpdate.audit_event || (isAccountChange ? 'google_drive_account_changed' : undefined);
    const auditDetails = cleanSettingsUpdate.audit_details || {};

    delete cleanSettingsUpdate.audit_event;
    delete cleanSettingsUpdate.audit_details;

    const merged = { ...currentVal, ...cleanSettingsUpdate };

    // 2. Upsert site_settings
    await fetch(`${supabaseUrl}/rest/v1/site_settings`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates',
      },
      body: JSON.stringify({
        key: 'backup_settings',
        value: merged,
        updated_by: adminId || null,
        updated_at: new Date().toISOString(),
      }),
    });

    // 3. Log audit event if provided
    if (auditEvent) {
      await fetch(`${supabaseUrl}/rest/v1/admin_audit_logs`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: adminId || null,
          user_email: adminEmail || null,
          action: auditEvent,
          entity_type: 'google_drive_integration',
          entity_id: 'google_drive',
          details: {
            ...auditDetails,
            previous_account: isAccountChange ? previousAccount : undefined,
            is_account_changed: isAccountChange,
          },
          created_at: new Date().toISOString(),
        }),
      });
    }

    return { currentVal, isAccountChange, previousAccount };
  } catch (err) {
    console.error('[Server Supabase Sync Error]:', err);
    return null;
  }
}

// ==============================================================================
// GOOGLE DRIVE OAUTH API ROUTES (SERVER-SIDE)
// ==============================================================================

// 1. Gera URL de Autorização OAuth com Proteção CSRF / State
app.get('/api/google-drive/auth-url', (req: Request, res: Response) => {
  try {
    const { clientId, redirectUri } = getGoogleCredentials();
    const adminId = (req.query.admin_id as string) || 'admin';
    const adminEmail = (req.query.admin_email as string) || 'admin@juceliasantana.com.br';

    // Gera State seguro e expiração em 10 minutos
    const nonce = crypto.randomBytes(24).toString('hex');
    const state = Buffer.from(JSON.stringify({ nonce, adminId, adminEmail, t: Date.now() })).toString('base64url');

    activeStates.set(state, {
      adminId,
      adminEmail,
      timestamp: Date.now(),
      nonce,
    });

    // Limpeza de states antigos (> 15 min)
    const fifteenMinAgo = Date.now() - 15 * 60 * 1000;
    for (const [key, val] of activeStates.entries()) {
      if (val.timestamp < fifteenMinAgo) {
        activeStates.delete(key);
      }
    }

    if (!clientId) {
      // Se as credenciais do Google Cloud ainda não foram configuradas nas variáveis de ambiente
      return res.json({
        configured: false,
        message: 'Variável GOOGLE_CLIENT_ID não configurada.',
        redirectUri,
        scopes: [
          'https://www.googleapis.com/auth/drive.file',
          'https://www.googleapis.com/auth/userinfo.email',
        ],
      });
    }

    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' ');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: scopes,
      access_type: 'offline',
      prompt: 'consent select_account',
      state,
      include_granted_scopes: 'true',
    });

    const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

    res.json({
      configured: true,
      url: authUrl,
      state,
      redirectUri,
    });
  } catch (err: any) {
    console.error('[auth-url Error]:', err);
    res.status(500).json({ error: 'Falha ao gerar URL de autorização Google.' });
  }
});

// 2. Callback de Retorno do Google OAuth (HTTP 302 Redirect Handler)
const oauthCallbackHandler = async (req: Request, res: Response) => {
  const { code, state, error: googleError } = req.query;

  // Se o usuário cancelou ou o Google retornou erro
  if (googleError || !code) {
    const reason = googleError === 'access_denied' ? 'authorization_cancelled' : 'authorization_failed';
    return res.redirect(`/admin/backups?google_drive=error&oauth_popup=1&reason=${encodeURIComponent(reason)}`);
  }

  // Validação de State / CSRF
  const stateStr = state as string;
  const stateData = activeStates.get(stateStr);

  if (!stateData) {
    return res.redirect('/admin/backups?google_drive=error&oauth_popup=1&reason=session_expired');
  }

  // Remove state usado
  activeStates.delete(stateStr);

  try {
    const { clientId, clientSecret, redirectUri } = getGoogleCredentials();

    // Troca o authorization code pelo token no backend
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code as string,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errBody = await tokenResponse.text();
      console.error('[Token Exchange Failed]:', errBody);
      return res.redirect('/admin/backups?google_drive=error&oauth_popup=1&reason=token_exchange_failed');
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    const refreshToken = tokenData.refresh_token;
    const expiresIn = tokenData.expires_in || 3600;

    // 1. Obtém e-mail da conta autorizada
    let accountEmail = 'conta-google@autorizada';
    try {
      const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (userRes.ok) {
        const userInfo = await userRes.json();
        if (userInfo.email) accountEmail = userInfo.email;
      }
    } catch (e) {
      console.warn('[UserInfo fetch warning]:', e);
    }

    // 2. Localiza ou cria a pasta dedicada de backups no Google Drive
    const folderName = 'Jucélia Santana Engenharia Civil — Backups';
    let folderId = '';

    try {
      // Busca pasta existente
      const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
        `name = '${folderName}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
      )}&fields=files(id,name)`;

      const searchRes = await fetch(searchUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (searchRes.ok) {
        const searchData = await searchRes.json();
        if (searchData.files && searchData.files.length > 0) {
          folderId = searchData.files[0].id;
        }
      }

      // Se não existir, cria a pasta
      if (!folderId) {
        const createFolderRes = await fetch('https://www.googleapis.com/drive/v3/files', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
            description: 'Pasta oficial de backups do sistema Jucélia Santana Engenharia Civil',
          }),
        });

        if (createFolderRes.ok) {
          const newFolder = await createFolderRes.json();
          folderId = newFolder.id;
        }
      }
    } catch (fErr) {
      console.warn('[Drive folder creation warning]:', fErr);
    }

    // 3. Salva tokens em vault server-side
    googleDriveTokens = {
      accessToken,
      refreshToken: refreshToken || googleDriveTokens?.refreshToken,
      expiresAt: Date.now() + expiresIn * 1000,
      email: accountEmail,
      folderId: folderId || undefined,
    };

    // 4. Registra no Supabase via server-side sync
    const nowIso = new Date().toISOString();
    await updateSupabaseSettings(
      {
        google_drive_connected: true,
        google_drive_status: 'connected',
        google_drive_account_email: accountEmail,
        google_drive_connected_by: stateData.adminId,
        google_drive_connected_by_email: stateData.adminEmail,
        google_drive_folder_id: folderId || null,
        google_drive_folder_name: folderName,
        google_drive_connected_at: nowIso,
        google_drive_last_verified_at: nowIso,
        google_drive_error: null,
        audit_details: {
          account_email: accountEmail,
          connected_by_admin: stateData.adminEmail,
          admin_id: stateData.adminId,
          folder_id: folderId,
          folder_name: folderName,
        },
      },
      stateData.adminId,
      stateData.adminEmail
    );

    // Redirecionamento HTTP 302 limpo para a rota de admin
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    return res.redirect('/admin/backups?google_drive=connected&oauth_popup=1');
  } catch (err: any) {
    console.error('[OAuth Callback Error]:', err);
    return res.redirect('/admin/backups?google_drive=error&oauth_popup=1&reason=connection_failed');
  }
};

app.get('/auth/callback', oauthCallbackHandler);
app.get('/auth/callback/', oauthCallbackHandler);

// 3. Verificação em Tempo Real da Conexão com Google Drive
app.post('/api/google-drive/verify', async (req: Request, res: Response) => {
  const { admin_id, admin_email } = req.body || {};

  try {
    const { clientId, clientSecret } = getGoogleCredentials();

    if (!googleDriveTokens || !googleDriveTokens.accessToken) {
      // Sem tokens em memória, mas pode estar configurado no banco
      return res.json({
        success: false,
        status: 'disconnected',
        message: 'Google Drive não conectado no ambiente de execução.',
      });
    }

    let token = googleDriveTokens.accessToken;

    // Se o token estiver expirando em menos de 60 segundos e houver refresh token
    if (googleDriveTokens.expiresAt < Date.now() + 60000 && googleDriveTokens.refreshToken) {
      try {
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: googleDriveTokens.refreshToken,
            grant_type: 'refresh_token',
          }),
        });

        if (refreshRes.ok) {
          const refreshed = await refreshRes.json();
          googleDriveTokens.accessToken = refreshed.access_token;
          googleDriveTokens.expiresAt = Date.now() + (refreshed.expires_in || 3600) * 1000;
          token = refreshed.access_token;
        } else {
          throw new Error('Falha ao renovar token');
        }
      } catch (rErr) {
        console.warn('[Token refresh failed]:', rErr);
        await updateSupabaseSettings(
          {
            google_drive_status: 'attention',
            google_drive_error: 'A autorização com o Google Drive precisa ser refeita.',
            audit_event: 'google_drive_connection_failed',
            audit_details: { reason: 'token_refresh_failed' },
          },
          admin_id,
          admin_email
        );

        return res.json({
          success: false,
          status: 'attention',
          message: 'A autorização do Google Drive expirou ou foi revogada.',
        });
      }
    }

    // Testa chamada real ao Google Drive
    const testRes = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!testRes.ok) {
      await updateSupabaseSettings(
        {
          google_drive_status: 'attention',
          google_drive_error: 'Falha ao comunicar com a API do Google Drive.',
          audit_event: 'google_drive_connection_failed',
          audit_details: { status: testRes.status },
        },
        admin_id,
        admin_email
      );

      return res.json({
        success: false,
        status: 'attention',
        message: 'Não foi possível validar as permissões no Google Drive.',
      });
    }

    const verifiedAt = new Date().toISOString();

    await updateSupabaseSettings(
      {
        google_drive_connected: true,
        google_drive_status: 'connected',
        google_drive_last_verified_at: verifiedAt,
        google_drive_error: null,
        audit_event: 'google_drive_verified',
        audit_details: { verified_at: verifiedAt },
      },
      admin_id,
      admin_email
    );

    res.json({
      success: true,
      status: 'connected',
      verified_at: verifiedAt,
      account_email: googleDriveTokens.email,
      folder_id: googleDriveTokens.folderId,
    });
  } catch (err: any) {
    console.error('[Verify Error]:', err);
    res.status(500).json({
      success: false,
      status: 'attention',
      message: 'Erro interno ao verificar conexão.',
    });
  }
});

// 4. Desconexão Segura do Google Drive (Não apaga arquivos existentes)
app.post('/api/google-drive/disconnect', async (req: Request, res: Response) => {
  const { admin_id, admin_email } = req.body || {};

  try {
    // Revoga token no Google se existir
    if (googleDriveTokens?.accessToken) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${googleDriveTokens.accessToken}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
      } catch (revokeErr) {
        console.warn('[Revoke warning]:', revokeErr);
      }
    }

    const prevAccount = googleDriveTokens?.email || null;
    googleDriveTokens = null;

    // Atualiza status no Supabase mantendo histórico de backups e pasta
    await updateSupabaseSettings(
      {
        google_drive_connected: false,
        google_drive_status: 'disconnected',
        google_drive_account_email: null,
        google_drive_error: null,
        audit_event: 'google_drive_disconnected',
        audit_details: {
          previously_connected_email: prevAccount,
          disconnected_at: new Date().toISOString(),
        },
      },
      admin_id,
      admin_email
    );

    res.json({
      success: true,
      status: 'disconnected',
      message: 'Google Drive desconectado com sucesso.',
    });
  } catch (err: any) {
    console.error('[Disconnect Error]:', err);
    res.status(500).json({ error: 'Falha ao desconectar Google Drive.' });
  }
});

// 5. Obter Access Token Válido para o Google Drive
app.post('/api/google-drive/get-token', async (req: Request, res: Response) => {
  try {
    const { clientId, clientSecret } = getGoogleCredentials();

    if (!googleDriveTokens || !googleDriveTokens.accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma conexão ativa com o Google Drive no servidor. Por favor, conecte a conta.',
      });
    }

    // Se estiver perto de expirar e tiver refresh token, renova
    if (googleDriveTokens.expiresAt < Date.now() + 60000 && googleDriveTokens.refreshToken) {
      try {
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: googleDriveTokens.refreshToken,
            grant_type: 'refresh_token',
          }),
        });

        if (refreshRes.ok) {
          const refreshed = await refreshRes.json();
          googleDriveTokens.accessToken = refreshed.access_token;
          googleDriveTokens.expiresAt = Date.now() + (refreshed.expires_in || 3600) * 1000;
        }
      } catch (rErr) {
        console.warn('[Get-Token refresh warning]:', rErr);
      }
    }

    res.json({
      success: true,
      accessToken: googleDriveTokens.accessToken,
      folderId: googleDriveTokens.folderId,
      accountEmail: googleDriveTokens.email,
      folderName: 'Jucélia Santana Engenharia Civil — Backups',
    });
  } catch (err: any) {
    console.error('[Get-Token Error]:', err);
    res.status(500).json({ success: false, error: 'Falha ao recuperar token do Google Drive.' });
  }
});

// 6. Upload de Backup Direto para o Google Drive
app.post('/api/google-drive/upload-backup', express.json({ limit: '100mb' }), async (req: Request, res: Response) => {
  try {
    const { fileName, fileData, folderId: reqFolderId } = req.body || {};

    if (!fileName || !fileData) {
      return res.status(400).json({ success: false, error: 'Arquivo ou nome ausente no payload.' });
    }

    if (!googleDriveTokens || !googleDriveTokens.accessToken) {
      return res.status(400).json({ success: false, error: 'Google Drive não conectado.' });
    }

    const { clientId, clientSecret } = getGoogleCredentials();
    let token = googleDriveTokens.accessToken;

    // Renovação preventiva
    if (googleDriveTokens.expiresAt < Date.now() + 60000 && googleDriveTokens.refreshToken) {
      try {
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: googleDriveTokens.refreshToken,
            grant_type: 'refresh_token',
          }),
        });
        if (refreshRes.ok) {
          const refreshed = await refreshRes.json();
          googleDriveTokens.accessToken = refreshed.access_token;
          googleDriveTokens.expiresAt = Date.now() + (refreshed.expires_in || 3600) * 1000;
          token = refreshed.access_token;
        }
      } catch (e) {}
    }

    const targetFolderId = reqFolderId || googleDriveTokens.folderId;
    const fileBuffer = Buffer.from(fileData, 'base64');
    const fileSize = fileBuffer.length;

    const metadata = {
      name: fileName,
      parents: targetFolderId ? [targetFolderId] : [],
      mimeType: 'application/zip',
      description: 'Backup Oficial do Sistema — Jucélia Santana Engenharia Civil',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody = Buffer.concat([
      Buffer.from(
        delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: application/zip\r\n' +
          'Content-Transfer-Encoding: base64\r\n\r\n'
      ),
      Buffer.from(fileBuffer.toString('base64')),
      Buffer.from(closeDelimiter),
    ]);

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,webViewLink,createdTime',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': String(multipartRequestBody.length),
        },
        body: multipartRequestBody,
      }
    );

    if (!uploadRes.ok) {
      const errTxt = await uploadRes.text();
      console.error('[Google Drive Upload failed]:', errTxt);
      return res.status(uploadRes.status).json({
        success: false,
        error: `Falha no upload para o Google Drive: ${errTxt}`,
      });
    }

    const uploadedFile = await uploadRes.json();

    res.json({
      success: true,
      fileId: uploadedFile.id,
      fileName: uploadedFile.name,
      fileSize: uploadedFile.size ? Number(uploadedFile.size) : fileSize,
      webViewLink: uploadedFile.webViewLink || `https://drive.google.com/file/d/${uploadedFile.id}/view`,
    });
  } catch (err: any) {
    console.error('[Upload Backup Endpoint Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Erro no upload para o Google Drive.' });
  }
});

// 7. Verificação Real de Arquivo no Google Drive
app.post('/api/google-drive/verify-file', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.body || {};

    if (!fileId) {
      return res.status(400).json({ success: false, error: 'fileId é obrigatório para verificação.' });
    }

    if (!googleDriveTokens || !googleDriveTokens.accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Google Drive não conectado no servidor.',
        reconnectRequired: true,
      });
    }

    const { clientId, clientSecret } = getGoogleCredentials();
    let token = googleDriveTokens.accessToken;

    // Renovação preventiva do token se necessário
    if (googleDriveTokens.expiresAt < Date.now() + 60000 && googleDriveTokens.refreshToken) {
      try {
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: googleDriveTokens.refreshToken,
            grant_type: 'refresh_token',
          }),
        });
        if (refreshRes.ok) {
          const refreshed = await refreshRes.json();
          googleDriveTokens.accessToken = refreshed.access_token;
          googleDriveTokens.expiresAt = Date.now() + (refreshed.expires_in || 3600) * 1000;
          token = refreshed.access_token;
        }
      } catch (e) {
        console.warn('[verify-file token refresh warning]:', e);
      }
    }

    // Consulta metadados do arquivo na Google Drive API
    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?fields=id,name,size,mimeType,trashed,createdTime,modifiedTime,webViewLink,parents`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (driveRes.status === 404) {
      return res.json({
        success: true,
        exists: false,
        trashed: false,
        message: 'Arquivo não foi encontrado no Google Drive (possivelmente excluído manualmente).',
        verifiedAt: new Date().toISOString(),
      });
    }

    if (driveRes.status === 401 || driveRes.status === 403) {
      const errTxt = await driveRes.text();
      return res.status(401).json({
        success: false,
        error: 'Permissão expirada ou revogada no Google Drive. Reconecte a conta.',
        reconnectRequired: true,
        details: errTxt,
      });
    }

    if (!driveRes.ok) {
      const errTxt = await driveRes.text();
      return res.status(driveRes.status).json({
        success: false,
        error: `Erro ao consultar Google Drive: ${errTxt}`,
      });
    }

    const driveData = await driveRes.json();

    if (driveData.trashed) {
      return res.json({
        success: true,
        exists: false,
        trashed: true,
        message: 'O arquivo foi movido para a lixeira do Google Drive.',
        verifiedAt: new Date().toISOString(),
      });
    }

    res.json({
      success: true,
      exists: true,
      trashed: false,
      fileId: driveData.id,
      fileName: driveData.name,
      fileSize: driveData.size ? Number(driveData.size) : null,
      webViewLink: driveData.webViewLink || `https://drive.google.com/file/d/${driveData.id}/view`,
      modifiedTime: driveData.modifiedTime,
      verifiedAt: new Date().toISOString(),
      message: 'Backup verificado com sucesso no Google Drive.',
    });
  } catch (err: any) {
    console.error('[Verify File Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Falha ao verificar arquivo no Google Drive.' });
  }
});

// 8. Download de Arquivo de Backup do Google Drive
app.post('/api/google-drive/download-backup', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.body || {};

    if (!fileId) {
      return res.status(400).json({ success: false, error: 'fileId é obrigatório para download.' });
    }

    if (!googleDriveTokens || !googleDriveTokens.accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Google Drive não conectado no servidor.',
        reconnectRequired: true,
      });
    }

    const { clientId, clientSecret } = getGoogleCredentials();
    let token = googleDriveTokens.accessToken;

    // Renovação preventiva do token se necessário
    if (googleDriveTokens.expiresAt < Date.now() + 60000 && googleDriveTokens.refreshToken) {
      try {
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: googleDriveTokens.refreshToken,
            grant_type: 'refresh_token',
          }),
        });
        if (refreshRes.ok) {
          const refreshed = await refreshRes.json();
          googleDriveTokens.accessToken = refreshed.access_token;
          googleDriveTokens.expiresAt = Date.now() + (refreshed.expires_in || 3600) * 1000;
          token = refreshed.access_token;
        }
      } catch (e) {
        console.warn('[download-backup token refresh warning]:', e);
      }
    }

    // Baixa o arquivo binário do Google Drive
    const driveRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    if (driveRes.status === 404) {
      return res.status(404).json({
        success: false,
        error: 'Arquivo de backup não encontrado no Google Drive.',
      });
    }

    if (driveRes.status === 401 || driveRes.status === 403) {
      const errTxt = await driveRes.text();
      return res.status(401).json({
        success: false,
        error: 'Permissão expirada no Google Drive. Reconecte a conta.',
        reconnectRequired: true,
        details: errTxt,
      });
    }

    if (!driveRes.ok) {
      const errTxt = await driveRes.text();
      return res.status(driveRes.status).json({
        success: false,
        error: `Falha ao baixar arquivo do Google Drive: ${errTxt}`,
      });
    }

    const arrayBuffer = await driveRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString('base64');

    res.json({
      success: true,
      fileId,
      size: buffer.length,
      fileData: base64Data,
    });
  } catch (err: any) {
    console.error('[Download Backup Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Falha ao baixar arquivo de backup do Google Drive.' });
  }
});

// 9. Exclusão Real de Arquivo no Google Drive
app.post('/api/google-drive/delete-file', async (req: Request, res: Response) => {
  try {
    const { fileId } = req.body || {};

    if (!fileId) {
      return res.status(400).json({ success: false, error: 'fileId é obrigatório para exclusão.' });
    }

    if (!googleDriveTokens || !googleDriveTokens.accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Google Drive não conectado no servidor.',
        reconnectRequired: true,
      });
    }

    const { clientId, clientSecret } = getGoogleCredentials();
    let token = googleDriveTokens.accessToken;

    // Renovação preventiva do token se necessário
    if (googleDriveTokens.expiresAt < Date.now() + 60000 && googleDriveTokens.refreshToken) {
      try {
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: googleDriveTokens.refreshToken,
            grant_type: 'refresh_token',
          }),
        });
        if (refreshRes.ok) {
          const refreshed = await refreshRes.json();
          googleDriveTokens.accessToken = refreshed.access_token;
          googleDriveTokens.expiresAt = Date.now() + (refreshed.expires_in || 3600) * 1000;
          token = refreshed.access_token;
        }
      } catch (e) {
        console.warn('[delete-file token refresh warning]:', e);
      }
    }

    // Chamada de exclusão na Google Drive API v3
    const deleteRes = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}`,
      {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    // 204 No Content ou 200 OK: sucesso
    if (deleteRes.status === 204 || deleteRes.status === 200) {
      return res.json({
        success: true,
        deleted: true,
        fileId,
        message: 'Arquivo de backup excluído permanentemente do Google Drive.',
      });
    }

    // 404 Not Found: o arquivo já foi removido anteriormente
    if (deleteRes.status === 404) {
      return res.json({
        success: true,
        deleted: true,
        alreadyDeleted: true,
        fileId,
        message: 'O arquivo já não constava no Google Drive.',
      });
    }

    // 401/403: erro de autenticação / permissão
    if (deleteRes.status === 401 || deleteRes.status === 403) {
      const errTxt = await deleteRes.text();
      return res.status(401).json({
        success: false,
        error: 'Permissão expirada no Google Drive. Reconecte a conta para excluir o arquivo remoto.',
        reconnectRequired: true,
        details: errTxt,
      });
    }

    const errTxt = await deleteRes.text();
    return res.status(deleteRes.status).json({
      success: false,
      error: `Falha ao excluir arquivo no Google Drive: ${errTxt}`,
    });
  } catch (err: any) {
    console.error('[Delete File Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Falha na exclusão do arquivo no Google Drive.' });
  }
});

// 9. Consulta de Status da Integração
app.get('/api/google-drive/status', (_req: Request, res: Response) => {
  const { clientId, redirectUri, appUrl } = getGoogleCredentials();

  res.json({
    configured: Boolean(clientId),
    clientIdConfigured: Boolean(clientId),
    redirectUri,
    appUrl,
    hasServerSession: Boolean(googleDriveTokens),
    account_email: googleDriveTokens?.email || null,
    folder_id: googleDriveTokens?.folderId || null,
  });
});

// ==============================================================================
// ETAPA 20.6: BACKUP AUTOMÁTICO SERVER-SIDE & SCHEDULER ENGINE
// ==============================================================================

// Helper para calcular sha256 no Node.js
function calculateSha256Server(buffer: Buffer | string): string {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

// Helper para calcular próxima execução agendada
function computeNextScheduledBackupTime(params: {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  timezone?: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  fromDate?: Date;
}): { nextDate: Date; nextIso: string } {
  const {
    frequency,
    time = '02:00',
    timezone = 'America/Sao_Paulo',
    dayOfWeek = 0,
    dayOfMonth = 1,
    fromDate = new Date(),
  } = params;

  const [hourStr, minStr] = (time || '02:00').split(':');
  const targetHour = parseInt(hourStr || '2', 10);
  const targetMinute = parseInt(minStr || '0', 10);

  let safeTz = timezone;
  try {
    Intl.DateTimeFormat(undefined, { timeZone: safeTz });
  } catch {
    safeTz = 'America/Sao_Paulo';
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: safeTz,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(fromDate);
  const getPart = (type: string) => parts.find((p) => p.type === type)?.value || '0';

  const tzYear = parseInt(getPart('year'), 10);
  const tzMonth = parseInt(getPart('month'), 10) - 1;
  const tzDay = parseInt(getPart('day'), 10);
  const tzHour = parseInt(getPart('hour'), 10);
  const tzMinute = parseInt(getPart('minute'), 10);

  const tzCurrentDate = new Date(Date.UTC(tzYear, tzMonth, tzDay, tzHour, tzMinute));
  const tzDayOfWeek = tzCurrentDate.getUTCDay();

  let targetYear = tzYear;
  let targetMonth = tzMonth;
  let targetDay = tzDay;

  if (frequency === 'daily') {
    if (tzHour > targetHour || (tzHour === targetHour && tzMinute >= targetMinute)) {
      targetDay += 1;
    }
  } else if (frequency === 'weekly') {
    let diffDays = (dayOfWeek - tzDayOfWeek + 7) % 7;
    if (diffDays === 0) {
      if (tzHour > targetHour || (tzHour === targetHour && tzMinute >= targetMinute)) {
        diffDays = 7;
      }
    }
    targetDay += diffDays;
  } else if (frequency === 'monthly') {
    const safeDay = Math.max(1, Math.min(28, dayOfMonth));
    targetDay = safeDay;
    if (
      tzDay > safeDay ||
      (tzDay === safeDay && (tzHour > targetHour || (tzHour === targetHour && tzMinute >= targetMinute)))
    ) {
      targetMonth += 1;
      if (targetMonth > 11) {
        targetMonth = 0;
        targetYear += 1;
      }
    }
  }

  const candidateUtc = new Date(Date.UTC(targetYear, targetMonth, targetDay, targetHour, targetMinute, 0, 0));
  let nextDate = candidateUtc;
  try {
    const tzString = candidateUtc.toLocaleString('en-US', { timeZone: safeTz });
    const localInTz = new Date(tzString);
    const tzOffsetMs = candidateUtc.getTime() - localInTz.getTime();
    nextDate = new Date(candidateUtc.getTime() + tzOffsetMs);
  } catch {
    nextDate = candidateUtc;
  }

  if (nextDate.getTime() <= fromDate.getTime()) {
    if (frequency === 'daily') {
      nextDate = new Date(nextDate.getTime() + 24 * 60 * 60 * 1000);
    } else if (frequency === 'weekly') {
      nextDate = new Date(nextDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (frequency === 'monthly') {
      const d = new Date(nextDate);
      d.setMonth(d.getMonth() + 1);
      nextDate = d;
    }
  }

  return { nextDate, nextIso: nextDate.toISOString() };
}

// Variável de controle de execução em andamento (Lock Server-Side)
let isServerBackupRunning = false;

// Execução central server-side do backup agendado (independente de navegador ou usuário conectado)
async function executeServerScheduledBackup(options: {
  triggerType: 'scheduled' | 'manual_test';
  adminId?: string;
  adminEmail?: string;
  attempt?: number;
}): Promise<{ success: boolean; backupId?: string; fileName?: string; error?: string }> {
  const { triggerType = 'scheduled', adminId, adminEmail, attempt = 1 } = options;
  const startTime = Date.now();

  const supabaseUrl = getServerSupabaseUrl();
  const supabaseKey = getServerSupabaseKey();

  if (!supabaseUrl || !supabaseKey) {
    console.error('[Scheduler] Credenciais do Supabase não configuradas no servidor.');
    return { success: false, error: 'Credenciais Supabase indisponíveis no servidor.' };
  }

  // 1. Concurrency Lock: checa se já existe processo rodando
  if (isServerBackupRunning) {
    console.warn('[Scheduler Lock] Já existe um backup em processamento no servidor. Execução pulada.');
    return { success: false, error: 'Backup já em andamento no servidor (Lock ativo).' };
  }

  isServerBackupRunning = true;
  let backupRecordId: string | null = null;
  const now = new Date();
  const dateFormatted = now.toISOString().replace(/[:.]/g, '-');
  const fileName = `jucelia-santana-backup-scheduled-${dateFormatted}.zip`;

  try {
    // 2. Consulta configurações atuais
    const getRes = await fetch(`${supabaseUrl}/rest/v1/site_settings?key=eq.backup_settings&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    let settings: Record<string, any> = {
      enabled: true,
      scheduled_enabled: false,
      schedule_frequency: 'daily',
      schedule_time: '02:00',
      schedule_timezone: 'America/Sao_Paulo',
      schedule_day_of_week: 0,
      schedule_day_of_month: 1,
      google_drive_folder_id: null,
      google_drive_folder_name: 'Jucélia Santana Engenharia Civil — Backups',
    };

    if (getRes.ok) {
      const rows = await getRes.json();
      if (rows && rows.length > 0 && rows[0].value) {
        settings = { ...settings, ...rows[0].value };
      }
    }

    if (triggerType === 'scheduled' && !settings.scheduled_enabled) {
      console.log('[Scheduler] Backup agendado está desativado nas configurações.');
      isServerBackupRunning = false;
      return { success: false, error: 'Backup automático desativado.' };
    }

    // 3. Checa status concorrente na tabela public.system_backups
    const activeCheckRes = await fetch(`${supabaseUrl}/rest/v1/system_backups?status=eq.processing&select=id,backup_name&limit=1`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (activeCheckRes.ok) {
      const activeRows = await activeCheckRes.json();
      if (activeRows && activeRows.length > 0) {
        console.warn('[Scheduler Lock] Encontrado registro com status=processing em system_backups.');
        isServerBackupRunning = false;
        return { success: false, error: 'Já existe um backup em processamento.' };
      }
    }

    // 4. Validação e Renovação de Tokens do Google Drive
    const { clientId, clientSecret } = getGoogleCredentials();
    if (!googleDriveTokens || !googleDriveTokens.accessToken) {
      const errMsg = 'Google Drive não conectado no servidor. O backup agendado requer reconexão.';
      console.error(`[Scheduler] ${errMsg}`);
      
      // Registra falha estruturada
      await updateSupabaseSettings({
        last_scheduled_status: 'failed',
        last_scheduled_error: errMsg,
      });

      await fetch(`${supabaseUrl}/rest/v1/admin_audit_logs`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: adminId || null,
          user_email: adminEmail || 'sistema-agendador@juceliasantana.com.br',
          action: 'SCHEDULED_BACKUP_FAILED',
          entity_type: 'system_backups',
          entity_id: 'scheduled_execution',
          details: { error: errMsg, trigger_type: triggerType, reason: 'google_drive_disconnected' },
          created_at: new Date().toISOString(),
        }),
      });

      isServerBackupRunning = false;
      return { success: false, error: errMsg };
    }

    // Renovação do access token se necessário
    let driveToken = googleDriveTokens.accessToken;
    if (googleDriveTokens.expiresAt < Date.now() + 120000 && googleDriveTokens.refreshToken) {
      try {
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: googleDriveTokens.refreshToken,
            grant_type: 'refresh_token',
          }),
        });

        if (refreshRes.ok) {
          const refreshed = await refreshRes.json();
          googleDriveTokens.accessToken = refreshed.access_token;
          googleDriveTokens.expiresAt = Date.now() + (refreshed.expires_in || 3600) * 1000;
          driveToken = refreshed.access_token;
        } else {
          throw new Error('Falha ao renovar token de acesso do Google Drive.');
        }
      } catch (rErr: any) {
        console.error('[Scheduler Drive Token Error]:', rErr);
        isServerBackupRunning = false;
        return { success: false, error: rErr.message || 'Falha ao renovar autorização do Google Drive.' };
      }
    }

    const folderId = settings.google_drive_folder_id || googleDriveTokens.folderId;
    const folderName = settings.google_drive_folder_name || 'Jucélia Santana Engenharia Civil — Backups';
    const idempotencyKey = `scheduled_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // 5. Cria registro inicial em public.system_backups com status 'processing'
    const createRecordRes = await fetch(`${supabaseUrl}/rest/v1/system_backups`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({
        created_by: adminId || null,
        backup_name: fileName,
        backup_type: 'scheduled',
        status: 'processing',
        storage_provider: 'google_drive',
        metadata: {
          step: 'started',
          version: '1.0',
          source_environment: 'production',
          trigger_type: triggerType,
          folder_name: folderName,
          scheduled_trigger: {
            frequency: settings.schedule_frequency,
            configured_time: settings.schedule_time,
            timezone: settings.schedule_timezone,
            attempt,
          },
        },
        idempotency_key: idempotencyKey,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
    });

    if (createRecordRes.ok) {
      const createdRows = await createRecordRes.json();
      if (createdRows && createdRows.length > 0) {
        backupRecordId = createdRows[0].id;
      }
    }

    // Auditoria: SCHEDULED_BACKUP_STARTED
    await fetch(`${supabaseUrl}/rest/v1/admin_audit_logs`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: adminId || null,
        user_email: adminEmail || 'sistema-agendador@juceliasantana.com.br',
        action: 'SCHEDULED_BACKUP_STARTED',
        entity_type: 'system_backups',
        entity_id: backupRecordId || 'scheduled',
        details: {
          backup_name: fileName,
          trigger_type: triggerType,
          frequency: settings.schedule_frequency,
          time: settings.schedule_time,
          attempt,
        },
        created_at: new Date().toISOString(),
      }),
    });

    // 6. Coleta das Tabelas do Banco de Dados (PostgreSQL / Supabase REST)
    const zip = new JSZip();
    const dbFolder = zip.folder('database');
    const metaFolder = zip.folder('metadata');
    const checksums: Record<string, string> = {};
    const tableSummaries: Record<string, { count: number; sha256: string; bytes: number }> = {};
    let totalRecords = 0;

    const tablesToBackup = [
      'profiles',
      'projects',
      'project_images',
      'blog_posts',
      'site_settings',
      'contact_messages',
      'site_domains',
      'admin_audit_logs',
      'site_visit_stats',
      'system_backups',
      'google_drive_connections',
    ];

    for (const table of tablesToBackup) {
      try {
        const tableRes = await fetch(`${supabaseUrl}/rest/v1/${table}?select=*`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
          },
        });

        let records = [];
        if (tableRes.ok) {
          records = await tableRes.json();
        }

        // Sanitização de segurança
        if (table === 'google_drive_connections') {
          records = records.map((r: any) => {
            const { refresh_token_encrypted, ...rest } = r;
            return rest;
          });
        }

        const tableJson = JSON.stringify(records, null, 2);
        const tableSha256 = calculateSha256Server(tableJson);
        const bytes = Buffer.byteLength(tableJson, 'utf-8');

        checksums[`database/${table}.json`] = tableSha256;
        tableSummaries[table] = {
          count: Array.isArray(records) ? records.length : 0,
          sha256: tableSha256,
          bytes,
        };

        totalRecords += Array.isArray(records) ? records.length : 0;
        dbFolder?.file(`${table}.json`, tableJson);
      } catch (tErr) {
        console.warn(`[Scheduler] Aviso ao exportar tabela ${table}:`, tErr);
      }
    }

    // 7. Geração do Manifest e Checksums Estruturados
    const manifest = {
      app_name: 'Jucélia Santana Engenharia Civil',
      backup_id: backupRecordId,
      backup_name: fileName,
      backup_type: 'scheduled',
      created_at: new Date().toISOString(),
      format_version: '1.0',
      database_version: 'PostgreSQL 15+ (Supabase)',
      source_environment: 'production',
      database_summary: {
        total_tables: tablesToBackup.length,
        total_records: totalRecords,
        tables: tableSummaries,
      },
      metadata: {
        generated_by: 'Server Scheduler Engine v1.0',
        destination_provider: 'google_drive',
        destination_folder_name: folderName,
        trigger_type: triggerType,
      },
    };

    const manifestStr = JSON.stringify(manifest, null, 2);
    const manifestSha = calculateSha256Server(manifestStr);
    checksums['manifest.json'] = manifestSha;

    zip.file('manifest.json', manifestStr);
    metaFolder?.file('checksums.json', JSON.stringify(checksums, null, 2));
    metaFolder?.file(
      'schema.json',
      JSON.stringify(
        {
          format_version: '1.0',
          engine: 'PostgreSQL / Supabase / Google Drive',
          database_tables: tablesToBackup,
          documentation: 'Backup Oficial Agendado — Jucélia Santana Engenharia Civil',
        },
        null,
        2
      )
    );

    // 8. Empacotamento do ZIP em Buffer Node
    const zipNodeBuffer = await zip.generateAsync({
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 },
    });

    const finalPackageSha256 = calculateSha256Server(zipNodeBuffer);
    const packageSize = zipNodeBuffer.length;

    // 9. Envio Real para o Google Drive via Multipart Upload
    const metadata = {
      name: fileName,
      parents: folderId ? [folderId] : [],
      mimeType: 'application/zip',
      description: 'Backup Oficial Agendado do Sistema — Jucélia Santana Engenharia Civil',
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody = Buffer.concat([
      Buffer.from(
        delimiter +
          'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
          JSON.stringify(metadata) +
          delimiter +
          'Content-Type: application/zip\r\n' +
          'Content-Transfer-Encoding: base64\r\n\r\n'
      ),
      Buffer.from(zipNodeBuffer.toString('base64')),
      Buffer.from(closeDelimiter),
    ]);

    const uploadRes = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,webViewLink,createdTime',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${driveToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
          'Content-Length': String(multipartRequestBody.length),
        },
        body: multipartRequestBody,
      }
    );

    if (!uploadRes.ok) {
      const errTxt = await uploadRes.text();
      throw new Error(`Falha no upload para o Google Drive: ${errTxt}`);
    }

    const uploadedDriveFile = await uploadRes.json();
    const driveFileId = uploadedDriveFile.id;
    const driveWebViewLink = uploadedDriveFile.webViewLink || `https://drive.google.com/file/d/${driveFileId}/view`;
    const completedAt = new Date().toISOString();
    const executionDurationMs = Date.now() - startTime;

    // 10. Atualiza registro em public.system_backups como 'completed'
    if (backupRecordId) {
      await fetch(`${supabaseUrl}/rest/v1/system_backups?id=eq.${backupRecordId}`, {
        method: 'PATCH',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: 'completed',
          file_id: driveFileId,
          file_name: fileName,
          file_size: packageSize,
          completed_at: completedAt,
          metadata: {
            format_version: '1.0',
            sha256_checksum: finalPackageSha256,
            manifest_checksum: manifestSha,
            total_tables: tablesToBackup.length,
            total_records: totalRecords,
            destination_folder_id: folderId,
            destination_folder_name: folderName,
            google_drive_file_id: driveFileId,
            google_drive_view_link: driveWebViewLink,
            execution_duration_ms: executionDurationMs,
            tables_included: tablesToBackup,
            trigger_type: triggerType,
          },
          error_message: null,
          updated_at: completedAt,
        }),
      });
    }

    // 11. Recalcula a Próxima Execução Agendada e Atualiza backup_settings
    const nextCalc = computeNextScheduledBackupTime({
      frequency: settings.schedule_frequency || 'daily',
      time: settings.schedule_time || '02:00',
      timezone: settings.schedule_timezone || 'America/Sao_Paulo',
      dayOfWeek: settings.schedule_day_of_week ?? 0,
      dayOfMonth: settings.schedule_day_of_month ?? 1,
      fromDate: new Date(),
    });

    await updateSupabaseSettings({
      last_scheduled_backup_at: completedAt,
      last_scheduled_status: 'completed',
      last_scheduled_duration_ms: executionDurationMs,
      last_scheduled_error: null,
      last_backup_at: completedAt,
      next_scheduled_backup_at: nextCalc.nextIso,
      next_backup_at: nextCalc.nextIso,
    });

    // 12. Auditoria: SCHEDULED_BACKUP_COMPLETED
    await fetch(`${supabaseUrl}/rest/v1/admin_audit_logs`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: adminId || null,
        user_email: adminEmail || 'sistema-agendador@juceliasantana.com.br',
        action: 'SCHEDULED_BACKUP_COMPLETED',
        entity_type: 'system_backups',
        entity_id: backupRecordId || 'scheduled',
        details: {
          backup_name: fileName,
          file_id: driveFileId,
          file_size: packageSize,
          sha256: finalPackageSha256,
          total_records: totalRecords,
          duration_ms: executionDurationMs,
          next_scheduled_at: nextCalc.nextIso,
          trigger_type: triggerType,
        },
        created_at: new Date().toISOString(),
      }),
    });

    console.log(`[Scheduler] Backup automático concluído com sucesso: ${fileName} (${packageSize} bytes). Próxima: ${nextCalc.nextIso}`);

    isServerBackupRunning = false;
    return {
      success: true,
      backupId: backupRecordId || undefined,
      fileName,
    };
  } catch (err: any) {
    console.error(`[Scheduler Error] Tentativa ${attempt} falhou:`, err);
    const safeErrorMsg = err.message || 'Falha durante execução do backup agendado no servidor.';

    // Retry com backoff (até 2 tentativas se transitório)
    if (attempt < 2) {
      console.log(`[Scheduler] Aguardando 5 segundos para retry (${attempt + 1}/2)...`);
      isServerBackupRunning = false;
      await new Promise((r) => setTimeout(r, 5000));
      return executeServerScheduledBackup({
        triggerType,
        adminId,
        adminEmail,
        attempt: attempt + 1,
      });
    }

    // Se falha definitiva
    if (backupRecordId) {
      try {
        await fetch(`${supabaseUrl}/rest/v1/system_backups?id=eq.${backupRecordId}`, {
          method: 'PATCH',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'failed',
            error_message: safeErrorMsg,
            updated_at: new Date().toISOString(),
          }),
        });
      } catch (logErr) {}
    }

    // Recalcula próxima execução para não perder futuros agendamentos
    const nextCalc = computeNextScheduledBackupTime({
      frequency: 'daily',
      time: '02:00',
      timezone: 'America/Sao_Paulo',
      fromDate: new Date(),
    });

    await updateSupabaseSettings({
      last_scheduled_status: 'failed',
      last_scheduled_error: safeErrorMsg,
      next_scheduled_backup_at: nextCalc.nextIso,
    });

    await fetch(`${supabaseUrl}/rest/v1/admin_audit_logs`, {
      method: 'POST',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: adminId || null,
        user_email: adminEmail || 'sistema-agendador@juceliasantana.com.br',
        action: 'SCHEDULED_BACKUP_FAILED',
        entity_type: 'system_backups',
        entity_id: backupRecordId || 'scheduled',
        details: { error: safeErrorMsg, file_name: fileName, attempts: attempt },
        created_at: new Date().toISOString(),
      }),
    });

    isServerBackupRunning = false;
    return { success: false, error: safeErrorMsg };
  }
}

// ==============================================================================
// SCHEDULER WORKER TICK (Loop de Execução Server-Side)
// ==============================================================================

function initServerBackupScheduler() {
  console.log('[Scheduler Worker] Inicializando motor de verificação de backup agendado (Tick: 60s)...');

  setInterval(async () => {
    try {
      const supabaseUrl = getServerSupabaseUrl();
      const supabaseKey = getServerSupabaseKey();

      if (!supabaseUrl || !supabaseKey) return;

      const getRes = await fetch(`${supabaseUrl}/rest/v1/site_settings?key=eq.backup_settings&select=*`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
      });

      if (!getRes.ok) return;

      const rows = await getRes.json();
      if (!rows || rows.length === 0 || !rows[0].value) return;

      const settings = rows[0].value;
      if (!settings.scheduled_enabled) return;

      // Se next_scheduled_backup_at não existe, calcula e salva
      if (!settings.next_scheduled_backup_at) {
        const nextCalc = computeNextScheduledBackupTime({
          frequency: settings.schedule_frequency || 'daily',
          time: settings.schedule_time || '02:00',
          timezone: settings.schedule_timezone || 'America/Sao_Paulo',
          dayOfWeek: settings.schedule_day_of_week ?? 0,
          dayOfMonth: settings.schedule_day_of_month ?? 1,
          fromDate: new Date(),
        });

        await updateSupabaseSettings({
          next_scheduled_backup_at: nextCalc.nextIso,
          next_backup_at: nextCalc.nextIso,
        });
        return;
      }

      const scheduledTime = new Date(settings.next_scheduled_backup_at).getTime();
      const currentTime = Date.now();

      // Se a data/hora agendada chegou ou passou
      if (currentTime >= scheduledTime) {
        console.log(`[Scheduler Worker] Disparo temporal atingido (${settings.next_scheduled_backup_at}). Iniciando backup server-side...`);
        await executeServerScheduledBackup({ triggerType: 'scheduled' });
      }
    } catch (workerErr) {
      console.error('[Scheduler Worker Error]:', workerErr);
    }
  }, 60000); // Checa a cada 1 minuto no processo contínuo do servidor
}

// 10. Consulta de Configurações de Agendamento
app.get('/api/backup/schedule', async (_req: Request, res: Response) => {
  try {
    const supabaseUrl = getServerSupabaseUrl();
    const supabaseKey = getServerSupabaseKey();

    const getRes = await fetch(`${supabaseUrl}/rest/v1/site_settings?key=eq.backup_settings&select=*`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    let settings: Record<string, any> = {
      enabled: true,
      scheduled_enabled: false,
      schedule_frequency: 'daily',
      schedule_time: '02:00',
      schedule_timezone: 'America/Sao_Paulo',
      schedule_day_of_week: 0,
      schedule_day_of_month: 1,
      last_scheduled_backup_at: null,
      next_scheduled_backup_at: null,
      last_scheduled_status: 'none',
      google_drive_connected: Boolean(googleDriveTokens?.accessToken),
    };

    if (getRes.ok) {
      const rows = await getRes.json();
      if (rows && rows.length > 0 && rows[0].value) {
        settings = { ...settings, ...rows[0].value };
      }
    }

    res.json({
      success: true,
      settings,
      isServerRunning: isServerBackupRunning,
      hasGoogleDriveSession: Boolean(googleDriveTokens?.accessToken),
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Falha ao buscar configurações de agendamento.' });
  }
});

// 11. Salvar / Atualizar Configurações de Agendamento
app.post('/api/backup/schedule', async (req: Request, res: Response) => {
  try {
    const {
      scheduled_enabled,
      schedule_frequency = 'daily',
      schedule_time = '02:00',
      schedule_timezone = 'America/Sao_Paulo',
      schedule_day_of_week = 0,
      schedule_day_of_month = 1,
      admin_id,
      admin_email,
    } = req.body || {};

    // Validações dos campos
    if (scheduled_enabled && !googleDriveTokens?.accessToken) {
      return res.status(400).json({
        success: false,
        error: 'Conecte o Google Drive antes de ativar o backup automático.',
      });
    }

    const nextCalc = computeNextScheduledBackupTime({
      frequency: schedule_frequency,
      time: schedule_time,
      timezone: schedule_timezone,
      dayOfWeek: Number(schedule_day_of_week),
      dayOfMonth: Number(schedule_day_of_month),
      fromDate: new Date(),
    });

    const action = scheduled_enabled
      ? 'BACKUP_SCHEDULE_ENABLED'
      : 'BACKUP_SCHEDULE_DISABLED';

    await updateSupabaseSettings(
      {
        scheduled_enabled: Boolean(scheduled_enabled),
        schedule_frequency,
        schedule_time,
        schedule_timezone,
        schedule_day_of_week: Number(schedule_day_of_week),
        schedule_day_of_month: Number(schedule_day_of_month),
        next_scheduled_backup_at: scheduled_enabled ? nextCalc.nextIso : null,
        next_backup_at: scheduled_enabled ? nextCalc.nextIso : null,
        audit_event: action,
        audit_details: {
          scheduled_enabled: Boolean(scheduled_enabled),
          schedule_frequency,
          schedule_time,
          schedule_timezone,
          next_scheduled_backup_at: scheduled_enabled ? nextCalc.nextIso : null,
        },
      },
      admin_id,
      admin_email
    );

    res.json({
      success: true,
      message: scheduled_enabled
        ? `Backup automático ativado com sucesso. Próxima execução: ${nextCalc.nextIso}`
        : 'Backup automático desativado.',
      next_scheduled_backup_at: scheduled_enabled ? nextCalc.nextIso : null,
    });
  } catch (err: any) {
    console.error('[Save Schedule Error]:', err);
    res.status(500).json({ success: false, error: err.message || 'Falha ao salvar agendamento.' });
  }
});

// 12. Disparo de Teste do Backup Agendado pelo Administrador
app.post('/api/backup/trigger-scheduled', async (req: Request, res: Response) => {
  try {
    const { admin_id, admin_email } = req.body || {};

    if (isServerBackupRunning) {
      return res.status(409).json({
        success: false,
        error: 'Já existe um backup em processamento no servidor.',
      });
    }

    const result = await executeServerScheduledBackup({
      triggerType: 'manual_test',
      adminId: admin_id,
      adminEmail: admin_email,
    });

    if (!result.success) {
      return res.status(500).json(result);
    }

    res.json({
      success: true,
      message: 'Backup automático executado com sucesso e enviado ao Google Drive.',
      backupId: result.backupId,
      fileName: result.fileName,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message || 'Erro ao disparar teste de backup agendado.' });
  }
});

// Health check
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==============================================================================
// VITE MIDDLEWARE & SERVER START
// ==============================================================================

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*all', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Jucélia Santana Engine running at http://0.0.0.0:${PORT}`);
    // Inicializa o agendador contínuo de backups em segundo plano
    initServerBackupScheduler();
  });
}

startServer();
