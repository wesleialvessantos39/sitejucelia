// src/pages/OAuthComplete.tsx
// =============================================================================
// Rota Frontend de Conclusão do OAuth 2.0 do Google Drive
// Projeto: Engª Jucélia Santana (Etapa 20)
// Responsabilidade: Fechar suavemente a janela popup/aba externa de autorização
//                  ou redirecionar automaticamente para o painel principal caso o
//                  navegador (ex: mobile) impeça window.close().
// =============================================================================

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export default function OAuthComplete() {
  const [searchParams] = useSearchParams();
  const result = searchParams.get('result') || 'connected';
  const reason = searchParams.get('reason');

  const [statusMessage, setStatusMessage] = useState<string>(
    result === 'connected'
      ? 'Conexão autorizada com sucesso! Concluindo sincronização...'
      : 'Não foi possível autorizar o acesso ao Google Drive.'
  );

  useEffect(() => {
    // 1. Tenta fechar imediatamente a janela/aba se foi aberta via script
    try {
      window.close();
    } catch (e) {
      console.warn('[OAuthComplete] window.close() inicial bloqueado:', e);
    }

    // 2. Fallback resiliente: se a janela não fechar em 400ms (típico de alguns browsers mobile),
    // redireciona diretamente para o painel principal
    const timer = setTimeout(() => {
      try {
        // Tenta fechar uma segunda vez
        window.close();
      } catch (e) {}

      // Se ainda estiver aberta, substitui a URL na mesma aba para o painel
      const targetParam = result === 'connected' ? 'google_drive=connected' : `google_drive=error${reason ? `&reason=${reason}` : ''}`;
      window.location.replace(`/admin/backups?${targetParam}`);
    }, 450);

    return () => clearTimeout(timer);
  }, [result, reason]);

  const isSuccess = result === 'connected';

  return (
    <div
      id="oauth-complete-container"
      className="min-h-screen bg-[#070D18] flex items-center justify-center p-4 text-white font-sans selection:bg-amber-500/20"
    >
      <div
        id="oauth-complete-card"
        className="max-w-md w-full bg-[#0D1527] border border-slate-800/80 rounded-2xl p-6 md:p-8 text-center shadow-2xl relative overflow-hidden"
      >
        <div className="flex justify-center mb-5">
          {isSuccess ? (
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-8 h-8" />
            </div>
          )}
        </div>

        <h1 className="text-xl font-bold text-slate-100 mb-2">
          {isSuccess ? 'Google Drive Conectado' : 'Autorização Cancelada'}
        </h1>

        <p className="text-sm text-slate-400 mb-6 leading-relaxed">
          {statusMessage}
        </p>

        <div className="flex items-center justify-center space-x-2 text-xs text-slate-500">
          <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
          <span>Retornando automaticamente ao painel...</span>
        </div>
      </div>
    </div>
  );
}
