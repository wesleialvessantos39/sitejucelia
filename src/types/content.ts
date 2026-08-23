// /src/types/content.ts

export interface HeroContent {
  badgeText: string;
  locationBadge: string;
  title: string;
  titleHighlight: string;
  description: string;
  primaryCta: string;
  secondaryCta: string;
  whatsappNotice: string;
}

export interface AboutContent {
  badgeText: string;
  title: string;
  highlightTitle: string;
  subtitle: string;
  bioParagraph1: string;
  bioParagraph2: string;
  ctaText: string;
}

export interface ServicesContent {
  badgeText: string;
  title: string;
  highlightTitle: string;
  subtitle: string;
}

export interface ProjectsContent {
  badgeText: string;
  title: string;
  highlightTitle: string;
  subtitle: string;
}

export interface DifferentialsContent {
  badgeText: string;
  title: string;
  highlightTitle: string;
  subtitle: string;
}

export interface ProcessContent {
  badgeText: string;
  title: string;
  highlightTitle: string;
  subtitle: string;
}

export interface FaqItemContent {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  active: boolean;
  updated_at?: string;
}

export interface FaqContent {
  badgeText: string;
  title: string;
  highlightTitle: string;
  subtitle: string;
  items: FaqItemContent[];
}

export interface CtaContent {
  badgeText: string;
  title: string;
  highlightTitle: string;
  subtitle: string;
  buttonText: string;
}

export interface ContactContent {
  badgeText: string;
  title: string;
  highlightTitle: string;
  subtitle: string;
  formTitle: string;
  formSubtitle: string;
}

export interface FooterContent {
  shortDescription: string;
  creaBadge: string;
  normasText: string;
  copyrightText: string;
}

export interface SiteContentSettings {
  hero: HeroContent;
  about: AboutContent;
  services: ServicesContent;
  projects: ProjectsContent;
  differentials: DifferentialsContent;
  process: ProcessContent;
  faq: FaqContent;
  cta: CtaContent;
  contact: ContactContent;
  footer: FooterContent;
}
