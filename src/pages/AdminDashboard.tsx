import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Image as ImageIcon,
  Ticket,
  ShieldCheck,
  PlusCircle,
  Building2,
  ExternalLink,
  Users,
  UserCog,
  MessageSquare,
  RefreshCw,
  BookOpen,
  Palette,
  Sliders,
  UserCheck,
  FileText,
  FileCheck,
  HelpCircle,
  Calculator,
  PhoneCall,
  Globe,
  BarChart3,
  Activity,
  Eye,
  TrendingUp,
} from 'lucide-react';
import { supabaseDatabase } from '../services/supabaseDatabase';
import { supabaseUsers } from '../services/supabaseUsers';
import { getDashboardQuickMetrics } from '../services/siteAnalyticsService';
import { useAuth } from '../context/AuthContext';

export default function AdminDashboard() {
  const { profile, user } = useAuth();
  const [projectsCount, setProjectsCount] = useState<number>(0);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [messagesCount, setMessagesCount] = useState<number>(0);
  const [blogCount, setBlogCount] = useState<number>(0);
  const [docsCount, setDocsCount] = useState<number>(0);
  const [proposalsCount, setProposalsCount] = useState<number>(0);
  const [domainsCount, setDomainsCount] = useState<number>(0);
  const [analyticsMetrics, setAnalyticsMetrics] = useState<{
    today: number;
    last7Days: number;
    last30Days: number;
    topPage: string;
  }>({ today: 0, last7Days: 0, last30Days: 0, topPage: 'Página Inicial' });
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadMetrics() {
      setLoading(true);
      try {
        const [projects, users, messages, posts, docs, proposals, domains, quickAnalytics] = await Promise.all([
          supabaseDatabase.getProjects(false),
          supabaseUsers.getAllProfiles(),
          supabaseDatabase.getContactMessages().catch(() => []),
          supabaseDatabase.getBlogPosts(false, false),
          supabaseDatabase.getTechnicalDocuments().catch(() => []),
          supabaseDatabase.getProposalRequests().catch(() => []),
          supabaseDatabase.getSiteDomains().catch(() => []),
          getDashboardQuickMetrics().catch(() => ({ today: 0, last7Days: 0, last30Days: 0, topPage: 'Página Inicial' })),
        ]);

        if (projects) setProjectsCount(projects.length);
        if (users) setUsersCount(users.length);
        if (messages) setMessagesCount(messages.length);
        if (posts) setBlogCount(posts.length);
        if (docs) setDocsCount(docs.length);
        if (proposals) setProposalsCount(proposals.length);
        if (domains) setDomainsCount(domains.length);
        if (quickAnalytics) setAnalyticsMetrics(quickAnalytics);
      } catch (err) {
        console.error('Erro ao carregar métricas no dashboard:', err);
      } finally {
        setLoading(false);
      }
    }

    loadMetrics();
  }, []);

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0F1C30] to-[#0B1526] border border-white/10 rounded-2xl p-6 sm:p-8 relative overflow-hidden shadow-xl">
        <div className="relative z-10 space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] text-xs font-semibold uppercase tracking-wider">
            <Building2 className="w-3.5 h-3.5" />
            <span>Painel de Controle Administrativo</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white font-serif">
            Bem-vindo(a), {profile?.full_name || user?.email || 'Engª Jucélia Santana'}
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Gerencie de forma centralizada todas as obras publicadas, laudos periciais, mensagens de clientes, permissões de acesso e configurações do sistema.
          </p>
        </div>
      </div>

      {/* Destaque Especial: Estatísticas de Visualizações do Site */}
      <div className="bg-gradient-to-r from-[#0B1526] via-[#0F1F38] to-[#0B1526] border border-[#C5A059]/30 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-[#C5A059]/10 text-[#C5A059]">
              <Activity className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold text-[#C5A059] uppercase tracking-wider">
              Tráfego do Site Institucional
            </span>
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white">
            Estatísticas de Visualizações
          </h2>
          <p className="text-xs text-slate-400 max-w-xl">
            Acompanhe o engajamento dos clientes pelas páginas públicas, propostas e laudos técnicos.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="bg-[#070D18]/70 border border-white/10 rounded-xl px-4 py-2.5 text-center min-w-[100px]">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Hoje</span>
            <span className="text-xl font-extrabold text-white">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin text-slate-500 mx-auto" /> : analyticsMetrics.today.toLocaleString('pt-BR')}
            </span>
          </div>

          <div className="bg-[#070D18]/70 border border-white/10 rounded-xl px-4 py-2.5 text-center min-w-[100px]">
            <span className="text-[10px] text-[#C5A059] uppercase font-bold block">7 Dias</span>
            <span className="text-xl font-extrabold text-[#C5A059]">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin text-slate-500 mx-auto" /> : analyticsMetrics.last7Days.toLocaleString('pt-BR')}
            </span>
          </div>

          <div className="bg-[#070D18]/70 border border-white/10 rounded-xl px-4 py-2.5 text-center min-w-[100px]">
            <span className="text-[10px] text-purple-400 uppercase font-bold block">30 Dias</span>
            <span className="text-xl font-extrabold text-purple-300">
              {loading ? <RefreshCw className="w-4 h-4 animate-spin text-slate-500 mx-auto" /> : analyticsMetrics.last30Days.toLocaleString('pt-BR')}
            </span>
          </div>

          <Link
            to="/admin/analytics"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C5A059] text-black font-bold text-xs hover:bg-[#b08e4c] transition-all shadow-md hover:scale-105 cursor-pointer shrink-0"
          >
            <BarChart3 className="w-4 h-4" />
            <span>Abrir Painel Completo →</span>
          </Link>
        </div>
      </div>

      {/* Cards de Métricas (Dinâmicos com Supabase) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-5">
        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 space-y-3 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-amber-400 uppercase tracking-wider">Propostas e Orçamentos</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <Calculator className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white flex items-center gap-2">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-slate-500" /> : proposalsCount}
          </p>
          <Link to="/admin/proposals" className="text-xs text-amber-400 hover:underline inline-flex items-center gap-1 font-medium pt-2">
            Ver Propostas →
          </Link>
        </div>

        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 space-y-3 hover:border-[#C5A059]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Obras Publicadas</span>
            <div className="p-2 rounded-xl bg-[#C5A059]/10 text-[#C5A059]">
              <ImageIcon className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white flex items-center gap-2">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-slate-500" /> : projectsCount}
          </p>
          <Link to="/admin/posts" className="text-xs text-[#C5A059] hover:underline inline-flex items-center gap-1 font-medium pt-2">
            Gerenciar Obras →
          </Link>
        </div>

        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 space-y-3 hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Artigos e Laudos</span>
            <div className="p-2 rounded-xl bg-sky-500/10 text-sky-400">
              <BookOpen className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white flex items-center gap-2">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-slate-500" /> : blogCount}
          </p>
          <Link to="/admin/articles" className="text-xs text-sky-400 hover:underline inline-flex items-center gap-1 font-medium pt-2">
            Gerenciar Artigos →
          </Link>
        </div>

        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 space-y-3 hover:border-[#C5A059]/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Documentos Técnicos</span>
            <div className="p-2 rounded-xl bg-[#C5A059]/10 text-[#C5A059]">
              <FileCheck className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white flex items-center gap-2">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-slate-500" /> : docsCount}
          </p>
          <Link to="/admin/documents" className="text-xs text-[#C5A059] hover:underline inline-flex items-center gap-1 font-medium pt-2">
            Gerenciar Documentos →
          </Link>
        </div>

        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 space-y-3 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Mensagens</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <MessageSquare className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white flex items-center gap-2">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-slate-500" /> : messagesCount}
          </p>
          <Link to="/admin/messages" className="text-xs text-emerald-400 hover:underline inline-flex items-center gap-1 font-medium pt-2">
            Ver Mensagens →
          </Link>
        </div>

        <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-5 space-y-3 hover:border-purple-500/40 transition-all sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Usuários</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white flex items-center gap-2">
            {loading ? <RefreshCw className="w-5 h-5 animate-spin text-slate-500" /> : usersCount}
          </p>
          <Link to="/admin/users" className="text-xs text-purple-400 hover:underline inline-flex items-center gap-1 font-medium pt-2">
            Gerenciar Perfis →
          </Link>
        </div>
      </div>

      {/* Atalhos Rápidos de Ação Organizados por Categoria */}
      <div className="space-y-8">
        
        {/* Seção 1: Identidade Visual e Conteúdo do Site */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#C5A059]" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                Identidade Visual e Conteúdo do Site
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">6 Módulos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 sm:gap-4">
            <Link
              to="/admin/analytics"
              className="group bg-[#0B1526] border border-[#C5A059]/40 hover:border-[#C5A059] rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between space-y-3 hover:shadow-lg hover:shadow-[#C5A059]/10 min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#C5A059] text-black font-bold flex items-center justify-center group-hover:scale-105 transition-all">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-[#C5A059] bg-[#070D18] px-2 py-0.5 rounded border border-[#C5A059]/20">
                  Métricas
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#C5A059] transition-colors">
                  Estatísticas de Acesso
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  Painel analítico de visitas e páginas acessadas.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/slides"
              className="group bg-[#0B1526] border border-white/10 hover:border-[#C5A059] rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between space-y-3 hover:shadow-lg hover:shadow-[#C5A059]/5 min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center group-hover:bg-[#C5A059] group-hover:text-[#070D18] transition-all">
                  <Sliders className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-[#C5A059] bg-[#070D18] px-2 py-0.5 rounded border border-[#C5A059]/20">
                  Capa
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#C5A059] transition-colors">
                  Slides da Capa (Hero)
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  Gerencie fotos de fundo da tela inicial.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/profile-photos"
              className="group bg-[#0B1526] border border-white/10 hover:border-[#C5A059] rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between space-y-3 hover:shadow-lg hover:shadow-[#C5A059]/5 min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center group-hover:bg-[#C5A059] group-hover:text-[#070D18] transition-all">
                  <UserCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-[#C5A059] bg-[#070D18] px-2 py-0.5 rounded border border-[#C5A059]/20">
                  Perfil
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#C5A059] transition-colors">
                  Fotos de Perfil
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  Retratos institucionais e foto principal.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/contact-settings"
              className="group bg-[#0B1526] border border-white/10 hover:border-emerald-400 rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between space-y-3 hover:shadow-lg hover:shadow-emerald-500/5 min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-400 group-hover:text-[#070D18] transition-all">
                  <PhoneCall className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-[#070D18] px-2 py-0.5 rounded border border-emerald-500/20">
                  Canais
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Canais e Telefones
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  Configure WhatsApp, telefones e e-mails oficiais.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/site-content"
              className="group bg-[#0B1526] border border-white/10 hover:border-[#C5A059] rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between space-y-3 hover:shadow-lg hover:shadow-[#C5A059]/5 min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center group-hover:bg-[#C5A059] group-hover:text-[#070D18] transition-all">
                  <FileText className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-[#C5A059] bg-[#070D18] px-2 py-0.5 rounded border border-[#C5A059]/20">
                  Textos
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#C5A059] transition-colors">
                  Textos e Legendas
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  Títulos, chamadas e informações das seções.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/faq"
              className="group bg-[#0B1526] border border-white/10 hover:border-[#C5A059] rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between space-y-3 hover:shadow-lg hover:shadow-[#C5A059]/5 min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center group-hover:bg-[#C5A059] group-hover:text-[#070D18] transition-all">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-[#C5A059] bg-[#070D18] px-2 py-0.5 rounded border border-[#C5A059]/20">
                  Dúvidas
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#C5A059] transition-colors">
                  Perguntas e FAQ
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  Gerencie perguntas frequentes do público.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/appearance"
              className="group bg-[#0B1526] border border-white/10 hover:border-[#C5A059] rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between space-y-3 hover:shadow-lg hover:shadow-[#C5A059]/5 min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center group-hover:bg-[#C5A059] group-hover:text-[#070D18] transition-all">
                  <Palette className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-[#C5A059] bg-[#070D18] px-2 py-0.5 rounded border border-[#C5A059]/20">
                  Branding
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#C5A059] transition-colors">
                  Identidade Visual
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed line-clamp-2">
                  Logos, favicons e dados corporativos.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Seção 2: Engenharia, Publicações e Acervo Técnico */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-sky-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                Engenharia, Propostas e Acervo
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">4 Módulos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
            <Link
              to="/admin/proposals"
              className="group bg-[#0B1526] border border-white/10 hover:border-amber-400 rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between space-y-3 hover:shadow-lg hover:shadow-amber-500/5 min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-400 group-hover:text-[#070D18] transition-all">
                  <Calculator className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-amber-400 bg-[#070D18] px-2 py-0.5 rounded border border-amber-500/20">
                  {proposalsCount} Recebidas
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                  Propostas e Orçamentos
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Analise pedidos de pré-dimensionamento com plantas anexadas.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/posts"
              className="group bg-[#0B1526] border border-white/10 hover:border-[#C5A059] rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between space-y-3 hover:shadow-lg hover:shadow-[#C5A059]/5 min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center group-hover:bg-[#C5A059] group-hover:text-[#070D18] transition-all">
                  <PlusCircle className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-[#C5A059] bg-[#070D18] px-2 py-0.5 rounded border border-[#C5A059]/20">
                  Obras
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#C5A059] transition-colors">
                  Publicar Obras e Galpões
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Cadastre fotos, vídeos e detalhes técnicos de projetos executados.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/articles"
              className="group bg-[#0B1526] border border-white/10 hover:border-sky-400 rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between space-y-3 hover:shadow-lg hover:shadow-sky-500/5 min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:bg-sky-400 group-hover:text-[#070D18] transition-all">
                  <BookOpen className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-sky-400 bg-[#070D18] px-2 py-0.5 rounded border border-sky-500/20">
                  Laudos
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
                  Artigos e Laudos Periciais
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Publique diagnósticos técnicos, normas NBR e patologia das construções.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/documents"
              className="group bg-[#0B1526] border border-white/10 hover:border-[#C5A059] rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between space-y-3 hover:shadow-lg hover:shadow-[#C5A059]/5 min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center group-hover:bg-[#C5A059] group-hover:text-[#070D18] transition-all">
                  <FileCheck className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-[#C5A059] bg-[#070D18] px-2 py-0.5 rounded border border-[#C5A059]/20">
                  PDFs
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#C5A059] transition-colors">
                  Documentos Técnicos
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Gerencie o acervo oficial de PDFs e memoriais para download público.
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Seção 3: Atendimento, Contatos e Controle de Acesso */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-400" />
              <h2 className="text-base sm:text-lg font-bold text-white">
                Atendimento, Mensagens, Domínios e Acessos
              </h2>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">5 Módulos</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 sm:gap-4">
            <Link
              to="/admin/domains"
              className="group bg-[#0B1526] border border-white/10 hover:border-[#C5A059] rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between space-y-3 hover:shadow-lg hover:shadow-[#C5A059]/5 min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center group-hover:bg-[#C5A059] group-hover:text-[#070D18] transition-all">
                  <Globe className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-[#C5A059] bg-[#070D18] px-2 py-0.5 rounded border border-[#C5A059]/20">
                  {domainsCount} {domainsCount === 1 ? 'Domínio' : 'Domínios'}
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#C5A059] transition-colors">
                  Domínios do Site
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Gerencie domínios oficiais, endereços de produção e SSL.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/messages"
              className="group bg-[#0B1526] border border-white/10 hover:border-emerald-400 rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between space-y-3 hover:shadow-lg hover:shadow-emerald-500/5 min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:bg-emerald-400 group-hover:text-[#070D18] transition-all">
                  <MessageSquare className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-[#070D18] px-2 py-0.5 rounded border border-emerald-500/20">
                  {messagesCount} Novas
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Mensagens de Contato
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Consulte leads e solicitações enviadas pelo site.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/users"
              className="group bg-[#0B1526] border border-white/10 hover:border-purple-400 rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between space-y-3 hover:shadow-lg hover:shadow-purple-500/5 min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center group-hover:bg-purple-400 group-hover:text-[#070D18] transition-all">
                  <Users className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-purple-400 bg-[#070D18] px-2 py-0.5 rounded border border-purple-500/20">
                  Equipe
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">
                  Gestão de Usuários
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Gerencie perfis cadastrados, permissões e status de acesso.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/invite-codes"
              className="group bg-[#0B1526] border border-white/10 hover:border-sky-400 rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between space-y-3 hover:shadow-lg hover:shadow-sky-500/5 min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:bg-sky-400 group-hover:text-[#070D18] transition-all">
                  <Ticket className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-sky-400 bg-[#070D18] px-2 py-0.5 rounded border border-sky-500/20">
                  Segurança
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
                  Códigos de Convite
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Gere chaves exclusivas para cadastro de novos administradores.
                </p>
              </div>
            </Link>

            <Link
              to="/admin/profile"
              className="group bg-[#0B1526] border border-white/10 hover:border-[#C5A059] rounded-2xl p-4 sm:p-5 transition-all duration-300 flex flex-col justify-between space-y-3 hover:shadow-lg hover:shadow-[#C5A059]/5 min-h-[140px]"
            >
              <div className="flex items-center justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center group-hover:bg-[#C5A059] group-hover:text-[#070D18] transition-all">
                  <UserCog className="w-5 h-5" />
                </div>
                <span className="text-[10px] uppercase font-bold text-[#C5A059] bg-[#070D18] px-2 py-0.5 rounded border border-[#C5A059]/20">
                  Conta
                </span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-white group-hover:text-[#C5A059] transition-colors">
                  Meu Perfil
                </h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Altere senha de acesso e dados cadastrais do seu usuário.
                </p>
              </div>
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}

