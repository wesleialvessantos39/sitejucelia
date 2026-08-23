// /src/pages/PublicDocuments.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  FileText,
  Search,
  Download,
  Eye,
  Star,
  Tag,
  Calendar,
  HardDrive,
  Layers,
  FileSpreadsheet,
  FileCheck,
  FileCode2,
  X,
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  BookOpen,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { TechnicalDocument, DocumentCategory } from '../types/documents';
import { supabaseDatabase, TechnicalDocumentRow } from '../services/supabaseDatabase';
import { Navbar } from '../components/layout/Navbar';
import { Footer } from '../components/layout/Footer';
import { Button } from '../components/ui/Button';

const CATEGORIES: ('all' | DocumentCategory)[] = [
  'all',
  'Laudos Técnicos',
  'Artigos Técnicos',
  'Memorial Descritivo',
  'Relatórios',
  'Materiais Educativos',
  'Normas e Referências',
  'Engenharia Civil',
  'Segurança e Prevenção'
];

export default function PublicDocuments() {
  const { slug } = useParams<{ slug?: string }>();
  const [documents, setDocuments] = useState<TechnicalDocumentRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activePreviewDoc, setActivePreviewDoc] = useState<TechnicalDocumentRow | null>(null);

  // Carregar documentos publicados
  useEffect(() => {
    const fetchDocs = async () => {
      setLoading(true);
      try {
        const data = await supabaseDatabase.getTechnicalDocuments({
          onlyPublished: true,
          includeSoftDeleted: false,
        });

        const list = data || [];
        setDocuments(list);

        // Se veio slug na URL, abre o preview correspondente
        if (slug) {
          const match = list.find((d) => d.slug === slug);
          if (match) {
            setActivePreviewDoc(match);
          }
        }
      } catch (err) {
        console.error('Erro ao buscar documentos públicos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDocs();
  }, [slug]);

  // Formatador de tamanho de arquivo
  const formatFileSize = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Ícone por tipo
  const getDocIcon = (mimeType: string, type: string) => {
    if (mimeType.includes('pdf') || type.toLowerCase().includes('pdf')) {
      return <FileText className="w-6 h-6 text-rose-400" />;
    }
    if (mimeType.includes('sheet') || mimeType.includes('excel') || type.toLowerCase().includes('planilha')) {
      return <FileSpreadsheet className="w-6 h-6 text-emerald-400" />;
    }
    if (type.toLowerCase().includes('memorial') || type.toLowerCase().includes('laudo')) {
      return <FileCheck className="w-6 h-6 text-[#C5A059]" />;
    }
    return <FileCode2 className="w-6 h-6 text-sky-400" />;
  };

  const handleDownload = async (doc: TechnicalDocumentRow) => {
    try {
      await supabaseDatabase.incrementDocumentDownloads(doc.id);
      setDocuments(prev =>
        prev.map(d => d.id === doc.id ? { ...d, downloads_count: (d.downloads_count || 0) + 1 } : d)
      );
    } catch (err) {
      console.warn('Erro ao contabilizar download:', err);
    }
  };

  // Filtragem
  const filteredDocs = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.description && doc.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.file_name && doc.file_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory =
      selectedCategory === 'all' || doc.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const featuredDocs = filteredDocs.filter((d) => d.is_featured);

  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 font-sans flex flex-col selection:bg-[#C5A059] selection:text-[#070D18]">
      {/* Header Institucional */}
      <Navbar />

      <main className="flex-1 pt-28 sm:pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Breadcrumb e Retorno */}
          <div className="flex items-center gap-2 text-xs text-slate-400 font-medium">
            <Link to="/" className="hover:text-[#C5A059] transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Início
            </Link>
            <span>/</span>
            <span className="text-[#C5A059]">Central de Documentos e Laudos</span>
          </div>

          {/* Hero Section */}
          <div className="text-center max-w-3xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#C5A059]/10 text-[#C5A059] text-xs font-bold uppercase tracking-widest border border-[#C5A059]/20 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5" /> Documentação e Engenharia Diagnóstica
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight font-serif">
              Central de Documentos Técnicos e Laudos
            </h1>
            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-light">
              Acesse pareceres periciais, laudos de vistoria cautelar, memoriais descritivos e manuais técnicos de engenharia em conformidade com as normas da ABNT.
            </p>
          </div>

          {/* Barra de Pesquisa e Filtro de Categorias */}
          <div className="space-y-4 max-w-4xl mx-auto">
            {/* Input de Pesquisa */}
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Pesquisar por título do laudo, norma NBR ou palavras-chave..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#0B1526] border border-white/15 rounded-2xl pl-12 pr-10 py-3.5 text-sm sm:text-base text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059] shadow-lg transition-colors"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Pills de Categoria */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                const label = cat === 'all' ? 'Todos os Documentos' : cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border ${
                      isSelected
                        ? 'bg-[#C5A059] border-[#C5A059] text-[#070D18] shadow-md shadow-[#C5A059]/20 font-bold'
                        : 'bg-[#0B1526] border-white/10 text-slate-300 hover:text-white hover:border-white/20'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Seção de Documentos em Destaque */}
          {featuredDocs.length > 0 && selectedCategory === 'all' && !searchTerm && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#C5A059]/20 pb-3">
                <Star className="w-5 h-5 text-[#C5A059] fill-[#C5A059]" />
                <h2 className="text-lg sm:text-xl font-bold text-white font-serif">
                  Publicações e Laudos em Destaque
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {featuredDocs.map((doc) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[#0E1A30] to-[#0B1526] border-2 border-[#C5A059]/40 hover:border-[#C5A059] rounded-3xl p-6 shadow-xl transition-all flex flex-col justify-between space-y-5 group"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-full bg-[#C5A059]/20 text-[#C5A059] text-[11px] font-bold tracking-wider uppercase border border-[#C5A059]/30 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-[#C5A059]" /> Destaque Técnico
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {formatFileSize(doc.file_size)}
                        </span>
                      </div>

                      <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-[#C5A059] transition-colors leading-snug font-serif">
                        {doc.title}
                      </h3>

                      {doc.description && (
                        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed line-clamp-3 font-light">
                          {doc.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
                        <span className="inline-flex items-center gap-1 text-[#C5A059]">
                          <Tag className="w-3.5 h-3.5" /> {doc.category}
                        </span>
                        <span>•</span>
                        <span>{doc.document_type}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setActivePreviewDoc(doc)}
                          className="px-3.5 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 transition-all"
                        >
                          <Eye className="w-3.5 h-3.5" /> Visualizar
                        </button>

                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          download={doc.file_name}
                          onClick={() => handleDownload(doc)}
                          className="px-4 py-2 rounded-xl bg-[#C5A059] hover:bg-[#b08d4b] text-[#070D18] text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
                        >
                          <Download className="w-3.5 h-3.5" /> Baixar
                        </a>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Grid Principal de Documentos */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h2 className="text-lg sm:text-xl font-bold text-white font-serif flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#C5A059]" />
                {selectedCategory === 'all' ? 'Todos os Documentos Disponíveis' : selectedCategory}
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                {filteredDocs.length} {filteredDocs.length === 1 ? 'documento' : 'documentos'}
              </span>
            </div>

            {loading ? (
              <div className="bg-[#0B1526] border border-white/10 rounded-3xl p-16 flex flex-col items-center justify-center space-y-3 text-center">
                <div className="w-8 h-8 border-2 border-[#C5A059] border-t-transparent rounded-full animate-spin" />
                <p className="text-sm text-slate-400">Carregando acervo técnico de engenharia...</p>
              </div>
            ) : filteredDocs.length === 0 ? (
              <div className="bg-[#0B1526] border border-white/10 rounded-3xl p-16 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-white/5 text-slate-400 flex items-center justify-center mx-auto">
                  <FileText className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-white font-serif">Nenhum documento encontrado</h3>
                <p className="text-sm text-slate-400 max-w-md mx-auto">
                  {searchTerm || selectedCategory !== 'all'
                    ? 'Nenhum laudo ou documento técnico corresponde à pesquisa selecionada.'
                    : 'Nenhum documento técnico está disponível no momento.'}
                </p>
                {(searchTerm || selectedCategory !== 'all') && (
                  <Button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                    }}
                    variant="outline"
                    className="border-white/10 text-slate-300 hover:text-white"
                  >
                    Limpar Filtros de Busca
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredDocs.map((doc, idx) => (
                  <motion.div
                    key={doc.id}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: idx * 0.04 }}
                    className="bg-[#0B1526] border border-white/10 hover:border-[#C5A059]/40 rounded-3xl p-5 sm:p-6 flex flex-col justify-between space-y-4 hover:shadow-xl transition-all group"
                  >
                    <div className="space-y-3">
                      {/* Top Header do Card */}
                      <div className="flex items-start justify-between gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-[#070D18] border border-white/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          {getDocIcon(doc.mime_type, doc.document_type)}
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] font-mono text-slate-400 block">
                            {formatFileSize(doc.file_size)}
                          </span>
                          <span className="text-[10px] text-slate-500 font-mono block">
                            {new Date(doc.created_at).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      {/* Categoria */}
                      <div className="inline-block px-2.5 py-0.5 rounded-full bg-[#C5A059]/10 text-[#C5A059] text-[10px] font-bold uppercase tracking-wider border border-[#C5A059]/20">
                        {doc.category}
                      </div>

                      {/* Título */}
                      <h3 className="text-base font-bold text-white group-hover:text-[#C5A059] transition-colors leading-snug font-serif line-clamp-2">
                        {doc.title}
                      </h3>

                      {/* Descrição */}
                      {doc.description && (
                        <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 font-light">
                          {doc.description}
                        </p>
                      )}
                    </div>

                    {/* Footer com Ações */}
                    <div className="pt-3 border-t border-white/5 flex items-center justify-between gap-2">
                      <button
                        onClick={() => setActivePreviewDoc(doc)}
                        className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" /> Visualizar
                      </button>

                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={doc.file_name}
                        onClick={() => handleDownload(doc)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#C5A059] hover:bg-[#b08d4b] text-[#070D18] text-xs font-bold flex items-center gap-1.5 shadow transition-all"
                      >
                        <Download className="w-3.5 h-3.5" /> Baixar
                      </a>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de Visualização de Documento / PDF */}
      <AnimatePresence>
        {activePreviewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0B1526] border border-white/15 rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Header do Preview */}
              <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between bg-[#070D18] shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-base font-bold text-white font-serif truncate">
                      {activePreviewDoc.title}
                    </h3>
                    <p className="text-xs text-slate-400 truncate">
                      {activePreviewDoc.category} • {formatFileSize(activePreviewDoc.file_size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={activePreviewDoc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    download={activePreviewDoc.file_name}
                    onClick={() => handleDownload(activePreviewDoc)}
                    className="px-4 py-2 rounded-xl bg-[#C5A059] hover:bg-[#b08d4b] text-[#070D18] font-bold text-xs flex items-center gap-1.5 shadow transition-all"
                  >
                    <Download className="w-3.5 h-3.5" /> Baixar Arquivo
                  </a>
                  <button
                    onClick={() => setActivePreviewDoc(null)}
                    className="p-2 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Conteúdo do Preview */}
              <div className="flex-1 bg-[#070D18] p-4 flex flex-col items-center justify-center overflow-hidden">
                {activePreviewDoc.mime_type.includes('pdf') ||
                activePreviewDoc.file_name.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={`${activePreviewDoc.file_url}#toolbar=1`}
                    title={activePreviewDoc.title}
                    className="w-full h-full rounded-xl border border-white/10"
                  />
                ) : (
                  <div className="text-center space-y-4 max-w-md p-8 bg-[#0B1526] rounded-3xl border border-white/10">
                    <div className="w-16 h-16 rounded-2xl bg-[#C5A059]/10 text-[#C5A059] flex items-center justify-center mx-auto">
                      <FileCheck className="w-8 h-8" />
                    </div>
                    <h4 className="text-lg font-bold text-white font-serif">{activePreviewDoc.file_name}</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-light">
                      Este documento está no formato {activePreviewDoc.document_type || 'técnico original'} e pode ser baixado com segurança para abertura em seu dispositivo.
                    </p>
                    <a
                      href={activePreviewDoc.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      download={activePreviewDoc.file_name}
                      onClick={() => handleDownload(activePreviewDoc)}
                      className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#C5A059] hover:bg-[#b08d4b] text-[#070D18] font-bold text-sm shadow transition-all"
                    >
                      <Download className="w-4 h-4" /> Baixar Documento
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Rodapé Institucional */}
      <Footer />
    </div>
  );
}
