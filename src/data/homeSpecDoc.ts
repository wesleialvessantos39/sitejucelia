// /src/data/homeSpecDoc.ts

export interface SectionSpec {
  sectionNumber: string;
  sectionTitle: string;
  layoutDescription: string;
  visualElements: string[];
  copywritingTexts: { label: string; content: string }[];
  strategicRationale: string;
}

export const HERO_SECTION_SPEC: SectionSpec = {
  sectionNumber: '01',
  sectionTitle: 'Hero Section (Página Inicial e Primeiro Impacto)',
  layoutDescription: 'Layout assimétrico em 2 colunas principais no Desktop (60% conteúdo textual / 40% cartão visual de métricas e presença). Fundo escuro Obsidian (#0B0C0E) com gradiente radial sutil dourado (#C5A059 a 8% de opacidade). Espaçamento vertical generoso de 120px padding top/bottom. Alinhamento vertical centralizado.',
  visualElements: [
    'Badge Superior: "Engenharia Estrutural e Laudos Técnicos em Ariquemes - RO" com fundo vidro e borda dourada fina.',
    'Título Principal (H1): Tipografia Cinzel em tom Champagne Gold (#F4E0A5) com tracking ajustado e peso Bold.',
    'Subtítulo: Tipografia Plus Jakarta Sans 16px/24px em tom Slate Gray (#94A3B8) com limite de leitura a 65ch.',
    'Bloco de Ação (CTAs): Botão primário verde WhatsApp com brilho pulsante e botão secundário dourado para formulário.',
    'Cartão Flutuante Lateral: Exibição de indicador de autoridade (+120.000 m² projetados) com selo de visto CREA Ativo.'
  ],
  copywritingTexts: [
    { label: 'Título H1', content: 'Engenharia de Precisão para Projetos Complexos' },
    { label: 'Subtítulo Institucional', content: 'Cálculo estrutural avançado, gestão executiva de obras e laudos periciais de alta confiabilidade para os setores corporativo, agronegócio e residencial de alto padrão em Ariquemes e toda Rondônia.' },
    { label: 'CTA Primária', content: 'Falar com a Engenheira via WhatsApp' },
    { label: 'CTA Secundária', content: 'Solicitar Orçamento de Projeto' }
  ],
  strategicRationale: 'Captura o visitante nos primeiros 3 segundos, eliminando dúvidas sobre a área de atuação e autoridade técnica. O destaque do número CREA e o endereço em Ariquemes estabelecem credibilidade regional e segurança jurídica imediatas.'
};

export const HIGHLIGHTS_SECTION_SPEC: SectionSpec = {
  sectionNumber: '02',
  sectionTitle: 'Destaques Rápidos de Autoridade',
  layoutDescription: 'Faixa horizontal integrada ao término do Hero com 4 cartões de indicadores numéricos em grid de 4 colunas no desktop, 2 colunas no tablet e 1 coluna no mobile. Fundo #121316 com divisórias sutis em branco/5%.',
  visualElements: [
    'Cartão 1: +120.000 m² — Obras Projetadas & Geridas.',
    'Cartão 2: +85 Obras — Monitoradas com Sucesso.',
    'Cartão 3: 100% Compliance — Rigor ABNT e NBR.',
    'Cartão 4: CREA-RO — Registro Profissional Ativo.'
  ],
  copywritingTexts: [
    { label: 'Indicador 1', content: '+120.000 m² de Obras Projetadas' },
    { label: 'Indicador 2', content: '+85 Obras e Laudos Concluídos' },
    { label: 'Indicador 3', content: '100% de Cumprimento das Normas NBR/ABNT' },
    { label: 'Indicador 4', content: 'Atendimento Direto por Engenheira Sênior' }
  ],
  strategicRationale: 'Fornece prova matemática instantânea. Decisores e investidores respondem rapidamente a dados quantitativos antes de lerem conteúdos conceituais longos.'
};

export const ABOUT_SECTION_SPEC: SectionSpec = {
  sectionNumber: '03',
  sectionTitle: 'Sobre a Engenheira & Filosofia do Escritório',
  layoutDescription: 'Layout em 2 colunas de proporção 45%/55%. À esquerda, retrato institucional da Engª Jucélia Santana em alta resolução com moldura de borda dourada dupla e badge de visto CREA. À direita, narrativa institucional estruturada em 3 blocos: Trajetória, Rigor Técnico e Pilares Operacionais.',
  visualElements: [
    'Fotografia institucional em iluminação de estúdio com vestuário executivo/equipamento de proteção.',
    'Assinatura estilizada em tom dourado e título "Engenheira Civil Responsável Técnico".',
    'Grid de 4 Pilares: Compliance ABNT, Modelagem 3D & Detalhamento, Engenharia Econômica e Responsabilidade Técnica Total.',
    'Selo em relevo com o lema "Segurança que Permanece por Gerações".'
  ],
  copywritingTexts: [
    { label: 'Subtítulo de Seção', content: 'Liderança Técnica & Excelência Executiva' },
    { label: 'Título H2', content: 'Engenharia Civil com Foco em Precisão, Rigor e Transparência' },
    { label: 'Texto Institucional', content: 'Liderado pela Engª Jucélia Santana, nosso escritório atua na interseção entre a alta tecnologia de modelagem computacional e a prática rigorosa de canteiro de obras. Especializados em cálculo de estruturas de concreto armado, protendido, estruturas metálicas e laudos periciais em Ariquemes e estado de Rondônia.' }
  ],
  strategicRationale: 'Humaniza a marca sem perder o tom corporativo de alta reputação. Em contratações de engenharia, os clientes contratam a responsabilidade técnica da pessoa física por trás da empresa.'
};

export const SERVICES_SECTION_SPEC: SectionSpec = {
  sectionNumber: '04',
  sectionTitle: 'Grid de Serviços Especializados & Modais Técnicos',
  layoutDescription: 'Apresentação interativa com barra de navegação por abas horizontais (Estrutural, Laudos & Perícias, Agronegócio, Gestão de Obras, Consultoria) e grid responsivo de 3 colunas para os serviços da categoria ativa.',
  visualElements: [
    'Ícones vetorizados minimalistas Lucide (Layers, FileCheck, Building2, HardHat, Compass) em tom Dourado #C5A059.',
    'Cards com efeito glassmorphism escuro (#121316), borda sutil e brilho dourado ao passar o ponteiro (hover).',
    'Badge explicativa informando as normas ABNT/NBR aplicadas a cada serviço.',
    'Botão "Especificações Técnicas" em cada card para disparar modal interativo com lista de entregáveis e botão de orçamento.'
  ],
  copywritingTexts: [
    { label: 'Título H2', content: 'Soluções de Engenharia para Demandas de Alta Complexidade' },
    { label: 'Serviço 1', content: 'Projetos Estruturais & Cálculo Avancado (NBR 6118 / NBR 8800)' },
    { label: 'Serviço 2', content: 'Laudos Periciais & Vistorias Cautelares (NBR 13752)' },
    { label: 'Serviço 3', content: 'Engenharia para o Agronegócio (Silos, Barracões & Pontes Rurais)' }
  ],
  strategicRationale: 'A organização por abas reduz a sobrecarga cognitiva do usuário, permitindo que cada perfil de cliente (ex: fazendeiro ou investidor imobiliário) encontre seu serviço de interesse em menos de 2 cliques.'
};

export const PROJECTS_SECTION_SPEC: SectionSpec = {
  sectionNumber: '05',
  sectionTitle: 'Galeria Interativa de Projetos & Obras de Referência',
  layoutDescription: 'Galeria dinâmica com barra de filtros (Todos, Residencial, Agronegócio, Corporativo, Laudos) e grid de 3 colunas com imagens proporção 16:9 de alto impacto e efeito de revelação visual no hover.',
  visualElements: [
    'Cards visuais com degradê de proteção escuro na base para legibilidade das informações.',
    'Tags flutuantes: Categoria, Metragem Quadrada e Cidade/UF (Ariquemes - RO, Porto Velho - RO, etc.).',
    'Efeito Hover: Transição de escala suave na imagem (scale 1.05) e contorno dourado na moldura.',
    'Modal Raio-X do Projeto: Exibe especificações completas de cálculo, volume de concreto, consumo de aço, normas e galeria ampliada.'
  ],
  copywritingTexts: [
    { label: 'Título H2', content: 'Portfólio de Obras & Soluções Executadas' },
    { label: 'Callout de Galeria', content: 'Clique sobre qualquer projeto para abrir a ficha técnica executiva com especificações estruturais.' }
  ],
  strategicRationale: 'Projeta tangibilidade física. A engenharia civil é validada pela estética e solidez das obras concluídas.'
};

export const DIFFERENTIALS_SECTION_SPEC: SectionSpec = {
  sectionNumber: '06',
  sectionTitle: 'Matriz de Diferenciais Competitivos (Watermark Cards)',
  layoutDescription: 'Grid 2x2 com 4 cartões expansivos de grande formato. Cada cartão exibe um número gigante de água (01, 02, 03, 04) ao fundo em tom Champagne Dourado com 10% de opacidade.',
  visualElements: [
    'Marca d’água numérica 01 a 04 com tipografia Cinzel Display em tamanho 72px.',
    'Ícones decorativos no topo de cada card (Modelagem 3D, Calculadora Econômica, Selo de Garantia ART, Escudo de Compliance).',
    'Selo centralizado de rodapé da seção: "Padrão Ouro de Engenharia Civil e Responsabilidade Técnica".'
  ],
  copywritingTexts: [
    { label: 'Diferencial 01', content: 'Compatibilização 100% em Ambiente 3D Detalhado' },
    { label: 'Diferencial 02', content: 'Engenharia Econômica com Otimização de Fôrmas e Armaduras' },
    { label: 'Diferencial 03', content: 'Emissão Garantida de ART com Visto CREA-RO' },
    { label: 'Diferencial 04', content: 'Atendimento Direto pela Engenheira Responsável sem Intermediários' }
  ],
  strategicRationale: 'Posiciona o escritório acima da concorrência local genérica, destacando tecnologia avançada e suporte executivo exclusivo.'
};

export const CTA_SECTION_SPEC: SectionSpec = {
  sectionNumber: '07',
  sectionTitle: 'Chamada para Ação Estratégica & Conversão',
  layoutDescription: 'Bloco de destaque em largura total com bordas arredondadas e fundo Dark Obsidian enriquecido com textura geométrica sutil e moldura interna em tom Dourado #C5A059. Alinhamento centralizado.',
  visualElements: [
    'Ícone de destaque no topo: Escudo de Segurança Estrutural com iluminação dourada.',
    'Título com tipografia Cinzel 32px com efeito gradiente metálico dourado.',
    'Botões de Ação Dupla: Verde WhatsApp com indicador "Resposta em até 2 horas" e Dourado "Preencher Formulário".'
  ],
  copywritingTexts: [
    { label: 'Título da CTA', content: 'Pronto para Elevar o Padrão de Segurança e Precisão da sua Obra?' },
    { label: 'Subtexto Persuasivo', content: 'Agende uma consulta técnica diretamente com a Engª Jucélia Santana e receba uma análise preliminar de viabilidade e custos para seu projeto em Ariquemes e região.' },
    { label: 'Botão Verde', content: 'Falar com a Engenheira no WhatsApp Direct' },
    { label: 'Botão Secundário', content: 'Solicitar Orçamento sem Compromisso' }
  ],
  strategicRationale: 'Reúne os usuários que navegaram por todo o site no momento máximo de convencimento para conversão direta sem atritos.'
};

export const CONTACT_SECTION_SPEC: SectionSpec = {
  sectionNumber: '08',
  sectionTitle: 'Central de Contato, Localização & Formulário',
  layoutDescription: 'Layout em 2 colunas (40% informações de contato e localização em Ariquemes / 60% formulário de proposta técnica com 6 campos organizados).',
  visualElements: [
    'Coluna Esquerda: Cards com ícones para Endereço Físico (Av. Tancredo Neves - Ariquemes RO), Telefone/WhatsApp (+55 69 9208-6883), E-mail corporativo e Horário de Atendimento.',
    'Coluna Direita: Formulário limpo com campos (Nome, Telefone/WhatsApp, E-mail, Cidade/UF, Tipo de Serviço, Descrição da Obra).',
    'Botão de Submissão com estado de carregamento visual e opção secundária "Enviar Também via WhatsApp Direct".'
  ],
  copywritingTexts: [
    { label: 'Título H2', content: 'Entre em Contato com Nosso Escritório' },
    { label: 'Endereço', content: 'Av. Tancredo Neves, 1850 - Setor das Áreas Especiais, Ariquemes - RO, 76872-840' },
    { label: 'Telefone Real', content: '+55 (69) 9208-6883' }
  ],
  strategicRationale: 'Atende tanto quem prefere preencher um formulário corporativo detalhado com envio de anexos quanto quem necessita de contato imediato pelo WhatsApp.'
};

export const FOOTER_SPEC: SectionSpec = {
  sectionNumber: '09',
  sectionTitle: 'Rodapé Institucional & Compliance Legal',
  layoutDescription: 'Rodapé dividido em 4 colunas com fundo escuro absoluto, topo com linha divisória dourada de 1px e seção inferior com direitos autorais e atalho para o topo.',
  visualElements: [
    'Coluna 1: Logo com monograma JS e resumo da atuação profissional.',
    'Coluna 2: Links Rápidos de navegação interna.',
    'Coluna 3: Relação de Serviços Principais.',
    'Coluna 4: Informações de CREA-RO, Endereço de Ariquemes e Horário.',
    'Rodapé Inferior: Direitos autorais, Termos de Uso, Política de Privacidade e Botão "Voltar ao Topo".'
  ],
  copywritingTexts: [
    { label: 'Copyright', content: '© 2026 Jucélia Santana Engenharia Civil. Todos os direitos reservados. CREA: 22430D/RO.' }
  ],
  strategicRationale: 'Proporciona encerramento elegante e atende a todos os requisitos de transparência legal e corporativa.'
};

export const MICROINTERACTIONS_SPEC = {
  hoverEffects: 'Botões e cards possuem elevação sutil (translateY -4px) com transição de 300ms cubic-bezier, bordas douradas ativando glow e imagens de projetos aplicando zoom suave de 1.05.',
  scrollBehavior: 'Navbar fixa transiciona de transparente para escuro com efeito de desfoque fosco (backdrop-blur-md) ao rolar 20px. Botão de retorno ao topo surge suavemente após 400px de scroll.',
  fadeAnimations: 'Entrada das seções e cards utiliza Framer Motion com fade-in progressivo (opacity 0 -> 1, y 20px -> 0px) ativado via IntersectionObserver quando atinge 20% da tela.',
  visualFeedback: 'Formulário exibe animação de spinner dourado ao enviar e mensagem de confirmação em caixa verde/dourada com ícone de verificação.'
};

export const RESPONSIVENESS_SPEC = {
  desktop: '1280px ou mais: Layout completo com grids de 3 a 4 colunas, menus estendidos e elementos visuais de apoio laterais.',
  notebook: '1024px a 1279px: Ajuste de padding de 120px para 80px, mantendo integridade estrutural das 3 colunas.',
  tablet: '768px a 1023px: Grids adaptam-se para 2 colunas, botão de WhatsApp mantido flutuante no canto inferior direito, menu transforma-se em gaveta lateral.',
  mobile: '375px a 767px: Layout de 1 coluna em todas as seções, botões em largura total (w-full), texto ajustado para máxima legibilidade sem hifenização forçada.'
};
