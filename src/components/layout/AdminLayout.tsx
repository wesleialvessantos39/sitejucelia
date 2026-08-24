import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Building2,
  LayoutDashboard,
  BarChart3,
  Image as ImageIcon,
  Ticket,
  LogOut,
  Eye,
  Users,
  UserCog,
  MessageSquare,
  Palette,
  Sliders,
  UserCheck,
  FileText,
  BookOpen,
  FileCheck,
  HelpCircle,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Calculator,
  PhoneCall,
  Globe,
  Database,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useVisualIdentity } from '../../context/VisualIdentityContext';
import { ManagedMedia } from '../ui/ManagedMedia';

export default function AdminLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, logout } = useAuth();
  const { settings, getEffectiveAsset } = useVisualIdentity();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Fecha o drawer automaticamente ao mudar de rota
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const adminIconSrc = getEffectiveAsset
    ? getEffectiveAsset('admin_sidebar_icon')
    : (settings.admin_sidebar_icon || settings.site_logo || '');

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Erro ao encerrar sessão:', err);
    }
  };

  const navGroups = [
    {
      groupName: 'Conteúdo e Visual',
      items: [
        { label: 'Visão Geral', path: '/admin/dashboard', icon: LayoutDashboard },
        { label: 'Estatísticas', path: '/admin/analytics', icon: BarChart3 },
        { label: 'Slides da Capa', path: '/admin/slides', icon: Sliders },
        { label: 'Fotos Perfil', path: '/admin/profile-photos', icon: UserCheck },
        { label: 'Textos e Legendas', path: '/admin/site-content', icon: FileText },
        { label: 'Canais e Telefones', path: '/admin/contact-settings', icon: PhoneCall },
        { label: 'Perguntas (FAQ)', path: '/admin/faq', icon: HelpCircle },
        { label: 'Identidade Visual', path: '/admin/appearance', icon: Palette },
      ]
    },
    {
      groupName: 'Engenharia e Acervo',
      items: [
        { label: 'Propostas e Orçamentos', path: '/admin/proposals', icon: Calculator },
        { label: 'Obras e Projetos', path: '/admin/posts', icon: ImageIcon },
        { label: 'Artigos e Laudos', path: '/admin/articles', icon: BookOpen },
        { label: 'Documentos e PDFs', path: '/admin/documents', icon: FileCheck },
      ]
    },
    {
      groupName: 'Gestão e Acesso',
      items: [
        { label: 'Domínios do Site', path: '/admin/domains', icon: Globe },
        { label: 'Backups e Drive', path: '/admin/backups', icon: Database },
        { label: 'Mensagens Contato', path: '/admin/messages', icon: MessageSquare },
        { label: 'Usuários', path: '/admin/users', icon: Users },
        { label: 'Convites', path: '/admin/invite-codes', icon: Ticket },
        { label: 'Meu Perfil', path: '/admin/profile', icon: UserCog },
      ]
    }
  ];

  // Flattened for quick label lookup
  const allNavItems = navGroups.flatMap(g => g.items);
  const currentNav = allNavItems.find(item => item.path === location.pathname);

  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 flex font-sans antialiased selection:bg-[#C5A059] selection:text-black">
      {/* ========================================================================= */}
      {/* 1. BARRA LATERAL DESKTOP (SIDEBAR FIXA COM TODOS OS 18 BOTÕES)           */}
      {/* ========================================================================= */}
      <aside
        className={`hidden lg:flex flex-col bg-[#0B1526] border-r border-white/10 shrink-0 sticky top-0 h-screen transition-all duration-300 z-30 relative ${
          sidebarCollapsed ? 'w-20' : 'w-64 xl:w-72'
        }`}
      >
        {/* Botão de Toggle Expandir / Recolher na Borda da Sidebar */}
        <button
          type="button"
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-5 z-40 w-6 h-6 rounded-full bg-[#122038] border border-white/20 hover:border-[#C5A059] text-slate-300 hover:text-white flex items-center justify-center shadow-lg transition-all cursor-pointer hover:scale-110"
          title={sidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
          aria-label={sidebarCollapsed ? 'Expandir barra lateral' : 'Recolher barra lateral'}
        >
          {sidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5 text-[#C5A059]" /> : <ChevronLeft className="w-3.5 h-3.5 text-slate-300" />}
        </button>

        {/* Cabeçalho da Barra Lateral */}
        <div className={`h-16 border-b border-white/10 flex items-center shrink-0 bg-[#08101E] ${
          sidebarCollapsed ? 'justify-center px-2' : 'justify-between px-4'
        }`}>
          <Link
            to="/admin/dashboard"
            className={`flex items-center gap-3 overflow-hidden group ${
              sidebarCollapsed ? 'justify-center' : ''
            }`}
            title="Painel Administrativo - Engª Jucélia Santana"
          >
            <div className="w-10 h-10 rounded-xl bg-[#C5A059] text-[#070D18] flex items-center justify-center font-bold shadow-md group-hover:scale-105 transition-transform overflow-hidden p-1 shrink-0">
              {adminIconSrc ? (
                <ManagedMedia
                  mediaKey="visual_identity:admin_sidebar_icon"
                  src={adminIconSrc}
                  alt="Ícone da Barra Lateral"
                  context="visual_identity"
                  loading="eager"
                  decoding="sync"
                  className="w-full h-full object-contain"
                  containerClassName="w-full h-full"
                />
              ) : (
                <Building2 className="w-5 h-5" />
              )}
            </div>
            {!sidebarCollapsed && (
              <div className="truncate">
                <span className="font-extrabold text-white text-sm tracking-tight font-serif block leading-tight truncate">
                  JUCÉLIA SANTANA <span className="text-[#C5A059]">ENG</span>
                </span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest block font-semibold">
                  Painel de Obras
                </span>
              </div>
            )}
          </Link>
        </div>

        {/* Lista de Navegação com Todas as Categorias e Botões */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6 custom-scrollbar">
          {navGroups.map((group) => (
            <div key={group.groupName} className="space-y-1">
              {!sidebarCollapsed && (
                <div className="px-3 pb-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C5A059] block">
                    {group.groupName}
                  </span>
                </div>
              )}
              {sidebarCollapsed && (
                <div className="h-[1px] bg-white/5 my-2 mx-1" />
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      title={sidebarCollapsed ? item.label : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                        isActive
                          ? 'bg-[#C5A059] text-black font-bold shadow-md shadow-[#C5A059]/20'
                          : 'text-slate-300 hover:text-white hover:bg-white/5'
                      } ${sidebarCollapsed ? 'justify-center px-2' : ''}`}
                    >
                      <Icon
                        className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-black' : 'text-[#C5A059]'
                        }`}
                      />
                      {!sidebarCollapsed && (
                        <span className="truncate">{item.label}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Rodapé da Barra Lateral: Perfil e Ações Rápidas */}
        <div className="p-3 border-t border-white/10 bg-[#08101E] space-y-2 shrink-0">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-xl bg-white/5 border border-white/5">
              <div className="truncate">
                <span className="text-xs font-bold text-white block truncate">
                  {profile?.full_name || user?.email || 'Administrador'}
                </span>
                <span className="text-[10px] text-[#C5A059] flex items-center gap-1 font-semibold">
                  <ShieldCheck className="w-3 h-3" />
                  {profile?.role === 'admin' ? 'Administrador Pleno' : 'Usuário'}
                </span>
              </div>
              <button
                onClick={handleLogout}
                type="button"
                title="Encerrar Sessão"
                className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer shrink-0"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              type="button"
              title="Encerrar Sessão"
              className="w-full flex items-center justify-center p-2 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          <Link
            to="/"
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir site público em nova aba"
            className={`w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#122038] border border-[#C5A059]/30 text-xs font-bold text-[#C5A059] hover:bg-[#C5A059] hover:text-black transition-all ${
              sidebarCollapsed ? 'px-2' : 'px-3'
            }`}
          >
            <Eye className="w-3.5 h-3.5 shrink-0" />
            {!sidebarCollapsed && <span>Ver Site Público</span>}
          </Link>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. ÁREA PRINCIPAL DO PAINEL COM HEADER SUPERIOR E CONTEÚDO               */}
      {/* ========================================================================= */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        {/* Header Superior */}
        <header className="bg-[#0B1526] border-b border-white/10 sticky top-0 z-20 backdrop-blur-md h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Lado Esquerdo: Mobile Hamburger & Título da Seção Atual */}
          <div className="flex items-center gap-3">
            {/* Mobile / Tablet Menu Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-xl bg-[#122038] border border-white/10 text-slate-200 hover:text-[#C5A059] transition-all flex items-center justify-center shrink-0 cursor-pointer"
              aria-label="Abrir Menu de Navegação"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div>
              <h1 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                {currentNav ? (
                  <>
                    <currentNav.icon className="w-4 h-4 text-[#C5A059]" />
                    <span>{currentNav.label}</span>
                  </>
                ) : (
                  <span>Painel Administrativo</span>
                )}
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Gestão Integrada — Engª Jucélia Santana
              </p>
            </div>
          </div>

          {/* Lado Direito: Ações Rápidas */}
          <div className="flex items-center gap-3">
            <Link
              to="/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#C5A059]/30 text-xs text-[#C5A059] hover:bg-[#C5A059] hover:text-black transition-all font-semibold shadow-sm"
              title="Visualizar site público em nova aba"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ver Site Público</span>
            </Link>

            <div className="h-6 w-[1px] bg-white/10 hidden sm:block" />

            <div className="hidden md:block text-right">
              <span className="text-xs font-semibold text-white block truncate max-w-[160px]">
                {profile?.full_name || user?.email || 'Engenheiro(a)'}
              </span>
              <span className="text-[10px] text-[#C5A059] block font-medium">
                {profile?.role === 'admin' ? 'Administrador Pleno' : 'Usuário'}
              </span>
            </div>

            <button
              onClick={handleLogout}
              type="button"
              title="Encerrar Sessão"
              className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shrink-0 lg:hidden"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Visualizador de Páginas do Admin */}
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Outlet />
        </main>

        {/* Rodapé do Painel */}
        <footer className="bg-[#0B1526] border-t border-white/10 py-4 text-center text-xs text-slate-500">
          Engª Jucélia Santana &copy; {new Date().getFullYear()} — Painel Administrativo de Obras
        </footer>
      </div>

      {/* ========================================================================= */}
      {/* 3. MENU DRAWER LATERAL MOBILE / TABLET                                   */}
      {/* ========================================================================= */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop com clique fora */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity z-40 pointer-events-auto"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Menu com z-50 acima do backdrop */}
          <aside
            aria-label="Menu Lateral Administrativo Mobile"
            className="fixed inset-y-0 left-0 max-w-xs w-full bg-[#0B1526] border-r border-white/10 p-5 flex flex-col justify-between shadow-2xl overflow-y-auto z-50 pointer-events-auto"
          >
            <div className="space-y-5">
              {/* Drawer Header */}
              <div className="flex items-center justify-between pb-4 border-b border-white/10">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#C5A059] text-black flex items-center justify-center font-bold overflow-hidden p-1 shrink-0 shadow-md">
                    {adminIconSrc ? (
                      <ManagedMedia
                        mediaKey="visual_identity:admin_sidebar_icon"
                        src={adminIconSrc}
                        alt="Ícone do Menu"
                        context="visual_identity"
                        className="w-full h-full object-contain"
                        containerClassName="w-full h-full"
                      />
                    ) : (
                      <Building2 className="w-5 h-5" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-white text-sm font-serif">JUCÉLIA SANTANA</h3>
                    <p className="text-[10px] text-[#C5A059] uppercase tracking-wider font-semibold">Painel Administrativo</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white cursor-pointer min-w-[40px] min-h-[40px] flex items-center justify-center"
                  aria-label="Fechar menu"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grouped Navigation Links */}
              <nav className="space-y-5 relative z-[60] pointer-events-auto">
                {navGroups.map((group) => (
                  <div key={group.groupName} className="space-y-1.5">
                    <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#C5A059] block px-2">
                      {group.groupName}
                    </span>
                    <div className="space-y-1">
                      {group.items.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setMobileMenuOpen(false)}
                            className={`relative z-[60] w-full min-h-[48px] flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold touch-manipulation pointer-events-auto select-none transition-all ${
                              isActive
                                ? 'bg-[#C5A059] text-black font-bold shadow-md'
                                : 'text-slate-300 hover:text-white hover:bg-white/5 active:bg-white/10'
                            }`}
                          >
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-black' : 'text-[#C5A059]'}`} />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </nav>
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-5 border-t border-white/10 space-y-2 shrink-0 relative z-[60] pointer-events-auto">
              <Link
                to="/"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full min-h-[48px] flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#122038] border border-[#C5A059]/40 text-xs font-bold text-[#C5A059] hover:bg-[#C5A059] hover:text-black transition-all touch-manipulation pointer-events-auto"
              >
                <Eye className="w-4 h-4" />
                <span>Ver Site Público</span>
              </Link>
              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full min-h-[48px] flex items-center justify-center gap-2 py-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition-all cursor-pointer touch-manipulation pointer-events-auto"
              >
                <LogOut className="w-4 h-4" />
                <span>Encerrar Sessão</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}


