// /src/data/companyData.ts
import { ServiceItem, ProjectItem, DifferentialItem, FAQItem } from '../types';

export const COMPANY_INFO = {
  name: 'Jucélia Santana Engenheira Civil',
  shortName: 'Jucélia Santana',
  crea: 'CREA: 22430D/RO',
  tagline: 'Projetos Estruturais, Laudos Periciais e Acompanhamento de Obras',
  description: 'Escritório especializado em cálculo estrutural, perícias técnicas, laudos e gerenciamento de obras residenciais, comerciais e do agronegócio em Ariquemes e região.',
  phone: '(69) 99208-6883',
  whatsapp: '5569992086883',
  emailOutlook: 'eng.juceliasantana@outlook.com',
  emailGmail: 'juceliadss18@gmail.com',
  email: 'eng.juceliasantana@outlook.com',
  address: 'Avenida dos Diamantes 2763, P.A.D. marechal Dutra, Ariquemes - RO',
  hours: 'Segunda a Sexta, das 08h às 18h',
  instagram: 'https://www.instagram.com/eng.civil_jucelia_santana?igsh=amFtdGl3aXJsYjNz',
  stats: [
    { value: '+50k', label: 'm² em Obras e Projetos' },
    { value: '+60', label: 'Laudos e Perícias Realizadas' },
    { value: '100%', label: 'Conformidade com Normas NBR / ABNT' },
    { value: '6+', label: 'Anos de Experiência em Engenharia Civil' }
  ]
};

export function getWhatsAppUrl(customMessage?: string): string {
  const number = COMPANY_INFO.whatsapp;
  const defaultText = `Olá, Engª Jucélia Santana! Gostaria de solicitar informações sobre seus serviços de Engenharia Civil em Ariquemes e região.`;
  const message = customMessage || defaultText;
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export const DEFAULT_EMAIL_SUBJECT = "Solicitação de Orçamento / Consulta Técnica — Engª Jucélia Santana";

export const DEFAULT_EMAIL_BODY = `Olá, Engª Jucélia Santana!

Gostaria de solicitar um orçamento e consulta técnica para projeto de engenharia civil.

- Nome / Empresa: 
- Cidade / Localidade: 
- Telefone / WhatsApp: 
- Assunto / Serviço de Interesse: 
- Descrição da Demanda / Projeto: 

Atenciosamente,`;

export function getGmailComposeUrl(customSubject?: string, customBody?: string, customTo?: string): string {
  const to = customTo || COMPANY_INFO.emailGmail;
  const subject = customSubject || DEFAULT_EMAIL_SUBJECT;
  const body = customBody || DEFAULT_EMAIL_BODY;
  const formattedBody = body.replace(/\r?\n/g, '\n');
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(to)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(formattedBody)}`;
}

export function getOutlookComposeUrl(customSubject?: string, customBody?: string, customTo?: string): string {
  const to = customTo || COMPANY_INFO.emailOutlook;
  const subject = customSubject || DEFAULT_EMAIL_SUBJECT;
  const body = customBody || DEFAULT_EMAIL_BODY;
  // Outlook Web requires CRLF (\r\n) for clean line break rendering
  const formattedBody = body.replace(/\r?\n/g, '\r\n');
  return `https://outlook.live.com/mail/0/deeplink/compose?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(formattedBody)}`;
}

export function getOutlookOfficeComposeUrl(customSubject?: string, customBody?: string, customTo?: string): string {
  const to = customTo || COMPANY_INFO.emailOutlook;
  const subject = customSubject || DEFAULT_EMAIL_SUBJECT;
  const body = customBody || DEFAULT_EMAIL_BODY;
  const formattedBody = body.replace(/\r?\n/g, '\r\n');
  return `https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(to)}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(formattedBody)}`;
}

export function getMailtoUrl(toEmail?: string, customSubject?: string, customBody?: string): string {
  const to = toEmail || COMPANY_INFO.emailOutlook;
  const subject = customSubject || DEFAULT_EMAIL_SUBJECT;
  const body = customBody || DEFAULT_EMAIL_BODY;
  const formattedBody = body.replace(/\r?\n/g, '\r\n');
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(formattedBody)}`;
}

export const SERVICES_DATA: ServiceItem[] = [
  {
    id: 'projetos-estruturais',
    title: 'Projetos Estruturais e Cálculo',
    shortDescription: 'Dimensionamento estrutural em concreto armado e alvenaria estrutural para edificações residenciais de alto padrão, comerciais e industriais.',
    fullDescription: 'Projetos de engenharia de estruturas desenvolvidos com rigor normativo (NBR 6118) e tecnologia de ponta, priorizando a segurança estrutural, otimização de materiais e facilidade de execução no canteiro de obras.',
    iconName: 'Building2',
    category: 'estrutural',
    deliverables: [
      'Modelagem Tridimensional 3D (Eberick / CAD)',
      'Detalhamento de Armaduras e Peças Estruturais',
      'Memória de Cálculo Completa com Análise de Cargas',
      'Plano de Fôrmas e Esqueletamento',
      'Emissão de ART (Anotação de Responsabilidade Técnica)'
    ],
    normasTecnicas: ['NBR 6118 (Concreto Armado)', 'NBR 6120 (Cargas para Cálculo)', 'NBR 6122 (Fundações)']
  },
  {
    id: 'estruturas-metalicas',
    title: 'Estruturas Metálicas e Mistas',
    shortDescription: 'Projetos e dimensionamento de estruturas em aço para coberturas, mezaninos, galpões e estruturas comerciais de múltiplos pavimentos.',
    fullDescription: 'Desenvolvimento de projetos metálicos com foco em rapidez de montagem, durabilidade, estanqueidade e economia de insumos, atendendo rigorosamente à NBR 8800.',
    iconName: 'Layers',
    category: 'estrutural',
    deliverables: [
      'Dimensionamento de Perfis LAMINADOS e Soldados',
      'Detalhamento de Ligações Parafusadas e Soldadas',
      'Plano de Montagem Executivo para Canteiro',
      'Lista Quantitativa de Aço e Conexões',
      'Anotação de Responsabilidade Técnica (ART)'
    ],
    normasTecnicas: ['NBR 8800 (Estruturas de Aço)', 'NBR 14762 (Dimensionamento de Perfis Formados a Frio)']
  },
  {
    id: 'laudos-vistorias',
    title: 'Laudos Técnicos e Perícias',
    shortDescription: 'Inspeções técnicas, laudos de recebimento de imóvel, pareceres periciais estruturais e diagnósticos patológicos.',
    fullDescription: 'Elaboração de diagnósticos minuciosos sobre o estado de conservação e segurança de estruturas. Mapeamento de trincas, fissuras, corrosão de armaduras e infiltrações com fundamentação técnica e jurídica.',
    iconName: 'ClipboardCheck',
    category: 'laudos',
    deliverables: [
      'Laudo Pericial Cautelar de Vizinhança',
      'Inspeção Técnica de Segurança e Manutenção',
      'Laudo de Recebimento de Obras Novas',
      'Mapeamento Patológico com Relatório Fotográfico',
      'Parecer Técnico com Recomendações Corretivas'
    ],
    normasTecnicas: ['NBR 13752 (Perícias na Construção)', 'NBR 16747 (Inspeção Técnica Diagnóstica)']
  },
  {
    id: 'engenharia-agronegocio',
    title: 'Engenharia para o Agronegócio',
    shortDescription: 'Projetos e infraestrutura para galpões industriais, silos, barragens de terra, contenções e pistas de carga pesada.',
    fullDescription: 'Soluções integradas para propriedades rurais e agroindústrias, dimensionadas para suportar cargas elevadas, tráfego pesado de máquinas e intempéries do ambiente agropecuário.',
    iconName: 'Tractor',
    category: 'agronegocio',
    deliverables: [
      'Projeto de Galpões e Armazéns Graneleiros',
      'Projetos de Pistas de Manobra e Pavimentação Rígida',
      'Dimensionamento de Contenções e Taludes',
      'Estudo de Drenagem e Infraestrutura Pluvial Rural',
      'Acompanhamento e Responsabilidade Técnica de Obras'
    ],
    normasTecnicas: ['NBR 11682 (Estabilidade de Taludes)', 'NBR 7187 (Pontes e Estruturas)']
  },
  {
    id: 'acompanhamento-fiscalizacao',
    title: 'Acompanhamento e Fiscalização de Obras',
    shortDescription: 'Supervisão técnica contínua no canteiro de obras para auditoria de execução, conferência de fôrmas, armações e concretagem.',
    fullDescription: 'Fiscalização presencial periódica para assegurar que a execução do construtor siga fielmente o projeto executivo e as especificações de materiais, evitando falhas ocultas.',
    iconName: 'HardHat',
    category: 'gestao',
    deliverables: [
      'Relatórios Técnicos de Visita Periódica',
      'Conferência de Armação, Ancoragem e Cobrimento de Aço',
      'Supervisão do Processo de Concretagem e Adensamento',
      'Ensaio de Abatimento (Slump Test) e Rompimento de Corpos de Prova',
      'Registro no Diário de Obra'
    ],
    normasTecnicas: ['NBR 14931 (Execução de Estruturas de Concreto)', 'NBR 5738 (Moldagem de Corpos de Prova)']
  },
  {
    id: 'gestao-gerenciamento-obras',
    title: 'Planejamento e Gerenciamento Físico-Financeiro',
    shortDescription: 'Planejamento executivo, orçamentação detalhada, controle de custos, cotação de insumos e cronogramas integrados.',
    fullDescription: 'Gestão integral do investimento, garantindo a entrega dentro do orçamento e do prazo previstos, com controle rigoroso do fluxo de caixa e curva S de avanço físico.',
    iconName: 'BarChart3',
    category: 'gestao',
    deliverables: [
      'Cronograma Físico-Financeiro Detalhado (MS Project)',
      'Curva S e Relatórios Periódicos de Desempenho (KPIs)',
      'Gestão de Suprimentos e Cotações Técnicas de Materiais',
      'Orçamento Analítico Sintético de Custos',
      'Medição de Serviços para Liberação de Pagamentos'
    ],
    normasTecnicas: ['PBQP-H', 'NBR 12721 (Avaliação de Custos Unitários)']
  },
  {
    id: 'consultoria-compatibilizacao',
    title: 'Consultoria Técnica e Compatibilização de Projetos',
    shortDescription: 'Integração de disciplinas (arquitetura, estrutura, hidráulica e elétrica) para eliminação de interferências antes da obra.',
    fullDescription: 'Análise proativa através do processo de verificação de interferências entre disciplinas, evitando retrabalhos, desperdícios de materiais e aditivos orçamentários durante a construção.',
    iconName: 'Layers',
    category: 'consultoria',
    deliverables: [
      'Relatório de Interferências Estruturais e Arquitetônicas',
      'Modelo 3D Integrado e Compatibilizado (IFC)',
      'Ajustes de Alturas Úteis e Passagens de Tubulação',
      'Otimização de Custos Executivos'
    ],
    normasTecnicas: ['NBR 15965 (Sistema de Informação da Construção)']
  },
  {
    id: 'regularizacao-desmembramento',
    title: 'Regularização de Projetos e Habite-se',
    shortDescription: 'Processos técnicos junto à Prefeitura, CREA, Corpo de Bombeiros e Cartórios de Imóveis para regularização e habite-se.',
    fullDescription: 'Aprovação de projetos arquitetônicos e estruturais, obtenção do Habite-se, AVS e regularizações fundiárias urbanas e rurais com agilidade legal.',
    iconName: 'FileCheck2',
    category: 'consultoria',
    deliverables: [
      'Memorial Descritivo para Cartórios',
      'Projeto As-Built Atualizado da Edificação',
      'Obtenção do Habite-se e Certidões de Baixa de Construção',
      'Trâmite Técnico em Órgãos Públicos e Prefeitura'
    ],
    normasTecnicas: ['Legislação Municipal e Código de Obras Local']
  }
];

export const PROJECTS_DATA: ProjectItem[] = [
  {
    id: 'residencia-estrutural',
    title: 'RESIDÊNCIA',
    category: 'estrutural',
    categoryLabel: 'Projetos Estruturais',
    location: 'Ariquemes - RO',
    status: 'Obra Concluída',
    description: 'Concepção e cálculo de projeto estrutural residencial de alto padrão em Ariquemes - RO, desenvolvido com rigorosas análises de estabilidade, segurança e eficiência técnica.',
    challenge: 'Garantir a máxima estabilidade e eficiência estrutural para a residência, prevenindo deformações e assegurando conformidade integral com a NBR 6118.',
    solution: 'Dimensionamento otimizado de elementos estruturais em concreto armado, com detalhamento executivo completo e rigor técnico.',
    imageUrl: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154526-990dced4db0d?auto=format&fit=crop&w=1200&q=80'
    ],
    highlights: ['Análise de estabilidade e segurança NBR 6118', 'Detalhamento estrutural de alta precisão', 'Otimização de consumo de materiais'],
    servicesExecuted: [
      'Projeto Estrutural de Concreto Armado (NBR 6118)',
      'Detalhamento de Armaduras e Formas Executivas',
      'Análise de Carregamento e Estabilidade',
      'Emissão de ART de Concepção e Cálculo'
    ],
    hasVideo: false,
    videoUrl: undefined,
    videoTitle: undefined
  },
  {
    id: 'cobertura-galpao-logistico-metalico',
    title: 'Centro Logístico e Galpão de Aço',
    category: 'metalicas',
    categoryLabel: 'Estruturas Metálicas',
    location: 'Ariquemes - RO',
    year: '2024',
    area: '6.800 m²',
    status: 'Entregue',
    description: 'Projeto e detalhamento fabril de estrutura metálica treliçada para cobertura e fechamento lateral de centro de distribuição regional, dimensionado para fortes cargas de vento regional.',
    challenge: 'Garantir rigidez contra ações de vento de alta intensidade típicas da região Norte, otimizando o peso total de aço para reduzir custos de transporte e montagem.',
    solution: 'Uso de perfis formados a frio de alta resistência com ligações parafusadas pré-montadas em fábrica, reduzindo o tempo de montagem no canteiro em 40%.',
    imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80'
    ],
    highlights: ['Vão livre treliçado de 32 metros', 'Otimização de consumo de aço (22 kg/m²)', 'Montagem rápida em 35 dias'],
    servicesExecuted: [
      'Dimensionamento conforme NBR 8800 e NBR 14762',
      'Desenhos de Fabricação e Lista de Peças',
      'Detalhamento de Ancoragens e Chumbadores',
      'ART de Projeto Metálico'
    ],
    hasVideo: true,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoTitle: 'Time-Lapse da Montagem de Estrutura Metálica em Canteiro'
  },
  {
    id: 'complexo-agroindustrial-silos',
    title: 'Complexo de Silos e Moagem Agro',
    category: 'agronegocio',
    categoryLabel: 'Agronegócio',
    location: 'Ariquemes - RO',
    year: '2023',
    area: '28.000 m²',
    status: 'Em Operação',
    description: 'Engenharia de fundações pesadas e estruturas de apoio para conjunto de silos metálicos de 12.000 toneladas, moegas profundas e túneis operacionais de transbordo.',
    challenge: 'Suportar altíssimas pressões pontuais de grãos em solo de baixa capacidade superficial sem provocar recalques diferenciais que pudessem tombar os silos.',
    solution: 'Projeto de radier estaqueado com 96 estacas hélice contínua de 18 metros de profundidade por silo e túneis em concreto armado impermeabilizado.',
    imageUrl: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1592982537447-7440770cbfc9?auto=format&fit=crop&w=1200&q=80'
    ],
    highlights: ['Radiers estaqueados para 12.000 t', 'Túneis subterrâneos impermeabilizados', 'Moega dupla para carretas bitrem'],
    servicesExecuted: [
      'Projeto de Fundações Profundas e Contenções',
      'Cálculo de Pisos Industriais e Bases de Silo',
      'Supervisão e Fiscalização de Concretagem',
      'Anotação de Responsabilidade Técnica (ART)'
    ],
    hasVideo: true,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoTitle: 'Voo de Drone e Inspeção Aérea do Complexo Agrícola'
  },
  {
    id: 'fabrica-processamento-mineral',
    title: 'Planta de Processamento Agroindustrial',
    category: 'industriais',
    categoryLabel: 'Obras Industriais',
    location: 'Porto Velho - RO',
    year: '2023',
    area: '18.200 m²',
    status: 'Obra Entregue',
    description: 'Estrutura mista de concreto e aço para unidade de beneficiamento e usina de processamento, dimensionada para cargas dinâmicas graves de britadores e pontes rolantes de 20 toneladas.',
    challenge: 'Isolar a propagação de vibração excessiva provocada pelo maquinário pesado para a estrutura principal do galpão corporativo.',
    solution: 'Criação de blocos de fundação independentes com amortecedores elastoméricos e juntas de dilatação estrutural estratégicas.',
    imageUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1581092335397-9583fe92d232?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80'
    ],
    highlights: ['Caminho de rolamento para ponte rolante de 20t', 'Bases isoladas contra vibração mecânica', 'Piso reforçado com fibra metálica'],
    servicesExecuted: [
      'Cálculo Estrutural de Cargas Dinâmicas',
      'Dimensionamento de Caminhos de Rolamento',
      'Gerenciamento Executivo de Canteiro',
      'Laudo de Validação Estrutural'
    ],
    hasVideo: true,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoTitle: 'Tour Virtual e Execução de Estruturas Industriais'
  },
  {
    id: 'compatibilizacao-projetos-platinum',
    title: 'Compatibilização de Projetos do Empreendimento Platinum',
    category: 'consultoria',
    categoryLabel: 'Consultorias Técnicas',
    location: 'Porto Velho - RO',
    year: '2024',
    area: '14.500 m²',
    status: 'Concluído',
    description: 'Consultoria e compatibilização integrando projetos de estrutura, arquitetura, climatização, rede sanitária e combate a incêndio para empreendimento comercial e residencial de grande porte.',
    challenge: 'Detectar e resolver centenas de interferências críticas entre dutos de ar-condicionado, tubulações hidráulicas e vigas de concreto antes da fase de concretagem.',
    solution: 'Modelagem 3D integrada com relatórios automatizados de checagem de interferências, prevendo furos passantes estruturais reforçados no projeto orçamentário.',
    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    ],
    highlights: ['Zero retrabalho por furação de vigas', 'Eliminação de 142 interferências graves', 'Economia estimada de R$ 180 mil em obra'],
    servicesExecuted: [
      'Modelagem Integrada 3D',
      'Emissão de Relatório de Interferências',
      'Reuniões de Compatibilização Técnica',
      'Aprovação de Furações em Concreto'
    ],
    hasVideo: true,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoTitle: 'Vídeo Explicativo da Compatibilização BIM e Detecção de Clashes 3D'
  },
  {
    id: 'fiscalizacao-auditoria-edificio-comercial',
    title: 'Fiscalização e Auditoria de Obra Comercial',
    category: 'fiscalizacao',
    categoryLabel: 'Fiscalizações',
    location: 'Ariquemes - RO',
    year: '2024',
    area: '4.200 m²',
    status: 'Em Acompanhamento',
    description: 'Acompanhamento técnico presencial e fiscalização de conformidade para investidores imobiliários, auditando armações, ensaios de slump test, cura de concreto e medições de empreiteiros.',
    challenge: 'Garantir que a construtora contratada estivesse executando rigorosamente o cobrimento mínimo de armadura e o traço de concreto especificados em projeto.',
    solution: 'Inspeções diárias com checklists digitais, ensaios de rompimento de corpos de prova aos 7, 14 e 28 dias e relatórios fotográficos semanais para os contratantes.',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80'
    ],
    highlights: ['Controle de qualidade de 100% das concretagens', 'Auditoria de medições físicas para liberação de aportes', 'Relatórios fotográficos semanais detalhados'],
    servicesExecuted: [
      'Fiscalização de Execução Estrutural (NBR 14931)',
      'Ensaios Tecnológicos de Controle de Concreto',
      'Diário de Obra e Auditoria de Medições',
      'Emissão de ART de Fiscalização Técnica'
    ],
    hasVideo: true,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoTitle: 'Registro de Inspeção e Auditoria de Concretagem em Canteiro'
  },
  {
    id: 'laudo-pericial-ponte-patologias',
    title: 'Laudo Pericial de Estabilidade Estrutural',
    category: 'laudos',
    categoryLabel: 'Laudos Técnicos',
    location: 'Ji-Paraná - RO',
    year: '2024',
    area: 'Extensão de 420m',
    status: 'Laudo Emitido',
    description: 'Diagnóstico patológico e pericial não-destrutivo para verificação de integridade estrutural em viaduto de transbordo e passagem de carga pesada com corrosão de armadura.',
    challenge: 'Identificar a profundidade de corrosão interna e despassivação das armaduras sem danificar a estrutura viária em plena operação.',
    solution: 'Combinação de ultrassom de pulso ultrassônico, esclerometria de superfície e pacometria magnética para delimitar áreas de reforço estrutural com fibra de carbono.',
    imageUrl: 'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?auto=format&fit=crop&w=1200&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1517581177682-a085bb7ffb15?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b3?auto=format&fit=crop&w=1200&q=80'
    ],
    highlights: ['Diagnóstico com ensaios não-destrutivos', 'Mapeamento preciso de trincas e corrosão', 'Projeto de Reforço com Polímero de Carbono'],
    servicesExecuted: [
      'Inspeção Pericial Cautelar e Diagnóstica',
      'Ensaios de Esclerometria e Pacometria',
      'Laudo Técnico Pericial com Validade Jurídica',
      'Projeto de Recuperação e Reforço Estrutural'
    ],
    hasVideo: true,
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
    videoTitle: 'Apresentação em Vídeo do Diagnóstico Pericial e Esclerometria'
  }
];

import { DIFFERENTIALS_LIST } from './differentials';
export const DIFFERENTIALS_DATA: DifferentialItem[] = DIFFERENTIALS_LIST;

export const FAQ_DATA: FAQItem[] = [
  {
    id: '1',
    question: 'Por que o projeto estrutural é indispensável antes de iniciar a obra?',
    answer: 'O projeto estrutural garante que a edificação suportará todas as cargas atuantes com total segurança. Além disso, evita desperdício de materiais (aço e concreto), combate o superdimensionamento empírico e impede o surgimento de trincas, fissuras ou até colapsos futuros.',
    category: 'Projetos'
  },
  {
    id: '2',
    question: 'Qual a importância do Laudo Pericial de Vizinhança antes da escavação?',
    answer: 'O laudo cautelar de vizinhança registra formalmente o estado de conservação dos imóveis vizinhos antes do início das obras. Isso protege tanto o construtor contra reclamações indevidas quanto os vizinhos contra danos decorrentes de vibrações ou escavações.',
    category: 'Laudos'
  },
  {
    id: '3',
    question: 'O escritório atende em Ariquemes e outras regiões de Rondônia?',
    answer: 'Sim! Nosso escritório central fica sediado na Avenida dos Diamantes 2763, P.A.D. marechal Dutra em Ariquemes - RO, e atendemos Porto Velho, Ji-Paraná, Cacoal, Vilhena, Jaru e todas as cidades de Rondônia e região Norte. Além disso, possuímos visto de atuação técnica nacional no sistema CONFEA/CREA.',
    category: 'Institucional'
  },
  {
    id: '4',
    question: 'Como funciona o processo de contratação e entrega de um projeto?',
    answer: '1. Reunião de briefing e alinhamento do programa de necessidades;\n2. Estudo preliminar de concepção estrutural;\n3. Dimensionamento e cálculo detalhado;\n4. Compatibilização com arquitetura e instalações;\n5. Entrega de plantas detalhadas, memórias de cálculo e ART assinada.',
    category: 'Processos'
  }
];

