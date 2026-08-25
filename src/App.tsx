import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Auth Context & Protection
import { AuthProvider } from './context/AuthContext';
import { VisualIdentityProvider } from './context/VisualIdentityContext';
import { DomainProvider } from './context/DomainContext';
import { SiteContentProvider } from './context/SiteContentContext';
import { ContactSettingsProvider } from './context/ContactSettingsContext';
import { MediaDisplayProvider } from './context/MediaDisplayContext';
import { TextDisplayProvider } from './context/TextDisplayContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { preloadCriticalAssets } from './utils/preloadUtils';

// Statically Imported Pages para Carregamento Instantâneo sem Tela Branca
import Home from './pages/Home';
import PublicGallery from './pages/PublicGallery';
import PublicDocuments from './pages/PublicDocuments';
import PublicProposalRequest from './pages/PublicProposalRequest';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import AdminDashboard from './pages/AdminDashboard';
import AdminSlides from './pages/AdminSlides';
import AdminProfilePhotos from './pages/AdminProfilePhotos';
import AdminSiteContent from './pages/AdminSiteContent';
import AdminContactSettings from './pages/AdminContactSettings';
import AdminProposals from './pages/AdminProposals';
import { AdminFaq } from './pages/AdminFaq';
import AdminPosts from './pages/AdminPosts';
import AdminArticles from './pages/AdminArticles';
import AdminDocuments from './pages/AdminDocuments';
import AdminMessages from './pages/AdminMessages';
import AdminInviteCodes from './pages/AdminInviteCodes';
import AdminUsers from './pages/AdminUsers';
import AdminProfile from './pages/AdminProfile';
import AdminAppearance from './pages/AdminAppearance';
import AdminDomains from './pages/AdminDomains';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminBackups from './pages/AdminBackups';
import OAuthComplete from './pages/OAuthComplete';

// Layout
import AdminLayout from './components/layout/AdminLayout';
import PageViewTracker from './components/analytics/PageViewTracker';

export default function App() {
  useEffect(() => {
    preloadCriticalAssets();
  }, []);

  return (
    <AuthProvider>
      <VisualIdentityProvider>
        <DomainProvider>
          <SiteContentProvider>
            <ContactSettingsProvider>
              <MediaDisplayProvider>
                <TextDisplayProvider>
                  <BrowserRouter>
                    <PageViewTracker />
                    <Suspense fallback={<div className="min-h-screen bg-[#070D18]" />}>
                      <Routes>
                  {/* Rota Principal do Site Institucional - Exibe a IntroSplashScreen diretamente */}
                  <Route path="/" element={<Home />} />

                  {/* Rota da Galeria de Mídias/Obras */}
                  <Route path="/galeria" element={<PublicGallery />} />

                  {/* Rota da Central de Documentos Técnicos & Laudos */}
                  <Route path="/documentos" element={<PublicDocuments />} />
                  <Route path="/documentos/:slug" element={<PublicDocuments />} />

                  {/* Rota Pública de Solicitação de Propostas e Pré-Dimensionamento Estrutural (Etapa 11) */}
                  <Route path="/solicitar-proposta" element={<PublicProposalRequest />} />

                  {/* Rotas de Autenticação Supabase Auth */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/login/register" element={<Register />} />
                  <Route path="/login/forgot-password" element={<ForgotPassword />} />
                  <Route path="/admin/reset-password" element={<ResetPassword />} />

                  {/* Rotas do Painel Administrativo Protegidas pelo Supabase Auth */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute>
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Navigate to="/admin/dashboard" replace />} />
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="analytics" element={<AdminAnalytics />} />
                    <Route path="slides" element={<AdminSlides />} />
                    <Route path="profile-photos" element={<AdminProfilePhotos />} />
                    <Route path="site-content" element={<AdminSiteContent />} />
                    <Route path="contact-settings" element={<AdminContactSettings />} />
                    <Route path="proposals" element={<AdminProposals />} />
                    <Route path="faq" element={<AdminFaq />} />
                    <Route path="posts" element={<AdminPosts />} />
                    <Route path="articles" element={<AdminArticles />} />
                    <Route path="documents" element={<AdminDocuments />} />
                    <Route path="messages" element={<AdminMessages />} />
                    <Route path="users" element={<AdminUsers />} />
                    <Route path="domains" element={<AdminDomains />} />
                    <Route path="backups" element={<AdminBackups />} />
                    <Route path="backups/oauth-complete" element={<OAuthComplete />} />
                    <Route path="appearance" element={<AdminAppearance />} />
                    <Route path="invite-codes" element={<AdminInviteCodes />} />
                    <Route path="profile" element={<AdminProfile />} />
                  </Route>

                  {/* Redirecionamento Padrão */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TextDisplayProvider>
        </MediaDisplayProvider>
        </ContactSettingsProvider>
        </SiteContentProvider>
        </DomainProvider>
      </VisualIdentityProvider>
    </AuthProvider>
  );
}
