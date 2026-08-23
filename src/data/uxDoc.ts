// /src/data/uxDoc.ts

export interface TargetAudienceProfile {
  profile: string;
  seeks: string;
  fearsAndDoubts: string[];
  trustDrivers: string[];
  conversionTriggers: string;
}

export const TARGET_AUDIENCE_PROFILES: TargetAudienceProfile[] = [
  {
    profile: 'Empresas e Corporativo',
    seeks: 'Instalações administrativas, ampliações comerciais, laudos técnicos estruturais e adequação a normas vigentes.',
    fearsAndDoubts: [
      'A obra vai parar a operação comercial?',
      'O orçamento respeitará as premissas econômicas do plano de negócios?',
      'Haverá garantia legal de Responsabilidade Técnica (ART)?'
    ],
    trustDrivers: [
      'Anotação de Responsabilidade Técnica (ART/CREA) registrada.',
      'Apresentação de cronograma físico-financeiro detalhado.',
      'Apresentação de portfólio corporativo com prazos rígidos cumpridos.'
    ],
    conversionTriggers: 'Atendimento direto com engenheira sênior e proposta técnica sem margem de incerteza.'
  },
  {
    profile: 'Construtoras',
    seeks: 'Projetos estruturais executivos detalhados em 3D, compatibilização de disciplinas e otimização de consumo de aço/concreto.',
    fearsAndDoubts: [
      'O projeto entregará compatibilização real sem choques no canteiro?',
      'Qual a taxa de consumo de aço por m³ de concreto utilizada nas premissas?',
      'As revisões serão ágeis durante a fase executiva?'
    ],
    trustDrivers: [
      'Detecção automatizada de interferências entre disciplinas.',
      'Engenharia econômica com redução de desperdício em fôrmas e armaduras.',
      'Comunicação direta via engenheira responsável sem intermediários.'
    ],
    conversionTriggers: 'Demonstração de economia comprovada na taxa de armadura e precisão do modelo 3D.'
  },
  {
    profile: 'Indústrias',
    seeks: 'Projetos de galpões industriais, pisos de alta capacidade de carga, bases de máquinas pesadas, pontes rolantes e reforço estrutural.',
    fearsAndDoubts: [
      'A estrutura suportará as vibrações das máquinas e pontes rolantes?',
      'Qual a resistência do piso industrial a impactos e cargas concentradas?',
      'Como garantir a segurança operacional conforme NBR 6118 e NBR 8800?'
    ],
    trustDrivers: [
      'Memória de cálculo estrutural detalhada com simulação computacional.',
      'Experiência comprovada em galpões de grande vão livre e estruturas mistas.',
      'Rigidez nos ensaios e laudos cautelares de estabilidade.'
    ],
    conversionTriggers: 'Segurança absoluta para operação pesada continuada e agilidade no laudo de liberação.'
  },
  {
    profile: 'Agronegócio',
    seeks: 'Infraestrutura para silos graneleiros, armazéns de insumos, bases para caixas d\'água de grande porte e contenções de solo.',
    fearsAndDoubts: [
      'A estrutura suportará as forças horizontais dos grãos estocados?',
      'Como proteger a estrutura contra agressividade química de fertilizantes e dejetos?',
      'A entrega respeitará a janela crítica da safra agrícola?'
    ],
    trustDrivers: [
      'Conhecimento profundo das normas de cálculo para estruturas de armazenamento agrícola.',
      'Dimensionamento de concreto de alta durabilidade e baixo atrito.',
      'Presença e acompanhamento técnico nas regiões produtoras.'
    ],
    conversionTriggers: 'Disponibilidade para atendimento rápido pré-safra e garantia de capacidade de carga máxima.'
  },
  {
    profile: 'Proprietários Rurais',
    seeks: 'Pontes rurais para passagem de maquinário pesado, currais em concreto, barracões rurais e pavimentação de vias internas.',
    fearsAndDoubts: [
      'O custo compensa em relação às soluções improvisadas em madeira?',
      'A ponte suportará carretas bi-trem e colheitadeiras carregadas?',
      'É possível executar a obra sem interromper o escoamento diário?'
    ],
    trustDrivers: [
      'Análise de viabilidade técnica e custo de vida útil estendido.',
      'Uso de pré-moldados e soluções de rápida montagem no campo.',
      'Suporte completo desde a Sondagem SPT até o habite-se rural.'
    ],
    conversionTriggers: 'Garantia de durabilidade por décadas com zero manutenção corretiva.'
  },
  {
    profile: 'Clientes Particulares (Residencial Alto Padrão)',
    seeks: 'Projetos estruturais para residências de luxo com grandes vãos livres, balanços arrojados, piscinas suspensas e lajes protendidas.',
    fearsAndDoubts: [
      'O projeto estrutural vai interferir ou estragar a estética da arquitetura?',
      'Surgirão trincas, fissuras ou deformações nas esquadrias com o tempo?',
      'O custo de aço e concreto vai estourar meu orçamento residencial?'
    ],
    trustDrivers: [
      'Total sintonia com os escritórios de arquitetura autoral.',
      'Modelagem 3D interativa possibilitando visualização exata da estrutura.',
      'Histórico de obras entregues sem manifestações patológicas.'
    ],
    conversionTriggers: 'Viabilização de conceitos arquitetônicos audaciosos com total segurança estrutural.'
  },
  {
    profile: 'Investidores Imobiliários',
    seeks: 'Viabilidade estrutural para loteamentos, edifícios residenciais/comerciais, inspeções pré-aquisição e laudos periciais.',
    fearsAndDoubts: [
      'Qual o risco oculto dessa estrutura existente que estou adquirindo?',
      'O projeto otimiza a taxa de ocupação e aproveitamento de vaga de garagem?',
      'A documentação está 100% em conformidade com as exigências dos bancos e cartórios?'
    ],
    trustDrivers: [
      'Análise de Perícia e Laudos Cautelares de Vizinhança conforme NBR 13752.',
      'Modelagem de viabilidade financeira x consumo de materiais por m².',
      'Agilidade e rigor técnico que reduzem o risco do aporte de capital.'
    ],
    conversionTriggers: 'Redução de risco financeiro e valorização imediata do ativo imobiliário.'
  }
];

export const USER_JOURNEY_STAGES = [
  {
    stage: '1. Primeiro Impacto (Hero Section)',
    objective: 'Capturar atenção imediata, transmitir autoridade executiva e comunicar o posicionamento de alta engenharia.',
    keyElements: 'Headline de impacto com tipografia Cinzel, registro CREA em destaque, distintivo de engenharia estrutural e botão WhatsApp Direct.'
  },
  {
    stage: '2. Descoberta e Autoridade (Sobre a Engenheira)',
    objective: 'Construir conexão humana, apresentar as credenciais da Engª Jucélia Santana e reforçar o rigor ético e técnico.',
    keyElements: 'Foto institucional de alta qualidade, registro CREA, pilares operacionais (Compliance ABNT, Engenharia Econômica, Modelagem 3D).'
  },
  {
    stage: '3. Demonstração de Soluções (Serviços Especializados)',
    objective: 'Apresentar a gama completa de serviços categorizados com clareza funcional para cada tipo de cliente.',
    keyElements: 'Abas por setor (Estrutural, Laudos, Agronegócio, Gestão, Consultoria), cards detalhados com normas NBR e modal de proposta.'
  },
  {
    stage: '4. Prova de Capacidade Técnica (Portfólio de Obras)',
    objective: 'Tangibilizar os resultados com imagens de obras reais, dados executivos e especificações de metragem.',
    keyElements: 'Filtros dinâmicos por segmento (Residencial, Agronegócio, Corporativo), tags de materiais (Concreto Protendido, Estrutura Mista) e modais de detalhes.'
  },
  {
    stage: '5. Diferenciais Competitivos (Por que Escolher)',
    objective: 'Eliminar qualquer dúvida comparativa destacando os 4 pilares únicos da Jucélia Santana Engenharia.',
    keyElements: 'Cards com marcas d\'água numéricas (01 a 04), ícones refinados e selo de Padrão Ouro de Engenharia.'
  },
  {
    stage: '6. Eliminação de Objeções (Perguntas Frequentes / FAQ)',
    objective: 'Sanar as dúvidas mais recorrentes sobre prazos, laudos, custos e acompanhamento de obras.',
    keyElements: 'Accordion interativo categorizado e atalho direto para esclarecimento de dúvidas no WhatsApp.'
  },
  {
    stage: '7. Chamada para Ação e Conversão (Formulário e WhatsApp)',
    objective: 'Proporcionar uma experiência de conversão imediata e sem fricção.',
    keyElements: 'Formulário limpo com seleção de serviço, opção de envio de arquivo e botão WhatsApp de atendimento imediato.'
  },
  {
    stage: '8. Posicionamento de Rodapé (Footer Institucional)',
    objective: 'Garantir transparência legal, navegação rápida secundária e dados de contato corporativo completos.',
    keyElements: 'Informações de CREA, endereço físico, links rápidos, horário de atendimento e atalho de topo de página.'
  }
];

export const WIREFRAME_SECTION_SPECS = [
  {
    section: '1. Header e Navbar Flutuante',
    elements: 'Monograma JS + Logo completo em Dourado, links para seções (Home, Sobre, Serviços, Projetos, Diferenciais, FAQ, Contato), botão "Docs e Specs" e CTA "Solicitar Orçamento".',
    uxPurpose: 'Acesso instantâneo à conversão em qualquer ponto do scroll com efeito glassmorphism fosco.'
  },
  {
    section: '2. Hero Section Principal',
    elements: 'Badge "Engenharia Estrutural e Laudos Técnicos", Título H1 "Engenharia de Precisão para Projetos Complexos", subtexto estratégico, botões CTA (WhatsApp + Formulário) e painel lateral de métricas (+120k m²).',
    uxPurpose: 'Manter a taxa de rejeição abaixo de 20%, afirmando valor e prestígio em menos de 3 segundos.'
  },
  {
    section: '3. Painel de Indicadores de Impacto',
    elements: 'Barra horizontal com 4 métricas chave: Metragem Calculada, Obras Monitoradas, Laudos Emitidos e Índice de Satisfação.',
    uxPurpose: 'Prova numérica imediata antes de aprofundar na leitura dos serviços.'
  },
  {
    section: '4. Perfil Institucional da Engenheira',
    elements: 'Layout em duas colunas: esquerda com fotografia profissional e selo de CREA Ativo; direita com trajetória da Engª Jucélia Santana e grid com os 4 Pilares de Excelência.',
    uxPurpose: 'Humanizar a engenharia e transmitir segurança no nome por trás da responsabilidade técnica.'
  },
  {
    section: '5. Grid de Serviços Especializados (Filtros por Aba)',
    elements: 'Navegador por abas (Estruturas, Laudos e Perícias, Agronegócio, Gestão de Obras, Consultoria) e cards com botão "Especificações Técnicas" que abrem modal explicativo.',
    uxPurpose: 'Permitir que cada persona (ex: fazendeiro ou construtor) encontre exatamente seu foco em 1 clique.'
  },
  {
    section: '6. Galeria Interativa de Projetos Executados',
    elements: 'Cards visuais de alta definição com efeito hover, tags de localização/metragem, filtros por categoria e modal de raio-x do projeto.',
    uxPurpose: 'Comprovar execução prática e alto nível estético/estrutural.'
  },
  {
    section: '7. Matriz de Diferenciais Competitivos',
    elements: 'Grid de 4 cartões de grande formato com numeração 01-04 em marca d\'água dourada, enfatizando Tecnologia 3D, Economia Inteligente, Laudos Periciais e Responsabilidade Técnica.',
    uxPurpose: 'Destacar a proposta única de valor (UVP) perante concorrentes tradicionais.'
  },
  {
    section: '8. Central de Dúvidas / Accordion FAQ',
    elements: 'Lista sanfonada expansível para 6 perguntas críticas sobre ART, prazos, visitas técnicas e compatibilização.',
    uxPurpose: 'Reduzir o tempo de tomada de decisão eliminando incertezas operacionais.'
  },
  {
    section: '9. Seção de Conversão / Formulário de Proposta',
    elements: 'Bloco escuro de alto contraste com formulário de 2 colunas (Nome, E-mail, Telefone, Tipo de Serviço, Descrição da Obra) e botão verde WhatsApp com mensagem pré-formatada.',
    uxPurpose: 'Capturar o lead no pico da intenção com opções para quem prefere formulário ou mensagem direta.'
  },
  {
    section: '10. Rodapé Institucional',
    elements: 'Logo, síntese da empresa, número de registro CREA, dados de contato, horário de atendimento, links institucionais e direitos autorais.',
    uxPurpose: 'Conclusão elegante que reforça compliance legal e seriedade empresarial.'
  }
];

export const NAVIGATION_SPECS = {
  desktopMenu: ['Início', 'Sobre', 'Serviços', 'Projetos', 'Diferenciais', 'FAQ', 'Contato'],
  fixedHeaderBehavior: 'Navbar fixa com background escuro semi-transparente (backdrop-blur-md) ativada imediatamente ao rolar 20px.',
  scrollBehavior: 'Scroll suave (smooth scroll) habilitado globalmente para navegação por ancoragem entre seções.',
  mobileMenu: 'Drawer lateral com transição fluida, fechamento automático ao clicar em link e botão CTA em largura total.',
  floatingWhatsApp: 'Botão flutuante fixo no canto inferior direito com pulso luminoso, indicador de status online e tooltip explicativo.',
  backToTop: 'Botão discreto no canto inferior esquerdo que surge após 400px de rolagem para retorno instantâneo ao topo.'
};

export const CTA_STRATEGY = [
  {
    location: 'Hero Section',
    label: 'Falar com a Engenheira via WhatsApp',
    text: 'Solicite uma Análise Técnica Preliminar com Resposta Rápida',
    rationale: 'Capta os usuários de alta intenção que desejam contato imediato sem preencher formulários.'
  },
  {
    location: 'Sessão de Serviços (Modal & Card)',
    label: 'Solicitar Proposta de Projeto',
    text: 'Receba um Orçamento Customizado para a sua Obra',
    rationale: 'Oferece um ponto de contato contextualizado no momento exato em que o cliente analisa um serviço específico.'
  },
  {
    location: 'Diferenciais Competitivos',
    label: 'Agendar Reunião Técnica',
    text: 'Discuta a Viabilidade do seu Projeto com nossa Equipe Sênior',
    rationale: 'Converte decisores corporativos e investidores que exigem validação prévia de capacidade técnica.'
  },
  {
    location: 'Formulário Final',
    label: 'Enviar Mensagem & Iniciar Atendimento',
    text: 'Proposta detalhada entregue em até 24 horas úteis',
    rationale: 'Define expectativas claras de prazo de resposta, aumentando a taxa de envio do formulário.'
  }
];

export const ACCESSIBILITY_AND_SEO = {
  seoRules: [
    'Marcação estruturada Schema.org (LocalBusiness & ProfessionalService) com dados de CREA e localização.',
    'Hierarquia rigorosa de títulos H1 (único na Hero), H2 (títulos das seções principais) e H3 (subtítulos e cards).',
    'Atributos alt descritivos em 100% das imagens focados em engenharia civil, projetos estruturais e laudos.',
    'URLs amigáveis com âncoras internas limpas (#sobre, #servicos, #projetos, #contato).'
  ],
  wcagRules: [
    'Contraste de cores testado e approved com taxa superior a 4.5:1 em textos normais e 3:1 em textos grandes.',
    'Navegação completa por teclado com indicadores de foco visíveis (focus-ring dourado).',
    'Atributos ARIA (aria-expanded, aria-controls, aria-label) aplicados a modais, menus móveis e accordions.',
    'Textos com dimensionamento dinâmico relativo (rem/em) respeitando as preferências de zoom do navegador.'
  ]
};

