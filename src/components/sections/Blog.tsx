import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Calendar, User, ArrowRight, X, FileText, Tag, RefreshCw } from 'lucide-react';
import { CMSBlogPost } from '../../types/cms';
import { Button } from '../ui/Button';
import { supabaseDatabase } from '../../services/supabaseDatabase';

export const Blog: React.FC = () => {
  const [posts, setPosts] = useState<CMSBlogPost[]>([]);
  const [selectedPost, setSelectedPost] = useState<CMSBlogPost | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadPublishedBlogPosts() {
      try {
        const dbPosts = await supabaseDatabase.getBlogPosts(true, false);
        if (dbPosts && dbPosts.length > 0) {
          const mapped: CMSBlogPost[] = dbPosts.map((p) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            category: p.category,
            summary: p.summary,
            content: p.content,
            cover_url: p.cover_url || undefined,
            author: p.author,
            published: p.published,
            created_at: p.created_at,
          }));
          setPosts(mapped);
        } else {
          setPosts([]);
        }
      } catch (err) {
        console.warn('[Blog] Erro ao carregar artigos do banco de dados:', err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    }

    loadPublishedBlogPosts();
  }, []);

  return (
    <section id="blog" className="relative py-20 bg-[#0A1220] border-t border-white/5 overflow-hidden">
      <div className="absolute top-1/2 left-0 -translate-y-1/2 w-96 h-96 bg-[#C5A059]/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-4 max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#122038] border border-[#C5A059]/40 text-[#C5A059] text-xs font-mono tracking-wider uppercase shadow-md">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Engenharia Diagnóstica</span>
          </div>

          <h2 className="font-cinzel font-bold text-2xl sm:text-4xl text-white tracking-tight">
            <span className="text-[#C5A059]">Laudos Periciais</span>
          </h2>

          <p className="font-jakarta text-slate-300 text-sm sm:text-base leading-relaxed">
            Acompanhe análises sobre patologia das construções, normas NBR, cálculo estrutural e soluções para obras residenciais, comerciais e agroindustriais.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="p-12 text-center bg-[#0E1B31] border border-white/10 rounded-2xl max-w-md mx-auto space-y-3">
            <FileText className="w-8 h-8 text-[#C5A059] mx-auto opacity-60" />
            <p className="text-sm text-slate-300">Nenhum laudo pericial publicado recentemente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {posts.map((post) => (
              <motion.article
                key={post.id || post.slug}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="group relative bg-[#0E1B31] border border-white/10 hover:border-[#C5A059]/50 rounded-2xl overflow-hidden shadow-xl flex flex-col transition-all duration-300 hover:shadow-2xl hover:shadow-[#C5A059]/10"
              >
                {post.cover_url && (
                  <div className="relative aspect-video overflow-hidden bg-[#0A1220]">
                    <img
                      src={post.cover_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-[#0A1220]/80 backdrop-blur-md px-3 py-1 rounded-full border border-[#C5A059]/40 text-[#C5A059] text-xs font-semibold flex items-center gap-1.5">
                      <Tag className="w-3 h-3" />
                      <span>{post.category}</span>
                    </div>
                  </div>
                )}

                <div className="p-6 sm:p-7 flex-1 flex flex-col justify-between space-y-5">
                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-xs text-slate-400 font-jakarta">
                      <span className="flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-[#C5A059]" />
                        {post.author}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-[#C5A059]" />
                        {post.created_at ? new Date(post.created_at).toLocaleDateString('pt-BR') : '2025'}
                      </span>
                    </div>

                    <h3 className="font-cinzel font-bold text-lg sm:text-xl text-white group-hover:text-[#C5A059] transition-colors line-clamp-2">
                      {post.title}
                    </h3>

                    <p className="font-jakarta text-slate-300 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                      {post.summary}
                    </p>
                  </div>

                  <div className="pt-2 border-t border-white/5">
                    <button
                      type="button"
                      onClick={() => setSelectedPost(post)}
                      className="inline-flex items-center gap-2 text-xs font-bold font-jakarta text-[#C5A059] group-hover:text-amber-300 transition-colors uppercase tracking-wider cursor-pointer"
                    >
                      <span>Ver Laudo Completo</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        <AnimatePresence>
          {selectedPost && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 sm:p-6 bg-[#0A1220]/90 backdrop-blur-xl overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-3xl bg-[#0E1B31] border border-[#C5A059]/40 rounded-2xl shadow-2xl overflow-hidden my-auto max-h-[90vh] flex flex-col"
              >
                <div className="flex items-center justify-between p-4 sm:p-5 bg-[#0A1220] border-b border-white/10 shrink-0">
                  <span className="text-xs font-mono uppercase text-[#C5A059] px-2.5 py-1 rounded bg-[#C5A059]/10 border border-[#C5A059]/30">
                    {selectedPost.category}
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPost(null)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="p-6 sm:p-8 overflow-y-auto space-y-6 font-jakarta text-slate-200">
                  {selectedPost.cover_url && (
                    <img
                      src={selectedPost.cover_url}
                      alt={selectedPost.title}
                      className="w-full h-64 sm:h-80 object-cover rounded-xl border border-white/10 shadow-lg"
                    />
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span className="flex items-center gap-1.5 text-[#C5A059] font-semibold">
                        <User className="w-4 h-4" />
                        {selectedPost.author}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <Calendar className="w-4 h-4" />
                        {selectedPost.created_at ? new Date(selectedPost.created_at).toLocaleDateString('pt-BR') : '2025'}
                      </span>
                    </div>

                    <h2 className="font-cinzel font-bold text-xl sm:text-2xl text-white">
                      {selectedPost.title}
                    </h2>
                  </div>

                  <div className="prose prose-invert max-w-none text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-line border-t border-white/10 pt-4">
                    {selectedPost.content}
                  </div>

                  <div className="pt-6 border-t border-white/10 flex items-center justify-between">
                    <p className="text-[11px] text-slate-400">
                      Engª Jucélia Santana — CREA-RO 22430 | Engenharia Estrutural e Perícias
                    </p>
                    <Button
                      variant="gold"
                      size="sm"
                      onClick={() => setSelectedPost(null)}
                    >
                      Fechar Leitura
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};
