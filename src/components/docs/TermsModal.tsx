// /src/components/docs/TermsModal.tsx
import React from 'react';
import { Modal } from '../ui/Modal';
import { ShieldCheck, Award, FileText, Lock, Scale, CheckCircle2, Copy } from 'lucide-react';
import { COMPANY_INFO } from '../../data/companyData';

interface TermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TermsModal: React.FC<TermsModalProps> = ({ isOpen, onClose }) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Termos de Uso, Propriedade Intelectual e Direitos Reservados"
      maxWidth="2xl"
    >
      <div className="space-y-6 text-slate-300 font-jakarta text-xs sm:text-sm">
        
        {/* Header Badge */}
        <div className="p-4 bg-[#121316] border border-[#C5A059]/30 rounded-xl flex items-center justify-between gap-4">
          <div>
            <h4 className="font-cinzel font-bold text-white text-sm sm:text-base">
              Copyright © {new Date().getFullYear()} Jucélia Santana Engenharia Civil
            </h4>
            <p className="text-slate-400 text-xs mt-0.5">
              Todos os Direitos Reservados • Registro Profissional {COMPANY_INFO.crea}
            </p>
          </div>
          <div className="shrink-0 p-2.5 bg-[#C5A059]/10 rounded-xl border border-[#C5A059]/30 text-[#C5A059]">
            <Scale className="w-5 h-5" />
          </div>
        </div>

        {/* Section 1: Proprietary Rights */}
        <div className="space-y-2">
          <h5 className="font-cinzel font-bold text-[#C5A059] text-sm uppercase tracking-wider flex items-center gap-2">
            <FileText className="w-4 h-4" /> 1. Propriedade Intelectual e Projetos
          </h5>
          <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
            Todos os projetos estruturais, modelos digitais e arquivos 3D, plantas técnicas, desenhos executivos, laudos de avaliação, vistorias cautelares e conteúdos disponibilizados neste portal são de propriedade autoral exclusiva de <strong className="text-white">Engenheira Jucélia de Souza Santana (CREA - RO 22129-D)</strong>.
          </p>
          <p className="text-slate-400 text-xs leading-relaxed">
            É estritamente proibida a reprodução parcial ou total, alteração, redistribuição ou reutilização não autorizada de cálculos, pranchas e memoriais descritivos sem a prévia anuência por escrito e emissão correspondente da Anotação de Responsabilidade Técnica (ART).
          </p>
        </div>

        {/* Section 2: Technical Responsibility */}
        <div className="space-y-2">
          <h5 className="font-cinzel font-bold text-[#C5A059] text-sm uppercase tracking-wider flex items-center gap-2">
            <Award className="w-4 h-4" /> 2. Responsabilidade Técnica e Legislação CREA/CONFEA
          </h5>
          <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
            Toda prestação de serviço de engenharia executada por este escritório obedece rigorosamente à Lei Federal nº 5.194/1966 e à Resolução CONFEA nº 1.025/2009. Cada obra ou projeto possui vínculo direto com uma ART individual registrada perante o CREA-RO.
          </p>
          <div className="p-3 bg-[#121316] border border-white/10 rounded-xl text-xs space-y-1">
            <div className="flex items-center gap-2 text-white font-bold">
              <CheckCircle2 className="w-4 h-4 text-[#C5A059]" />
              <span>Garantia de Autenticidade Normativa</span>
            </div>
            <p className="text-slate-400">
              O cliente ou contratante recebe vias assinadas digitalmente e certificadas via Gov.br / ICP-Brasil para comprovação legal perante prefeituras, cartórios e órgãos ambientais.
            </p>
          </div>
        </div>

        {/* Section 3: LGPD & Privacy */}
        <div className="space-y-2">
          <h5 className="font-cinzel font-bold text-[#C5A059] text-sm uppercase tracking-wider flex items-center gap-2">
            <Lock className="w-4 h-4" /> 3. Privacidade e Proteção de Dados (LGPD)
          </h5>
          <p className="text-slate-300 leading-relaxed text-xs sm:text-sm">
            Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), todos os dados cadastrais, plantas prediais, orçamentos e documentos sigilosos de clientes são armazenados sob criptografia ponta a ponta e jamais compartilhados com terceiros sem autorização.
          </p>
        </div>

        {/* Section 4: Portal Usage Terms */}
        <div className="space-y-2">
          <h5 className="font-cinzel font-bold text-[#C5A059] text-sm uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> 4. Condições de Uso do Portal
          </h5>
          <p className="text-slate-400 text-xs leading-relaxed">
            As calculadoras estimativas e simuladores disponibilizados no site possuem caráter meramente informativo e preliminar. A definição final de bitolas de aço, volumes de concreto, sondagens de solo e custos de execução requer obrigatoriamente estudo de viabilidade técnica em campo e projeto executivo assinado.
          </p>
        </div>

        {/* Footer Note */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <span>Dúvidas sobre os termos? Entre em contato pelos e-mails: <strong className="text-white">{COMPANY_INFO.emailOutlook}</strong> ou <strong className="text-white">{COMPANY_INFO.emailGmail}</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#C5A059] text-black font-bold uppercase tracking-wider rounded-lg hover:bg-[#b08e4a] transition-all cursor-pointer"
          >
            Compreendido
          </button>
        </div>

      </div>
    </Modal>
  );
};
