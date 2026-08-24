// supabase/functions/google-drive-oauth/index.ts
// =============================================================================
// Supabase Edge Function: Integração Google Drive OAuth 2.0 Hardened (Deno/TypeScript)
// Projeto: Engª Jucélia Santana (Supabase Ref: mnupdwlmgcratpfgypik)
// Segurança: Criptografia AES-GCM 256-bit obrigatória (sem fallbacks previsíveis),
//            States Opacos com Consumo Atômico via RPC PostgreSQL,
//            Troca Atômica de Conexões Ativas, Imunidade a IDOR,
//            Allowlist Estrita de CORS e Zero Exposição de Tokens ao Frontend.
// =============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.8";
import JSZip from "https://esm.sh/jszip@3.10.1";

// =============================================================================
// 1. CONSTANTES E ALLOWLIST DE CORS
// =============================================================================

const FOLDER_NAME = "Jucélia Santana Engenharia Civil — Backups";
const SCOPES = [
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

const DEFAULT_ALLOWED_ORIGINS = [
  "https://juceliasantanaengencivil.com.br",
  "https://www.juceliasantanaengencivil.com.br",
  "https://juc-lia-santana-engenharia-civil-wesleialvessantos-projects.vercel.app",
  "https://ais-dev-s4wgjxdixhtprwyc5mmidv-683133186701.us-east1.run.app",
  "https://ais-pre-s4wgjxdixhtprwyc5mmidv-683133186701.us-east1.run.app",
  "http://juceliasantanaengencivil.com.br",
  "http://www.juceliasantanaengencivil.com.br",
  "https://juceliasantana.com.br",
  "https://www.juceliasantana.com.br",
  "http://localhost:3000",
  "http://localhost:5173",
];

function getSafeAllowedOrigin(req: Request): string | null {
  const reqOrigin = req.headers.get("origin") || req.headers.get("referer");
  const envOriginsStr = Deno.env.get("FRONTEND_ALLOWED_ORIGINS") || "";
  const extraOrigins = envOriginsStr
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  const fullAllowlist = Array.from(new Set([...DEFAULT_ALLOWED_ORIGINS, ...extraOrigins]));

  if (!reqOrigin) {
    return null;
  }

  try {
    const originUrl = new URL(reqOrigin).origin;
    if (fullAllowlist.includes(originUrl)) {
      return originUrl;
    }
  } catch {
    // URL inválida
  }

  return null;
}

function buildCorsHeaders(origin: string | null) {
  const safeOrigin = origin || "https://juceliasantanaengencivil.com.br";
  return {
    "Access-Control-Allow-Origin": safeOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Credentials": "true",
    "Vary": "Origin",
  };
}

// =============================================================================
// 2. CRIPTOGRAFIA AES-GCM 256-BIT (CHAVE EXCLUSIVA OAUTH_ENCRYPTION_KEY)
// =============================================================================

async function getEncryptionKey(): Promise<CryptoKey> {
  const secret = Deno.env.get("OAUTH_ENCRYPTION_KEY");
  if (!secret || secret.trim() === "") {
    throw new Error(
      "CRITICAL_SECURITY_ERROR: Chave OAUTH_ENCRYPTION_KEY não configurada nos secrets do ambiente."
    );
  }

  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.digest("SHA-256", encoder.encode(secret));

  return await crypto.subtle.importKey(
    "raw",
    keyMaterial,
    { name: "AES-GCM" },
    false,
    ["encrypt", "decrypt"]
  );
}

function bufferToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBuffer(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

async function encryptSecret(plainText: string): Promise<string> {
  if (!plainText) return "";
  const key = await getEncryptionKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plainText);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );

  return `enc:v1:${bufferToHex(iv)}:${bufferToHex(cipherBuffer)}`;
}

async function decryptSecret(encryptedPayload: string | null): Promise<string | null> {
  if (!encryptedPayload) return null;
  if (!encryptedPayload.startsWith("enc:v1:")) {
    // Rejeição estrita de tokens em texto puro não-cifrados
    return null;
  }

  try {
    const parts = encryptedPayload.split(":");
    if (parts.length !== 4) return null;

    const iv = hexToBuffer(parts[2]);
    const cipherData = hexToBuffer(parts[3]);
    const key = await getEncryptionKey();

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      cipherData
    );

    return new TextDecoder().decode(decrypted);
  } catch (err) {
    console.error("[Criptografia] Falha ao decifrar credencial protegida.");
    return null;
  }
}

async function sha256Hex(text: string): Promise<string> {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return bufferToHex(buffer);
}

function generateSecureStateToken(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  return bufferToHex(randomBytes);
}

// =============================================================================
// 3. CONTROLADOR PRINCIPAL DA EDGE FUNCTION
// =============================================================================

serve(async (req: Request) => {
  const allowedOrigin = getSafeAllowedOrigin(req);
  const corsHeaders = buildCorsHeaders(allowedOrigin);

  // 1. Resposta CORS Preflight Rigorosa
  if (req.method === "OPTIONS") {
    const requestOrigin = req.headers.get("origin");
    if (requestOrigin && !allowedOrigin) {
      return new Response(null, {
        status: 403,
        headers: {
          "Cache-Control": "no-store",
        },
      });
    }
    return new Response(null, {
      status: 204,
      headers: buildCorsHeaders(allowedOrigin),
    });
  }

  const url = new URL(req.url);
  const pathname = url.pathname;
  let action = url.searchParams.get("action") || "";

  if (pathname.endsWith("/callback") || url.searchParams.has("code")) {
    action = "callback";
  }

  // 2. Validação de Origem para chamadas de API do browser (exceto callback público do Google)
  if (action !== "callback" && req.headers.get("origin") && !allowedOrigin) {
    return new Response(
      JSON.stringify({ error: "Origem não autorizada pela política CORS." }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  // Variáveis de Ambiente Server-Side (Secrets nativos no Supabase)
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
  const GOOGLE_CLIENT_ID = Deno.env.get("GOOGLE_CLIENT_ID") || "";
  const GOOGLE_CLIENT_SECRET = Deno.env.get("GOOGLE_CLIENT_SECRET") || "";

  const SUPABASE_FUNCTION_CALLBACK = `${SUPABASE_URL}/functions/v1/google-drive-oauth/callback`;
  const GOOGLE_REDIRECT_URI = Deno.env.get("GOOGLE_REDIRECT_URI") || SUPABASE_FUNCTION_CALLBACK;

  // Inicializa o cliente Supabase com privilégios de serviço para operações server-side
  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

  // Helper para autenticar e validar se a requisição provém de um Administrador Ativo
  const authenticateAdmin = async (request: Request) => {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Acesso não autorizado: token de autenticação não fornecido.");
    }

    const token = authHeader.replace("Bearer ", "").trim();
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      throw new Error("Sessão inválida ou expirada.");
    }

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, role, active, email, full_name, status")
      .eq("id", user.id)
      .single();

    if (
      profileError ||
      !profile ||
      profile.role !== "admin" ||
      !profile.active ||
      profile.status === "suspended"
    ) {
      throw new Error("Acesso restrito: usuário não possui privilégios de administrador ativo.");
    }

    return { user, profile };
  };

  // Helper para obter accessToken válido do Google Drive a partir do refresh token criptografado
  const getGoogleDriveAccessTokenServerSide = async () => {
    const { data: activeConn, error: connError } = await supabaseAdmin
      .from("google_drive_connections")
      .select("*")
      .eq("is_active", true)
      .eq("provider", "google_drive")
      .maybeSingle();

    if (connError || !activeConn) {
      throw new Error("Nenhuma conexão com o Google Drive ativa no momento.");
    }

    const rawRefreshToken = await decryptSecret(activeConn.refresh_token_encrypted);
    if (!rawRefreshToken) {
      // Atualiza status no banco para reconnect_required
      await supabaseAdmin
        .from("google_drive_connections")
        .update({
          status: "reconnect_required",
          error_message: "Token de renovação não disponível ou corrompido.",
          last_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeConn.id);

      throw new Error("Token de renovação não disponível. Reconecte o Google Drive.");
    }

    const refreshRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        refresh_token: rawRefreshToken,
        grant_type: "refresh_token",
      }),
    });

    if (!refreshRes.ok) {
      const errText = await refreshRes.text();
      console.error("[Google OAuth Refresh Failed] Status:", refreshRes.status, errText);

      // Persiste status de reconnect_required no banco
      await supabaseAdmin
        .from("google_drive_connections")
        .update({
          status: "reconnect_required",
          error_message: "Falha ao renovar credenciais com o Google (token revogado ou expirado).",
          last_verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", activeConn.id);

      throw new Error("Falha ao renovar credenciais junto ao Google. Reconecte a conta.");
    }

    const refreshData = await refreshRes.json();
    return {
      accessToken: refreshData.access_token as string,
      connection: activeConn,
      rawRefreshToken,
    };
  };

  try {
    // =========================================================================
    // 1. INICIAR OAUTH (STATE CRIPTOGRÁFICO SEGURO ARMAZENADO NO BANCO)
    // =========================================================================
    if (action === "start" || action === "get-auth-url") {
      const { user, profile } = await authenticateAdmin(req);
      const safeOrigin = allowedOrigin || DEFAULT_ALLOWED_ORIGINS[0];

      // Validação obrigatória de Secrets do Servidor (Fail-Closed)
      const encryptionSecret = Deno.env.get("OAUTH_ENCRYPTION_KEY");
      if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET || !encryptionSecret) {
        return new Response(
          JSON.stringify({
            configured: false,
            message: "Configurações obrigatórias (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET ou OAUTH_ENCRYPTION_KEY) não definidas no servidor.",
            redirectUri: GOOGLE_REDIRECT_URI,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 1. Gera State Opaco Criptograficamente Seguro (32 bytes aleatórios)
      const stateToken = generateSecureStateToken();
      const stateHash = await sha256Hex(stateToken);
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // 10 minutos de validade

      // 2. Persiste State Server-Side na Tabela google_oauth_states
      const { error: stateInsertError } = await supabaseAdmin
        .from("google_oauth_states")
        .insert({
          state_hash: stateHash,
          user_id: user.id,
          user_email: profile.email || user.email,
          origin: safeOrigin,
          expires_at: expiresAt,
        });

      if (stateInsertError) {
        console.error("[State Insert Error]:", stateInsertError);
        throw new Error("Falha ao inicializar estado de segurança para autenticação OAuth.");
      }

      // 3. Monta parâmetros oficiais do Google OAuth
      const params = new URLSearchParams({
        client_id: GOOGLE_CLIENT_ID,
        redirect_uri: GOOGLE_REDIRECT_URI,
        response_type: "code",
        scope: SCOPES,
        access_type: "offline",
        prompt: "consent select_account", // Garante refresh_token e seletor de contas
        state: stateToken,
        include_granted_scopes: "true",
      });

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

      // 4. Registra auditoria
      await supabaseAdmin.from("admin_audit_logs").insert({
        user_id: user.id,
        user_email: profile.email || user.email,
        action: "GOOGLE_DRIVE_OAUTH_STARTED",
        entity_type: "google_drive_connection",
        entity_id: "google_drive",
        details: { redirect_uri: GOOGLE_REDIRECT_URI, origin: safeOrigin },
      });

      return new Response(
        JSON.stringify({
          configured: true,
          url: authUrl,
          redirectUri: GOOGLE_REDIRECT_URI,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // 2. CALLBACK DE AUTORIZAÇÃO DO GOOGLE (HTTP 302 REDIRECT PARA O FRONTEND)
    // =========================================================================
    if (action === "callback") {
      const code = url.searchParams.get("code");
      const stateToken = url.searchParams.get("state");
      const googleError = url.searchParams.get("error");

      const defaultOrigin = DEFAULT_ALLOWED_ORIGINS[0];

      const sendRedirectResponse = (targetOrigin: string, status: "connected" | "error", reason?: string) => {
        const redirectUrl = new URL("/admin/backups/oauth-complete", targetOrigin);
        redirectUrl.searchParams.set("result", status);
        if (reason) {
          redirectUrl.searchParams.set("reason", reason);
        }
        return new Response(null, {
          status: 303,
          headers: {
            "Location": redirectUrl.toString(),
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "Pragma": "no-cache",
          },
        });
      };

      if (googleError || !code) {
        console.warn("[OAuth Callback Warning]: Cancelado ou com erro do Google:", googleError);
        return sendRedirectResponse(defaultOrigin, "error", "authorization_cancelled");
      }

      if (!stateToken) {
        console.warn("[OAuth Callback Warning]: State ausente.");
        return sendRedirectResponse(defaultOrigin, "error", "missing_state");
      }

      // 1. Consumo Atômico do State via RPC consume_google_oauth_state
      const stateHash = await sha256Hex(stateToken);
      const { data: consumedRows, error: rpcErr } = await supabaseAdmin.rpc(
        "consume_google_oauth_state",
        { p_state_hash: stateHash }
      );

      const stateRecord = consumedRows && consumedRows.length > 0 ? consumedRows[0] : null;

      if (rpcErr || !stateRecord) {
        console.warn("[OAuth State Rejected]: State inválido, expirado ou reutilizado (RPC).", rpcErr);
        return sendRedirectResponse(defaultOrigin, "error", "session_expired");
      }

      const validatedAdminId = stateRecord.user_id;
      const validatedAdminEmail = stateRecord.user_email;
      const validatedOrigin = stateRecord.origin || defaultOrigin;

      // 2. Troca do Authorization Code por Access e Refresh Token junto ao Google
      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          redirect_uri: GOOGLE_REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });

      if (!tokenRes.ok) {
        console.error("[Google Token Exchange Failed] Status:", tokenRes.status);
        return sendRedirectResponse(validatedOrigin, "error", "token_exchange_failed");
      }

      const tokenData = await tokenRes.json();
      const accessToken = tokenData.access_token;
      const refreshToken = tokenData.refresh_token;

      // 3. Validação rigorosa de e-mail junto ao Google UserInfo (Sem placeholders)
      let accountEmail = "";
      try {
        const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userRes.ok) {
          const info = await userRes.json();
          if (info.email && typeof info.email === "string") {
            accountEmail = info.email.trim();
          }
        }
      } catch (e) {
        console.error("[UserInfo error]:", e);
      }

      if (!accountEmail) {
        console.error("[OAuth Callback Error]: Não foi possível obter o e-mail do usuário.");
        return sendRedirectResponse(validatedOrigin, "error", "identification_failed");
      }

      // 4. Validação obrigatória de Refresh Token
      if (!refreshToken) {
        console.error("[OAuth Callback Error]: Google não retornou refresh_token.");
        return sendRedirectResponse(validatedOrigin, "error", "missing_refresh_token");
      }

      // 5. Localiza ou cria a pasta oficial no Google Drive
      let folderId = "";
      try {
        const searchUrl = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
          `name = '${FOLDER_NAME}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`
        )}&fields=files(id,name)`;

        const searchRes = await fetch(searchUrl, {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        if (searchRes.ok) {
          const searchJson = await searchRes.json();
          if (searchJson.files && searchJson.files.length > 0) {
            folderId = searchJson.files[0].id;
          }
        } else {
          const searchErr = await searchRes.text();
          console.warn("[Folder Search Warning]:", searchRes.status, searchErr);
        }

        if (!folderId) {
          const createRes = await fetch("https://www.googleapis.com/drive/v3/files", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${accessToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              name: FOLDER_NAME,
              mimeType: "application/vnd.google-apps.folder",
              description: "Pasta oficial de backups do sistema Jucélia Santana Engenharia Civil",
            }),
          });

          if (createRes.ok) {
            const newFolder = await createRes.json();
            folderId = newFolder.id;
          } else {
            const createErr = await createRes.text();
            console.error("[Folder Create Error]:", createRes.status, createErr);
          }
        }
      } catch (fErr) {
        console.error("[Folder creation error]:", fErr);
      }

      // Se por restrição de cota/escopo a criação da pasta específica falhar no momento do OAuth,
      // fallback gracioso para 'root' para não abortar a conexão já autenticada com sucesso
      const finalFolderId = folderId || "root";
      const finalFolderName = folderId ? FOLDER_NAME : "Meu Drive (Raiz)";

      // 6. Criptografa o Refresh Token exclusivamente com AES-GCM
      const encryptedRefreshToken = await encryptSecret(refreshToken);

      // 7. Troca Atômica da Conexão Ativa via RPC switch_active_google_drive_connection
      const { data: newConn, error: switchError } = await supabaseAdmin.rpc(
        "switch_active_google_drive_connection",
        {
          p_connected_by: validatedAdminId,
          p_connected_by_email: validatedAdminEmail,
          p_account_email: accountEmail,
          p_drive_folder_id: finalFolderId,
          p_drive_folder_name: finalFolderName,
          p_refresh_token_encrypted: encryptedRefreshToken,
        }
      );

      if (switchError || !newConn) {
        console.error("[DB Switch Connection Error]:", switchError);
        return sendRedirectResponse(validatedOrigin, "error", "connection_failed");
      }

      // 8. Registra auditoria
      await supabaseAdmin.from("admin_audit_logs").insert({
        user_id: validatedAdminId,
        user_email: validatedAdminEmail,
        action: "GOOGLE_DRIVE_CONNECTED",
        entity_type: "google_drive_connection",
        entity_id: newConn.id || "google_drive",
        details: {
          account_email: accountEmail,
          folder_id: finalFolderId,
          folder_name: finalFolderName,
          timestamp: new Date().toISOString(),
        },
      });

      // 9. Retorna HTTP 303 Seguro redirecionando para a rota frontend oauth-complete na origem validada
      const successUrl = new URL("/admin/backups/oauth-complete", validatedOrigin);
      successUrl.searchParams.set("result", "connected");

      return new Response(null, {
        status: 303,
        headers: {
          "Location": successUrl.toString(),
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache",
        },
      });
    }

    // =========================================================================
    // 3. STATUS DA CONEXÃO (REQUER ADMINISTRADOR AUTENTICADO E ATIVO)
    // =========================================================================
    if (action === "status") {
      await authenticateAdmin(req);

      const encryptionSecret = Deno.env.get("OAUTH_ENCRYPTION_KEY");
      const isConfigured = Boolean(GOOGLE_CLIENT_ID && GOOGLE_CLIENT_SECRET && encryptionSecret);

      const { data: activeConn } = await supabaseAdmin
        .from("google_drive_connections")
        .select(
          "id, account_email, drive_folder_id, drive_folder_name, is_active, status, error_message, connected_by_email, connected_at, last_verified_at"
        )
        .eq("is_active", true)
        .maybeSingle();

      return new Response(
        JSON.stringify({
          configured: isConfigured,
          connected: Boolean(activeConn && activeConn.status === "connected"),
          connection: activeConn || null,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // 4. VERIFICAÇÃO EM TEMPO REAL DA CONEXÃO E DA PASTA OFICIAL
    // =========================================================================
    if (action === "verify") {
      const { user, profile } = await authenticateAdmin(req);

      let authDrive;
      try {
        authDrive = await getGoogleDriveAccessTokenServerSide();
      } catch (err: any) {
        return new Response(
          JSON.stringify({
            success: false,
            status: "reconnect_required",
            message: err.message || "Reconexão necessária.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { accessToken, connection } = authDrive;

      let folderHealthy = false;
      let folderErrorMsg: string | null = null;

      if (connection.drive_folder_id) {
        const folderCheckRes = await fetch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
            connection.drive_folder_id
          )}?fields=id,name,trashed`,
          { headers: { Authorization: `Bearer ${accessToken}` } }
        );
        if (folderCheckRes.ok) {
          const folderInfo = await folderCheckRes.json();
          folderHealthy = !folderInfo.trashed;
          if (folderInfo.trashed) {
            folderErrorMsg = "A pasta de backups está na lixeira do Google Drive.";
          }
        } else {
          folderErrorMsg = "A pasta de backups não foi localizada no Google Drive.";
        }
      }

      const nowIso = new Date().toISOString();
      const newStatus = folderHealthy ? "connected" : "error";

      await supabaseAdmin
        .from("google_drive_connections")
        .update({
          status: newStatus,
          error_message: folderErrorMsg,
          last_verified_at: nowIso,
          updated_at: nowIso,
        })
        .eq("id", connection.id);

      await supabaseAdmin.from("admin_audit_logs").insert({
        user_id: user.id,
        user_email: profile.email || user.email,
        action: "GOOGLE_DRIVE_VERIFIED",
        entity_type: "google_drive_connection",
        entity_id: connection.id,
        details: { folder_healthy: folderHealthy, status: newStatus, verified_at: nowIso },
      });

      return new Response(
        JSON.stringify({
          success: true,
          status: newStatus,
          account_email: connection.account_email,
          folder_id: connection.drive_folder_id,
          folder_name: connection.drive_folder_name,
          folder_healthy: folderHealthy,
          error_message: folderErrorMsg,
          last_verified_at: nowIso,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // 5. DESCONEXÃO SEGURA (REVOGAÇÃO SERVER-SIDE NO GOOGLE + AUDITORIA)
    // =========================================================================
    if (action === "disconnect") {
      const { user, profile } = await authenticateAdmin(req);
      const nowIso = new Date().toISOString();

      const { data: activeConn } = await supabaseAdmin
        .from("google_drive_connections")
        .select("id, account_email, drive_folder_id, refresh_token_encrypted")
        .eq("is_active", true)
        .maybeSingle();

      // Revogação de Token no endpoint oficial do Google se disponível
      if (activeConn?.refresh_token_encrypted) {
        try {
          const rawToken = await decryptSecret(activeConn.refresh_token_encrypted);
          if (rawToken) {
            await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(rawToken)}`, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
            });
          }
        } catch (revokeErr) {
          console.warn("[Revoke warning]:", revokeErr);
        }
      }

      // Desativa conexões e limpa referências a tokens no banco
      await supabaseAdmin
        .from("google_drive_connections")
        .update({
          is_active: false,
          status: "disconnected",
          refresh_token_encrypted: null,
          updated_at: nowIso,
        })
        .eq("provider", "google_drive");

      // Atualiza site_settings
      const { data: setting } = await supabaseAdmin
        .from("site_settings")
        .select("value")
        .eq("key", "backup_settings")
        .maybeSingle();

      if (setting?.value) {
        await supabaseAdmin
          .from("site_settings")
          .update({
            value: {
              ...setting.value,
              google_drive_connected: false,
              google_drive_status: "disconnected",
              google_drive_account_email: null,
              google_drive_error: null,
            },
            updated_at: nowIso,
          })
          .eq("key", "backup_settings");
      }

      // Registra auditoria
      await supabaseAdmin.from("admin_audit_logs").insert({
        user_id: user.id,
        user_email: profile.email || user.email,
        action: "GOOGLE_DRIVE_DISCONNECTED",
        entity_type: "google_drive_connection",
        entity_id: activeConn?.id || "google_drive",
        details: {
          disconnected_account: activeConn?.account_email || null,
          preserved_folder_id: activeConn?.drive_folder_id || null,
          timestamp: nowIso,
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Google Drive desconectado com sucesso. Backups anteriores preservados.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // 6. VERIFICAÇÃO DE ARQUIVO DE BACKUP (PROTEÇÃO RIGOROSA CONTRA IDOR)
    // =========================================================================
    if (action === "verify-file") {
      await authenticateAdmin(req);
      const reqBody = await req.json().catch(() => ({}));
      const backupId = reqBody.backupId || reqBody.backup_id;

      if (!backupId) {
        return new Response(
          JSON.stringify({ success: false, error: "backup_id é obrigatório para validação." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 1. Consulta o registro em system_backups para obter o file_id oficial
      const { data: backup, error: backupErr } = await supabaseAdmin
        .from("system_backups")
        .select("*")
        .eq("id", backupId)
        .single();

      if (backupErr || !backup) {
        return new Response(
          JSON.stringify({ success: false, error: "Registro de backup não localizado." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (backup.storage_provider !== "google_drive" || !backup.file_id) {
        return new Response(
          JSON.stringify({
            success: true,
            exists: false,
            trashed: false,
            message: "Backup não possui arquivo vinculado no Google Drive.",
            verifiedAt: new Date().toISOString(),
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 2. Obtém token server-side para checagem
      let authDrive;
      try {
        authDrive = await getGoogleDriveAccessTokenServerSide();
      } catch (err: any) {
        return new Response(
          JSON.stringify({
            success: false,
            error: err.message,
            reconnectRequired: true,
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const targetFileId = backup.file_id;
      const driveRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
          targetFileId
        )}?fields=id,name,size,mimeType,trashed,createdTime,modifiedTime,webViewLink`,
        { headers: { Authorization: `Bearer ${authDrive.accessToken}` } }
      );

      if (driveRes.status === 404) {
        return new Response(
          JSON.stringify({
            success: true,
            exists: false,
            trashed: false,
            fileId: targetFileId,
            message: "Arquivo de backup não encontrado no Google Drive.",
            verifiedAt: new Date().toISOString(),
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!driveRes.ok) {
        return new Response(
          JSON.stringify({
            success: false,
            error: "Erro na comunicação com o Google Drive.",
          }),
          { status: driveRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const driveData = await driveRes.json();

      return new Response(
        JSON.stringify({
          success: true,
          exists: !driveData.trashed,
          trashed: Boolean(driveData.trashed),
          fileId: driveData.id,
          fileName: driveData.name,
          fileSize: driveData.size ? Number(driveData.size) : null,
          webViewLink: driveData.webViewLink || `https://drive.google.com/file/d/${driveData.id}/view`,
          modifiedTime: driveData.modifiedTime,
          verifiedAt: new Date().toISOString(),
          message: driveData.trashed
            ? "O arquivo foi movido para a lixeira do Google Drive."
            : "Backup verificado com sucesso no Google Drive.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // 7. EXCLUSÃO DE ARQUIVO DE BACKUP (PROTEÇÃO RIGOROSA CONTRA IDOR + BANCO)
    // =========================================================================
    if (action === "delete-file") {
      const { user, profile } = await authenticateAdmin(req);
      const reqBody = await req.json().catch(() => ({}));
      const backupId = reqBody.backupId || reqBody.backup_id;

      if (!backupId) {
        return new Response(
          JSON.stringify({ success: false, error: "backup_id é obrigatório para exclusão." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 1. Consulta o registro em system_backups para obter o file_id oficial
      const { data: backup, error: backupErr } = await supabaseAdmin
        .from("system_backups")
        .select("*")
        .eq("id", backupId)
        .single();

      if (backupErr || !backup) {
        return new Response(
          JSON.stringify({ success: false, error: "Registro de backup não localizado." }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (backup.storage_provider !== "google_drive" || !backup.file_id) {
        return new Response(
          JSON.stringify({
            success: true,
            deleted: true,
            alreadyDeleted: true,
            message: "Backup não possui arquivo remoto associado no Google Drive.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // 2. Obtém token server-side para exclusão
      let authDrive;
      try {
        authDrive = await getGoogleDriveAccessTokenServerSide();
      } catch (err: any) {
        return new Response(
          JSON.stringify({
            success: false,
            error: err.message,
            reconnectRequired: true,
          }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const targetFileId = backup.file_id;
      const deleteRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(targetFileId)}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${authDrive.accessToken}` },
        }
      );

      if (deleteRes.status === 204 || deleteRes.status === 200 || deleteRes.status === 404) {
        // Atualiza atomicamente o status em system_backups
        await supabaseAdmin
          .from("system_backups")
          .update({
            file_id: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", backupId);

        await supabaseAdmin.from("admin_audit_logs").insert({
          user_id: user.id,
          user_email: profile.email || user.email,
          action: "BACKUP_REMOTE_FILE_DELETED",
          entity_type: "system_backups",
          entity_id: backupId,
          details: { file_id: targetFileId, backup_name: backup.backup_name },
        });

        return new Response(
          JSON.stringify({
            success: true,
            deleted: true,
            fileId: targetFileId,
            message: "Arquivo de backup removido com sucesso do Google Drive.",
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ success: false, error: "Falha ao excluir arquivo no Google Drive." }),
        { status: deleteRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // 8. UPLOAD DE BACKUP SERVER-SIDE (SEM EXPOR TOKENS AO FRONTEND)
    // =========================================================================
    if (action === "upload-backup") {
      const { user, profile } = await authenticateAdmin(req);
      const reqBody = await req.json().catch(() => ({}));
      const { fileName, fileData, backupId } = reqBody;

      if (!fileName || !fileData) {
        return new Response(
          JSON.stringify({ success: false, error: "fileName e fileData são obrigatórios." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Valida que o backupId existe no banco de dados
      if (backupId) {
        const { data: bCheck, error: bErr } = await supabaseAdmin
          .from("system_backups")
          .select("id")
          .eq("id", backupId)
          .single();

        if (bErr || !bCheck) {
          return new Response(
            JSON.stringify({ success: false, error: "Registro de backup inválido no banco de dados." }),
            { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }

      const authDrive = await getGoogleDriveAccessTokenServerSide();
      const folderId = authDrive.connection.drive_folder_id;

      // Converte Base64 para binário
      const binaryString = atob(fileData);
      const len = binaryString.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Upload Multipart direto ao Google Drive
      const metadata = {
        name: fileName,
        parents: folderId ? [folderId] : [],
        mimeType: "application/zip",
        description: "Backup Oficial do Sistema — Jucélia Santana Engenharia Civil",
      };

      const boundary = "-------314159265358979323846";
      const delimiter = `\r\n--${boundary}\r\n`;
      const closeDelimiter = `\r\n--${boundary}--`;

      const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
        metadata
      )}`;
      const mediaPartHeader = `${delimiter}Content-Type: application/zip\r\n\r\n`;

      const encoder = new TextEncoder();
      const metaBytes = encoder.encode(metadataPart);
      const mediaHeaderBytes = encoder.encode(mediaPartHeader);
      const closeBytes = encoder.encode(closeDelimiter);

      const totalLength =
        metaBytes.byteLength + mediaHeaderBytes.byteLength + bytes.byteLength + closeBytes.byteLength;
      const combinedBuffer = new Uint8Array(totalLength);

      let offset = 0;
      combinedBuffer.set(metaBytes, offset);
      offset += metaBytes.byteLength;
      combinedBuffer.set(mediaHeaderBytes, offset);
      offset += mediaHeaderBytes.byteLength;
      combinedBuffer.set(bytes, offset);
      offset += bytes.byteLength;
      combinedBuffer.set(closeBytes, offset);

      const uploadRes = await fetch(
        "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,webViewLink",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${authDrive.accessToken}`,
            "Content-Type": `multipart/related; boundary=${boundary}`,
          },
          body: combinedBuffer,
        }
      );

      if (!uploadRes.ok) {
        const errTxt = await uploadRes.text();
        console.error("[Drive Upload Error]:", errTxt);
        return new Response(
          JSON.stringify({ success: false, error: "Falha ao gravar arquivo no Google Drive." }),
          { status: uploadRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const driveFile = await uploadRes.json();

      if (backupId) {
        await supabaseAdmin
          .from("system_backups")
          .update({
            file_id: driveFile.id,
            file_name: driveFile.name || fileName,
            file_size: driveFile.size ? Number(driveFile.size) : bytes.byteLength,
            updated_at: new Date().toISOString(),
          })
          .eq("id", backupId);
      }

      return new Response(
        JSON.stringify({
          success: true,
          fileId: driveFile.id,
          fileName: driveFile.name || fileName,
          fileSize: driveFile.size ? Number(driveFile.size) : bytes.byteLength,
          webViewLink: driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // 9. DOWNLOAD DE BACKUP DO GOOGLE DRIVE SERVER-SIDE
    // =========================================================================
    if (action === "download-backup") {
      await authenticateAdmin(req);
      const reqBody = await req.json().catch(() => ({}));
      const { fileId } = reqBody;

      if (!fileId) {
        return new Response(
          JSON.stringify({ success: false, error: "fileId é obrigatório para download." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const authDrive = await getGoogleDriveAccessTokenServerSide();
      const driveRes = await fetch(
        `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media`,
        { headers: { Authorization: `Bearer ${authDrive.accessToken}` } }
      );

      if (!driveRes.ok) {
        const errText = await driveRes.text();
        return new Response(
          JSON.stringify({ success: false, error: `Falha ao baixar do Google Drive: ${errText}` }),
          { status: driveRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const arrayBuffer = await driveRes.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = "";
      for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
      }
      const base64Data = btoa(binary);

      return new Response(
        JSON.stringify({
          success: true,
          fileData: base64Data,
          fileSize: bytes.byteLength,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // =========================================================================
    // 10. EXECUÇÃO DE BACKUP COMPLETO SERVER-SIDE (RUN-BACKUP)
    // =========================================================================
    if (action === "run-backup") {
      const { user, profile } = await authenticateAdmin(req);
      const reqBody = await req.json().catch(() => ({}));
      const {
        includePhotos = true,
        includeVideos = true,
        includeDocuments = true,
        backupName,
      } = reqBody;

      const authDrive = await getGoogleDriveAccessTokenServerSide();
      const folderId = authDrive.connection.drive_folder_id || "root";
      const folderName = authDrive.connection.drive_folder_name || FOLDER_NAME;

      const now = new Date();
      const dateFormatted = now.toISOString().replace(/[:.]/g, "-");
      const fileName = backupName || `jucelia-santana-backup-${dateFormatted}.zip`;
      const idempotencyKey = `manual_backup_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

      // 1. Cria registro inicial no banco
      const { data: newBackup, error: createBackupErr } = await supabaseAdmin
        .from("system_backups")
        .insert({
          created_by: user.id,
          backup_name: fileName,
          backup_type: "manual",
          status: "processing",
          storage_provider: "google_drive",
          metadata: {
            step: "processing",
            version: "1.0",
            source_environment: "production",
            folder_name: folderName,
          },
          idempotency_key: idempotencyKey,
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
        })
        .select("*")
        .single();

      if (createBackupErr || !newBackup) {
        throw new Error("Falha ao registrar backup no banco de dados.");
      }

      const backupRecordId = newBackup.id;

      try {
        // Registra início da auditoria
        await supabaseAdmin.from("admin_audit_logs").insert({
          user_id: user.id,
          user_email: profile.email || user.email,
          action: "BACKUP_MANUAL_STARTED",
          entity_type: "system_backups",
          entity_id: backupRecordId,
          details: { backup_name: fileName, folder_id: folderId },
        });

        // 2. Inicializa ZIP e coletores
        const zip = new JSZip();
        const dbFolder = zip.folder("database");
        const storageFolder = zip.folder("storage");
        const metaFolder = zip.folder("metadata");

        const checksums: Record<string, string> = {};
        const tableSummaries: Record<string, { count: number; sha256: string; bytes: number }> = {};
        const bucketSummaries: Record<string, { count: number; total_bytes: number; files: string[] }> = {};

        let totalRecords = 0;
        let totalStorageFiles = 0;
        let totalStorageBytes = 0;

        // 3. Exporta Tabelas do Banco de Dados (Excluindo segredos e credenciais sensíveis)
        const tablesToBackup = [
          "profiles",
          "projects",
          "project_images",
          "blog_posts",
          "site_settings",
          "contact_messages",
          "technical_documents",
          "site_domains",
          "admin_audit_logs",
          "site_visit_stats",
          "system_backups",
        ];

        for (const table of tablesToBackup) {
          try {
            const { data: rows, error: tErr } = await supabaseAdmin
              .from(table)
              .select("*");

            if (tErr) {
              console.warn(`[run-backup] Aviso tabela ${table}:`, tErr.message);
            }

            let sanitizedRows = rows || [];

            // Sanitização de segurança: remover secrets de site_settings
            if (table === "site_settings") {
              sanitizedRows = sanitizedRows.map((r: any) => {
                if (r.key === "backup_settings" && r.value) {
                  const { google_drive_refresh_token, ...safeVal } = r.value;
                  return { ...r, value: safeVal };
                }
                return r;
              });
            }

            const jsonStr = JSON.stringify(sanitizedRows, null, 2);
            const sha = await sha256Hex(jsonStr);
            const bytes = new TextEncoder().encode(jsonStr).byteLength;

            dbFolder?.file(`${table}.json`, jsonStr);
            checksums[`database/${table}.json`] = sha;
            tableSummaries[table] = {
              count: sanitizedRows.length,
              sha256: sha,
              bytes,
            };
            totalRecords += sanitizedRows.length;
          } catch (tEx) {
            console.warn(`[run-backup] Erro na tabela ${table}:`, tEx);
          }
        }

        // 4. Exporta Arquivos Reais do Supabase Storage Recursivamente
        const photoBuckets = ["profile-images", "hero-images", "project-images", "blog-images"];
        const videoBuckets = ["project-videos"];
        const documentBuckets = ["documents"];

        const bucketsToBackup: string[] = [];
        if (includePhotos) bucketsToBackup.push(...photoBuckets);
        if (includeVideos) bucketsToBackup.push(...videoBuckets);
        if (includeDocuments) bucketsToBackup.push(...documentBuckets);

        let photosCount = 0;
        let videosCount = 0;
        let documentsCount = 0;
        let sourcePhotosCount = 0;
        let sourceVideosCount = 0;
        let sourceDocumentsCount = 0;
        let totalSourceFiles = 0;

        interface StorageEntryItem {
          bucket: string;
          path: string;
          category: "photo" | "video" | "document" | "other";
          mime_type: string;
          size: number;
          sha256: string;
          updated_at: string;
          metadata: any;
        }

        const storageManifestEntries: StorageEntryItem[] = [];

        function classifyMimeAndCategory(fileName: string, rawMime?: string, bucketName?: string): { mime: string; category: "photo" | "video" | "document" | "other" } {
          const ext = fileName.split(".").pop()?.toLowerCase() || "";
          let mime = rawMime || "";
          if (!mime || mime === "application/octet-stream") {
            if (["jpg", "jpeg"].includes(ext)) mime = "image/jpeg";
            else if (ext === "png") mime = "image/png";
            else if (ext === "webp") mime = "image/webp";
            else if (ext === "svg") mime = "image/svg+xml";
            else if (ext === "gif") mime = "image/gif";
            else if (ext === "mp4") mime = "video/mp4";
            else if (ext === "webm") mime = "video/webm";
            else if (ext === "pdf") mime = "application/pdf";
            else if (ext === "json") mime = "application/json";
            else mime = "application/octet-stream";
          }

          if (mime.startsWith("image/") || ["jpg", "jpeg", "png", "webp", "svg", "gif", "avif", "ico"].includes(ext)) {
            return { mime, category: "photo" };
          }
          if (mime.startsWith("video/") || ["mp4", "webm", "mov", "mkv", "avi"].includes(ext)) {
            return { mime, category: "video" };
          }
          if (bucketName === "documents" || mime === "application/pdf" || ["pdf", "doc", "docx", "xls", "xlsx"].includes(ext)) {
            return { mime, category: "document" };
          }
          return { mime, category: "other" };
        }

        // Função para listar recursivamente todos os arquivos com seus caminhos relativos
        async function listBucketFilesRecursive(
          bucket: string,
          prefix = ""
        ): Promise<Array<{ name: string; fullPath: string; metadata?: any; updated_at?: string }>> {
          let list: Array<{ name: string; fullPath: string; metadata?: any; updated_at?: string }> = [];
          const { data: items, error: lErr } = await supabaseAdmin.storage
            .from(bucket)
            .list(prefix, { limit: 500, sortBy: { column: "name", order: "asc" } });

          if (lErr || !items) return list;

          for (const it of items) {
            if (it.name === ".emptyFolderPlaceholder") continue;
            const fullPath = prefix ? `${prefix}/${it.name}` : it.name;
            if (!it.id || it.metadata === null || it.id === null) {
              // Subpasta: chamada recursiva
              const subs = await listBucketFilesRecursive(bucket, fullPath);
              list = list.concat(subs);
            } else {
              list.push({
                name: it.name,
                fullPath,
                metadata: it.metadata,
                updated_at: it.updated_at,
              });
            }
          }
          return list;
        }

        for (const bucket of bucketsToBackup) {
          const isPhotoBucket = photoBuckets.includes(bucket);
          const isVideoBucket = videoBuckets.includes(bucket);
          const isDocumentBucket = documentBuckets.includes(bucket);

          const bucketFiles = await listBucketFilesRecursive(bucket);
          bucketSummaries[bucket] = { count: 0, total_bytes: 0, files: [] };

          for (const f of bucketFiles) {
            totalSourceFiles++;
            const rawMime = f.metadata?.mimetype;
            const { mime, category } = classifyMimeAndCategory(f.name, rawMime, bucket);

            if (category === "photo" || isPhotoBucket) sourcePhotosCount++;
            else if (category === "video" || isVideoBucket) sourceVideosCount++;
            else if (category === "document" || isDocumentBucket) sourceDocumentsCount++;

            try {
              const { data: blob, error: dlErr } = await supabaseAdmin.storage
                .from(bucket)
                .download(f.fullPath);

              if (dlErr || !blob) {
                console.warn(`[run-backup] Aviso ao baixar ${bucket}/${f.fullPath}:`, dlErr);
                continue;
              }

              const arrBuffer = await blob.arrayBuffer();
              const u8 = new Uint8Array(arrBuffer);
              const fileSha = bufferToHex(await crypto.subtle.digest("SHA-256", u8));

              storageFolder?.file(`${bucket}/${f.fullPath}`, u8);
              const relZipPath = `storage/${bucket}/${f.fullPath}`;
              checksums[relZipPath] = fileSha;

              bucketSummaries[bucket].count++;
              bucketSummaries[bucket].total_bytes += u8.byteLength;
              bucketSummaries[bucket].files.push(f.fullPath);

              totalStorageFiles++;
              totalStorageBytes += u8.byteLength;

              if (category === "photo" || isPhotoBucket) photosCount++;
              else if (category === "video" || isVideoBucket) videosCount++;
              else if (category === "document" || isDocumentBucket) documentsCount++;

              storageManifestEntries.push({
                bucket,
                path: f.fullPath,
                category,
                mime_type: mime,
                size: u8.byteLength,
                sha256: fileSha,
                updated_at: f.updated_at || now.toISOString(),
                metadata: f.metadata || {},
              });
            } catch (dlEx) {
              console.warn(`[run-backup] Aviso ao baixar ${bucket}/${f.fullPath}:`, dlEx);
            }
          }
        }

        // Validação Obrigatória de Integridade do Storage
        if (includePhotos && sourcePhotosCount > photosCount) {
          throw new Error(
            `Falha de Integridade: ${sourcePhotosCount} fotos foram encontradas nos buckets, mas apenas ${photosCount} foram empacotadas no ZIP.`
          );
        }

        if (includeVideos && sourceVideosCount > videosCount) {
          throw new Error(
            `Falha de Integridade: ${sourceVideosCount} vídeos foram encontrados nos buckets, mas apenas ${videosCount} foram empacotados no ZIP.`
          );
        }

        if (totalSourceFiles > totalStorageFiles) {
          throw new Error(
            `Falha de Integridade: ${totalSourceFiles} arquivos de Storage foram encontrados, mas apenas ${totalStorageFiles} foram empacotados no ZIP.`
          );
        }

        // 5. Manifesto e Metadados
        const manifest = {
          backup_version: "1.0",
          application: "Jucélia Santana Engenharia Civil",
          created_at: now.toISOString(),
          created_by: {
            id: user.id,
            email: profile.email || user.email,
            name: profile.full_name || "Administrador",
          },
          backup_type: "manual",
          source_environment: "production",
          database_summary: {
            total_tables: tablesToBackup.length,
            total_records: totalRecords,
            tables: tableSummaries,
          },
          storage_summary: {
            include_photos: includePhotos,
            include_videos: includeVideos,
            include_documents: includeDocuments,
            photos_count: photosCount,
            videos_count: videosCount,
            documents_count: documentsCount,
            total_buckets: bucketsToBackup.length,
            total_files: totalStorageFiles,
            total_bytes: totalStorageBytes,
            storage_buckets_included: bucketsToBackup,
            buckets: bucketSummaries,
          },
          metadata: {
            generated_by: "Supabase Edge Function (run-backup)",
            destination_provider: "google_drive",
            destination_folder_name: folderName,
            include_photos: includePhotos,
            include_videos: includeVideos,
            include_documents: includeDocuments,
          },
        };

        const manifestStr = JSON.stringify(manifest, null, 2);
        checksums["manifest.json"] = await sha256Hex(manifestStr);

        zip.file("manifest.json", manifestStr);
        metaFolder?.file("checksums.json", JSON.stringify(checksums, null, 2));
        metaFolder?.file("storage.json", JSON.stringify(storageManifestEntries, null, 2));
        metaFolder?.file(
          "schema.json",
          JSON.stringify(
            {
              format_version: "1.0",
              engine: "PostgreSQL / Supabase / Google Drive",
              database_tables: tablesToBackup,
              storage_buckets: bucketsToBackup,
            },
            null,
            2
          )
        );

        // 6. Gera Pacote ZIP
        const zipBytes = await zip.generateAsync({
          type: "uint8array",
          compression: "DEFLATE",
          compressionOptions: { level: 6 },
        });

        const packageSize = zipBytes.byteLength;
        const finalPackageSha = bufferToHex(await crypto.subtle.digest("SHA-256", zipBytes));

        if (packageSize <= 0) {
          throw new Error("Erro na geração do pacote: o arquivo gerado possui 0 bytes.");
        }

        // 7. Upload Multipart para o Google Drive
        const boundary = "-------314159265358979323846";
        const delimiter = `\r\n--${boundary}\r\n`;
        const closeDelimiter = `\r\n--${boundary}--`;

        const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({
          name: fileName,
          parents: folderId && folderId !== "root" ? [folderId] : [],
          mimeType: "application/zip",
          description: "Backup Oficial do Sistema — Jucélia Santana Engenharia Civil",
        })}`;
        const mediaPartHeader = `${delimiter}Content-Type: application/zip\r\n\r\n`;

        const encoder = new TextEncoder();
        const metaBytes = encoder.encode(metadataPart);
        const mediaHeaderBytes = encoder.encode(mediaPartHeader);
        const closeBytes = encoder.encode(closeDelimiter);

        const totalLength =
          metaBytes.byteLength + mediaHeaderBytes.byteLength + zipBytes.byteLength + closeBytes.byteLength;
        const combinedBuffer = new Uint8Array(totalLength);

        let offset = 0;
        combinedBuffer.set(metaBytes, offset);
        offset += metaBytes.byteLength;
        combinedBuffer.set(mediaHeaderBytes, offset);
        offset += mediaHeaderBytes.byteLength;
        combinedBuffer.set(zipBytes, offset);
        offset += zipBytes.byteLength;
        combinedBuffer.set(closeBytes, offset);

        const uploadRes = await fetch(
          "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,size,webViewLink",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authDrive.accessToken}`,
              "Content-Type": `multipart/related; boundary=${boundary}`,
            },
            body: combinedBuffer,
          }
        );

        if (!uploadRes.ok) {
          const upErr = await uploadRes.text();
          throw new Error(`Falha no upload para o Google Drive: ${upErr}`);
        }

        const driveFile = await uploadRes.json();

        // 8. Atualiza registro em system_backups para completed
        const completedIso = new Date().toISOString();
        const { data: updatedBackup, error: updErr } = await supabaseAdmin
          .from("system_backups")
          .update({
            status: "completed",
            file_id: driveFile.id,
            file_name: driveFile.name || fileName,
            file_size: driveFile.size ? Number(driveFile.size) : packageSize,
            metadata: {
              ...manifest,
              sha256_checksum: finalPackageSha,
              completed_at: completedIso,
              webViewLink: driveFile.webViewLink,
            },
            updated_at: completedIso,
          })
          .eq("id", backupRecordId)
          .select("*")
          .single();

        // 9. Registra auditoria de conclusão
        await supabaseAdmin.from("admin_audit_logs").insert({
          user_id: user.id,
          user_email: profile.email || user.email,
          action: "BACKUP_MANUAL_COMPLETED",
          entity_type: "system_backups",
          entity_id: backupRecordId,
          details: {
            backup_name: fileName,
            file_id: driveFile.id,
            file_size: packageSize,
            sha256: finalPackageSha,
            tables_count: tablesToBackup.length,
            records_count: totalRecords,
            storage_files_count: totalStorageFiles,
          },
        });

        return new Response(
          JSON.stringify({
            success: true,
            backup: updatedBackup || newBackup,
            fileId: driveFile.id,
            fileName: driveFile.name || fileName,
            fileSize: driveFile.size ? Number(driveFile.size) : packageSize,
            sha256: finalPackageSha,
            webViewLink: driveFile.webViewLink || `https://drive.google.com/file/d/${driveFile.id}/view`,
            totalTables: tablesToBackup.length,
            totalRecords,
            totalStorageFiles,
            totalStorageBytes,
          }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch (backupErr: any) {
        console.error("[run-backup error]:", backupErr);
        // Atualiza status para failed em caso de erro
        await supabaseAdmin
          .from("system_backups")
          .update({
            status: "failed",
            error_message: backupErr.message || "Erro durante o processamento do backup.",
            updated_at: new Date().toISOString(),
          })
          .eq("id", backupRecordId);

        await supabaseAdmin.from("admin_audit_logs").insert({
          user_id: user.id,
          user_email: profile.email || user.email,
          action: "BACKUP_MANUAL_FAILED",
          entity_type: "system_backups",
          entity_id: backupRecordId,
          details: { error: backupErr.message },
        });

        return new Response(
          JSON.stringify({ success: false, error: backupErr.message || "Erro na geração do backup." }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    return new Response(
      JSON.stringify({ error: "Ação não reconhecida" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("[google-drive-oauth error]:", err.message || err);
    return new Response(
      JSON.stringify({ error: err.message || "Erro interno na Edge Function" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

