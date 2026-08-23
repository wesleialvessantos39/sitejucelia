// /src/data/architectureDoc.ts

export const ARCHITECTURE_SPEC = {
  title: 'Arquitetura de Software & Plano Técnico',
  company: 'Jucélia Santana Engenharia Civil',
  version: '1.0.0 (Production-Ready)',
  
  stack: [
    { name: 'React 19', role: 'Engine de Interface Declarativa e Componentizada' },
    { name: 'TypeScript 5.8', role: 'Tipagem Estática Estrita e Segurança de Código' },
    { name: 'Tailwind CSS v4', role: 'Estilização Utilitária de Alto Desempenho e Design Tokens' },
    { name: 'Framer Motion', role: 'Animações Físicas, Transições Suaves e Gestão de Presença' },
    { name: 'Lucide Icons', role: 'Simbologia Vetorial Padronizada e Leve' },
    { name: 'Vite 6', role: 'Bundler de Altíssima Velocidade e Otimização de Assets' }
  ],

  folders: [
    { path: 'src/', description: 'Diretório raiz do código fonte da aplicação' },
    { path: 'src/components/layout/', description: 'Componentes estruturais globais (Navbar, Footer, Modals)' },
    { path: 'src/components/sections/', description: 'Seções institucionais modulares (Hero, Sobre, Serviços, Projetos, Diferenciais, FAQ, Contato)' },
    { path: 'src/components/ui/', description: 'Componentes atômicos reutilizáveis (Button, Card, Badge, Modal, FormInput)' },
    { path: 'src/components/docs/', description: 'Visualizador interativo da Arquitetura e do Design System' },
    { path: 'src/data/', description: 'Data sources estáticos desacoplados e estruturados (Serviços, Projetos, FAQ, Specs)' },
    { path: 'src/types/', description: 'Definições de interfaces TypeScript e contratos de dados' },
    { path: 'src/utils/', description: 'Helpers utilitários, validadores de formulário e formatadores' }
  ],

  dataFlow: [
    '1. Data Providers: Módulos em /src/data fornecem dados imutáveis e fortemente tipados.',
    '2. Central State: React Hooks gerenciam filtros de portfólio, modais de detalhes e envios de formulário.',
    '3. Render Pipeline: Framer Motion aplica efeitos de entrada à medida que os elementos entram no viewport (Viewport-Triggered Animate).',
    '4. Feedback Loop: Formulário de contato valida dados em tempo real e fornece feedback instantâneo de sucesso ou erro.'
  ],

  seoStrategy: [
    'Semantic HTML5: Uso rigoroso de <header>, <main>, <section>, <article>, <nav> e <footer>.',
    'Open Graph Protocol: Card social completo para WhatsApp, LinkedIn e redes corporativas.',
    'Heading Hierarchy: H1 único por página/seção principal, seguindo progressão sequencial estrita (H1 -> H2 -> H3).',
    'Meta Tags Estruturadas: Descrição focada na palavra-chave principal (Engenharia Civil, Projetos Estruturais, Laudos, Ariquemes, Rondônia).',
    'Image Alt Texts: Descrição técnica detalhada em cada imagem de obra e serviço para leitores de tela e indexadores.'
  ],

  performanceStrategy: [
    'Code Splitting & Lazy Loading: Componentes mais pesados e modais carregados sob demanda.',
    'Image Optimization: Uso de Unsplash CDN com parâmetros de compressão (&q=80, &w=1200, &auto=format).',
    'Zero Layout Shift (CLS): Dimensões explícitas reservadas para banners e imagens de portfólio.',
    'GPU Acceleration: Animações limitadas às propriedades `opacity` e `transform` (will-change: transform).'
  ],

  responsivenessStrategy: [
    'Mobile First Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px).',
    'Fluid Grid System: Reorganização automática de cards de 1 coluna (Mobile) para 2 colunas (Tablet) e 3 colunas (Desktop).',
    'Touch Target Standards: Todos os botões e links possuem área de toque mínima de 44x44px em dispositivos móveis.'
  ]
};
