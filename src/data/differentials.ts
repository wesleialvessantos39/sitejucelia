// /src/data/differentials.ts
import { DifferentialItem } from '../types';

export const DIFFERENTIALS_LIST: DifferentialItem[] = [
  {
    id: 'atendimento-personalizado',
    titulo: 'Atendimento Personalizado',
    descricao: 'Acompanhamento direto e exclusivo pela Engª Jucélia Santana em cada etapa do projeto, garantindo canal direto de comunicação e alinhamento sob medida.',
    icone: 'UserCheck',
    ordem: 1,
    ativo: true,
    number: '01'
  },
  {
    id: 'planejamento-tecnico',
    titulo: 'Planejamento Técnico Detalhado',
    descricao: 'Análise minuciosa de solo, cargas estruturais e condicionantes ambientais antes do cálculo, minimizando imprevistos e aditivos de custo em canteiro.',
    icone: 'Compass',
    ordem: 2,
    ativo: true,
    number: '02'
  },
  {
    id: 'compromisso-prazos',
    titulo: 'Compromisso com Prazos',
    descricao: 'Cronogramas executivos rigorosos com marcos de entrega transparentes, assegurando pontualidade na emissão de pranchas, memoriais e laudos.',
    icone: 'Clock',
    ordem: 3,
    ativo: true,
    number: '03'
  },
  {
    id: 'seguranca-primeiro',
    titulo: 'Segurança em Primeiro Lugar',
    descricao: 'Cálculos alinhados estritamente às NBRs da ABNT (NBR 6118, NBR 8800, NBR 15575), com coeficientes de segurança calibrados para proteção total.',
    icone: 'ShieldCheck',
    ordem: 4,
    ativo: true,
    number: '04'
  },
  {
    id: 'solucoes-sob-medida',
    titulo: 'Soluções Sob Medida',
    descricao: 'Engenharia customizada para os desafios climáticos e geotécnicos da região Norte, agronegócio rondoniense e estruturas industriais complexas.',
    icone: 'Layers',
    ordem: 5,
    ativo: true,
    number: '05'
  },
  {
    id: 'transparencia-execucao',
    titulo: 'Transparência em Toda a Execução',
    descricao: 'Comunicação técnica clara, relatórios de evolução e total visibilidade das premissas de cálculo e especificações sem surpresas orçamentárias.',
    icone: 'Eye',
    ordem: 6,
    ativo: true,
    number: '06'
  },
  {
    id: 'responsabilidade-tecnica',
    titulo: 'Responsabilidade Técnica (ART/CREA)',
    descricao: 'Emissão de Anotação de Responsabilidade Técnica (ART) junto ao CREA-RO para cada serviço, proporcionando amparo legal e segurança institucional.',
    icone: 'Award',
    ordem: 7,
    ativo: true,
    number: '07'
  },
  {
    id: 'qualidade-etapa',
    titulo: 'Qualidade em Cada Etapa',
    descricao: 'Modelagem 3D detalhada com checagem de interferências, detalhamento executivo claro e quantitativos sem margem para dúvidas em obra.',
    icone: 'CheckCircle2',
    ordem: 8,
    ativo: true,
    number: '08'
  }
];

/**
 * Retorna os diferenciais ativos ordenados pelo campo 'ordem'
 */
export const getActiveDifferentials = (): DifferentialItem[] => {
  return DIFFERENTIALS_LIST
    .filter(item => item.ativo)
    .sort((a, b) => a.ordem - b.ordem);
};
