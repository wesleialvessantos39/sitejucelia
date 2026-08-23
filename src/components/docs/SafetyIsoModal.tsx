// /src/components/docs/SafetyIsoModal.tsx
import React from 'react';
import { Modal } from '../ui/Modal';
import { Shield, FileCheck, Award, CheckCircle2, HardHat, ShieldCheck, Bookmark, Scale } from 'lucide-react';
import { COMPANY_INFO } from '../../data/companyData';

interface SafetyIsoModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SafetyIsoModal: React.FC<SafetyIsoModalProps> = ({ isOpen, onClose }) => {
  const nbrStandards = [
    {
      code: 'ABNT NBR 6118',
      title: 'Projeto de Estruturas de Concreto',
      description: 'Procedimentos rigorosos de dimensionamento à fadiga, limites de deformação e cobrimento de armaduras.'
    },
    {
      code: 'ABNT NBR 8800',
      title: 'Projeto de Estruturas de Aço e Mistas',
      description: 'Cálculo e verificação de estabilidade em galpões industriais, treliças e coberturas metálicas.'
    },
    {
      code: 'ABNT NBR 15575',
      title: 'Edificações Habitacionais — Desempenho',
      description: 'Exigências de segurança estrutural, estanqueidade à água, desempenho térmico e acústico.'
    },
    {
      code: 'ABNT NBR 13752',
      title: 'Perícias de Engenharia na Construção Civil',
      description: 'Diretrizes oficiais para laudos cautelares, vistorias de vizinhança e pareceres judiciais.'
    },
    {
      code: 'ABNT NBR 14653',
      title: 'Avaliação de Bens Imóveis e Glebas',
      description: 'Metodologia científica para determinação de valor de mercado e liquidação forçada.'
    },
    {
      code: 'ABNT NBR 6122',
      title: 'Projeto e Execução de Fundações',
      description: 'Sapatas, estacas e blocos calculados conforme boletins de sondagem SPT do terreno.'
    }
  ];

  const isoPillars = [
    {
      iso: 'ISO 9001',
      title: 'Gestão da Qualidade Executiva',
      description: 'Processos padronizados de verificação de memória de cálculo, listas de corte de aço e controle pluviométrico de concretagem.'
    },
    {
      iso: 'ISO/IEC 27001',
      title: 'Segurança da Informação e Projetos',
      description: 'Proteção criptográfica de modelos 3D e prontuários estruturais contra perdas e acessos indevidos.'
    },
    {
      iso: 'NR-18 e NR-35',
      title: 'Segurança no Trabalho e Altura',
      description: 'Conformidade integral em visitas técnicas, inspeções em coberturas metálicas e fiscalização de canteiro.'
    }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Política de Segurança, Conformidade Normativa e Padrões NBR ISO"
      maxWidth="2xl"
    >
      <div className="space-y-6 text-slate-300 font-jakarta text-xs sm:text-sm">
        
        {/* Header Badge */}
        <div className="p-4 bg-[#121316] border border-[#C5A059]/30 rounded-xl flex items-center justify-between gap-4">
          <div>
            <h4 className="font-cinzel font-bold text-white text-sm sm:text-base flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#C5A059]" />
              Compromisso Rigoroso com Segurança e Qualidade
            </h4>
            <p className="text-slate-400 text-xs mt-0.5">
              Responsabilidade Técnica Engª Jucélia Santana • {COMPANY_INFO.crea}
            </p>
          </div>
          <div className="shrink-0 p-2.5 bg-[#C5A059]/10 rounded-xl border border-[#C5A059]/30 text-[#C5A059]">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Section 1: ISO Pillars */}
        <div className="space-y-3">
          <h5 className="font-cinzel font-bold text-[#C5A059] text-sm uppercase tracking-wider flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> 1. Pilares ISO de Gestão e Segurança
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {isoPillars.map((item, idx) => (
              <div key={idx} className="p-3 bg-[#121316] border border-white/10 rounded-xl space-y-1.5">
                <span className="px-2 py-0.5 bg-[#C5A059]/20 text-[#C5A059] font-mono text-[10px] font-bold rounded">
                  {item.iso}
                </span>
                <h6 className="font-bold text-white text-xs block">{item.title}</h6>
                <p className="text-slate-400 text-[11px] leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Main ABNT NBR Standards Applied */}
        <div className="space-y-3">
          <h5 className="font-cinzel font-bold text-[#C5A059] text-sm uppercase tracking-wider flex items-center gap-2">
            <FileCheck className="w-4 h-4" /> 2. Principais Normas Regulamentadoras ABNT Aplicadas
          </h5>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {nbrStandards.map((nbr, idx) => (
              <div key={idx} className="p-3 bg-[#121316] border border-white/5 rounded-xl space-y-1">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                  <span className="font-bold text-white text-xs font-mono">{nbr.code}</span>
                </div>
                <span className="text-[#C5A059] text-[11px] font-semibold block">{nbr.title}</span>
                <p className="text-slate-400 text-[11px] leading-relaxed">{nbr.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Section 3: ART & Safety Guarantee */}
        <div className="p-4 bg-[#121316] border border-emerald-500/30 rounded-xl space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4" />
            <span>Garantia de Emissão de ART (Anotação de Responsabilidade Técnica)</span>
          </div>
          <p className="text-slate-300 text-xs leading-relaxed">
            Nenhum projeto ou parecer pericial sai do escritório sem a expedição da respectiva ART perante o CREA-RO. Isso assegura respaldo jurídico integral ao proprietário, investidor e construtor diante de fiscalizações públicas e exigências de seguros.
          </p>
        </div>

        {/* Footer Note */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-3">
          <span>Escritório de Engenharia Civil e Perícias • Ariquemes - Rondônia</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#C5A059] text-black font-bold uppercase tracking-wider rounded-lg hover:bg-[#b08e4a] transition-all cursor-pointer"
          >
            Fechar Janela
          </button>
        </div>

      </div>
    </Modal>
  );
};
