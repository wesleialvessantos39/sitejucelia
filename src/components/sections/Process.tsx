// /src/components/sections/Process.tsx
import React from 'react';
import { motion } from 'motion/react';
import { SectionHeader } from '../ui/SectionHeader';
import { useSiteContent } from '../../context/SiteContentContext';
import { Button } from '../ui/Button';
import { getWhatsAppUrl } from '../../data/companyData';
import { 
  ClipboardList, 
  Compass, 
  ShieldCheck, 
  HardHat, 
  ArrowRight,
  Phone,
  CheckCircle2
} from 'lucide-react';

interface ProcessStep {
  number: string;
  icon: React.ElementType;
  title: string;
  subtitle: string;
  description: string;
  deliverables: string[];
}

export const Process: React.FC = () => {
  const { content } = useSiteContent();
  const processContent = content.process;
  const steps: ProcessStep[] = [
    {
      number: '01',
      icon: ClipboardList,
      title: 'Consulta e Diagnóstico',
      subtitle: 'Alinhamento Inicial e Análise Técnica',
      description: 'Levantamento de necessidades, análise preliminar do projeto arquitetônico e estudo do terreno para definição segura do escopo técnico.',
      deliverables: ['Estudo de viabilidade', 'Escopo técnico detalhado', 'Definição de diretrizes']
    },
    {
      number: '02',
      icon: Compass,
      title: 'Elaboração e Cálculo',
      subtitle: 'Modelagem 3D e Engenharia Estrutural',
      description: 'Cálculo computacional avançado das estruturas, compatibilização tridimensional e dimensionamento racional conforme normas ABNT (NBR 6118 / 6120).',
      deliverables: ['Modelagem tridimensional', 'Detalhamento de armaduras', 'Racionalização de aço e concreto']
    },
    {
      number: '03',
      icon: ShieldCheck,
      title: 'Emissão de ART e Validação',
      subtitle: 'Conformidade Legal no CREA-RO',
      description: 'Registro formal da Anotação de Responsabilidade Técnica (ART) e emissão de memoriais descritivos que asseguram conformidade jurídica e técnica.',
      deliverables: ['ART registrada no CREA-RO', 'Memoriais de cálculo', 'Documentação oficial']
    },
    {
      number: '04',
      icon: HardHat,
      title: 'Acompanhamento e Entrega',
      subtitle: 'Suporte na Obra e Acervo Final',
      description: 'Acompanhamento consultivo da execução no canteiro de obras, esclarecimento de dúvidas técnicas e entrega do acervo definitivo ao cliente.',
      deliverables: ['Vistorias técnicas', 'Orientação à equipe de obra', 'Entrega do projeto final']
    }
  ];

  const whatsAppUrl = getWhatsAppUrl('Olá, Engª Jucélia Santana! Gostaria de entender melhor as etapas para iniciar meu projeto.');

  return (
    <section 
      id="processo" 
      role="region"
      aria-label="Processo de Trabalho e Metodologia"
      className="py-20 md:py-28 bg-[#0A1220] relative overflow-hidden border-t border-white/5"
    >
      {/* Background Decorative Accent Lighting */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#C5A059]/5 rounded-full filter blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <SectionHeader
          badgeText={processContent.badgeText || "Metodologia Executiva"}
          title={processContent.title || "PROCESSO DE TRABALHO DE"}
          highlightTitle={processContent.highlightTitle || "ALTO PADRÃO"}
          subtitle={processContent.subtitle || "Um fluxo estruturado e transparente desde o diagnóstico técnico preliminar até a conclusão com emissão de ART e acompanhamento executivo no canteiro de obras."}
        />

        {/* Process Steps Container (Desktop Horizontal Flow with Connectors / Mobile Vertical Timeline) */}
        <div className="relative mt-12 md:mt-16">
          
          {/* Desktop Horizontal Connecting Line */}
          <div className="hidden lg:block absolute top-[52px] left-[10%] right-[10%] h-[2px] bg-gradient-to-r from-[#C5A059]/20 via-[#C5A059] to-[#C5A059]/20 z-0" />

          {/* Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8 relative z-10">
            {steps.map((step, index) => {
              const IconComponent = step.icon;
              return (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  className="bg-[#122038] border border-white/10 rounded-2xl p-6 sm:p-7 flex flex-col justify-between hover:border-[#C5A059]/60 transition-all duration-300 group hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/70 relative overflow-hidden"
                >
                  {/* Subtle Top Card Accent Highlight */}
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#C5A059] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  <div>
                    {/* Top Bar: Step Number Badge + Icon */}
                    <div className="flex items-center justify-between mb-6">
                      <div className="w-12 h-12 rounded-xl bg-[#0A1220] border border-[#C5A059]/40 flex items-center justify-center text-[#C5A059] group-hover:bg-[#C5A059] group-hover:text-black transition-all shadow-inner relative z-10">
                        <IconComponent className="w-6 h-6" />
                      </div>

                      <span className="font-cinzel font-black text-3xl sm:text-4xl text-[#C5A059]/30 group-hover:text-[#C5A059] transition-colors">
                        {step.number}
                      </span>
                    </div>

                    {/* Step Subtitle / Tag */}
                    <span className="text-[10px] font-jakarta font-bold uppercase tracking-widest text-[#C5A059] block mb-1">
                      Etapa {step.number} — {step.subtitle}
                    </span>

                    {/* Step Title */}
                    <h3 className="font-cinzel font-bold text-lg sm:text-xl text-white group-hover:text-[#C5A059] transition-colors mb-3">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="font-jakarta text-xs sm:text-sm text-slate-300 leading-relaxed mb-6">
                      {step.description}
                    </p>
                  </div>

                  {/* Deliverables List */}
                  <div className="pt-4 border-t border-white/5">
                    <span className="font-jakarta text-[11px] font-bold uppercase tracking-wider text-[#C5A059]/90 block mb-2">
                      Entregáveis da Etapa:
                    </span>
                    <ul className="space-y-1.5 font-jakarta text-xs text-slate-300">
                      {step.deliverables.map((item, dIdx) => (
                        <li key={dIdx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A059] shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Bottom Call to Action Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16 p-6 sm:p-8 rounded-2xl bg-[#122038] border border-[#C5A059]/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden"
        >
          <div className="space-y-2 text-center md:text-left relative z-10">
            <span className="font-cinzel text-xs font-bold uppercase tracking-widest text-[#C5A059] block">
              Pronto para Dar o Primeiro Passo?
            </span>
            <h3 className="font-cinzel font-bold text-white text-xl sm:text-2xl">
              Agende uma Consulta Técnica com a Engª Jucélia Santana
            </h3>
            <p className="font-jakarta text-xs sm:text-sm text-slate-300 max-w-xl">
              Analisamos sua demanda técnica com confidencialidade, agilidade e rigor normativo para apresentar o plano ideal.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto shrink-0 relative z-10">
            <a
              href={whatsAppUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto"
            >
              <Button
                size="md"
                variant="gold"
                icon={<Phone className="w-4 h-4" />}
                className="font-bold w-full sm:w-auto shadow-lg shadow-[#C5A059]/20"
              >
                Iniciar Consulta Técnica
              </Button>
            </a>
            <a
              href="#contato"
              className="w-full sm:w-auto font-jakarta text-xs font-bold uppercase tracking-wider text-slate-300 hover:text-white py-3 px-5 rounded-xl border border-white/10 hover:border-[#C5A059]/40 bg-[#0A1220] transition-all flex items-center justify-center gap-1.5"
            >
              <span>Enviar Mensagem</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#C5A059]" />
            </a>
          </div>
        </motion.div>

      </div>
    </section>
  );
};
