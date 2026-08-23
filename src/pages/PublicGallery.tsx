import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Video, Calendar, Search, Building2, Eye } from 'lucide-react';
import { supabaseDatabase } from '../services/supabaseDatabase';
import { PROJECTS_DATA } from '../data/companyData';
import { getAssetUrl } from '../utils/assetUtils';
import { ManagedMedia } from '../components/ui/ManagedMedia';

export interface Post {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  videoUrl: string;
  createdAt: string;
}

export default function PublicGallery() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState<string>('');
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function fetchGalleryProjects() {
      try {
        setIsLoading(true);
        const data = await supabaseDatabase.getProjects();
        if (!isMounted) return;

        if (data && data.length > 0) {
          const mappedPosts: Post[] = data.map((item: any) => {
            const sortedImages = Array.isArray(item.project_images)
              ? [...item.project_images].sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
              : [];

            const mainImage = item.image_url || (sortedImages.length > 0 ? sortedImages[0].image_url : '');

            return {
              id: item.id,
              title: item.title || '',
              description: item.description || '',
              imageUrl: getAssetUrl(mainImage),
              videoUrl: item.video_url ? getAssetUrl(item.video_url) : '',
              createdAt: item.created_at || new Date().toISOString(),
            };
          });

          setPosts(mappedPosts);
        } else {
          // Fallback mapping from PROJECTS_DATA
          const fallbackPosts: Post[] = PROJECTS_DATA.map(p => ({
            id: p.id,
            title: p.title,
            description: p.description,
            imageUrl: getAssetUrl(p.imageUrl),
            videoUrl: p.videoUrl ? getAssetUrl(p.videoUrl) : '',
            createdAt: p.year ? `${p.year}-01-01` : new Date().toISOString(),
          }));
          setPosts(fallbackPosts);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('[PublicGallery] Erro ao carregar galeria do Supabase:', err);
        const fallbackPosts: Post[] = PROJECTS_DATA.map(p => ({
          id: p.id,
          title: p.title,
          description: p.description,
          imageUrl: getAssetUrl(p.imageUrl),
          videoUrl: p.videoUrl ? getAssetUrl(p.videoUrl) : '',
          createdAt: p.year ? `${p.year}-01-01` : new Date().toISOString(),
        }));
        setPosts(fallbackPosts);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    fetchGalleryProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 flex flex-col font-sans">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#0F1C30] to-[#070D18] border-b border-white/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#C5A059]/10 border border-[#C5A059]/30 text-[#C5A059] text-xs font-semibold uppercase tracking-widest">
            <Building2 className="w-4 h-4" /> Engª Jucélia Santana
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white font-serif">
            Galeria de Obras e Projetos
          </h1>
          <p className="max-w-2xl mx-auto text-slate-400 text-sm sm:text-base leading-relaxed">
            Acompanhe nossos registros visuais de projetos estruturais, laudos periciais e obras.
          </p>

          {/* Busca */}
          <div className="max-w-md mx-auto pt-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar obras por título ou descrição..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0B1526] border border-white/10 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-[#C5A059] transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {filteredPosts.length === 0 && (
          <div className="bg-[#0B1526] border border-white/10 rounded-2xl p-12 text-center space-y-4 max-w-lg mx-auto">
            <div className="w-12 h-12 mx-auto rounded-full bg-white/5 flex items-center justify-center text-slate-500">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-semibold text-white">Nenhuma obra encontrada</h3>
            <p className="text-slate-400 text-sm">
              {search
                ? 'Nenhum resultado encontrado para a busca informada.'
                : 'Ainda não há registros de obras publicados no sistema.'}
            </p>
          </div>
        )}

        {filteredPosts.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-[#0B1526] border border-white/10 rounded-2xl overflow-hidden hover:border-[#C5A059]/50 transition-all duration-300 flex flex-col group shadow-lg"
              >
                {/* Mídia: Imagem ou Vídeo */}
                <div className="relative aspect-video bg-black/40 overflow-hidden">
                  {post.imageUrl ? (
                    <ManagedMedia
                      mediaKey={`gallery_post:${post.id}`}
                      src={post.imageUrl}
                      alt={post.title}
                      context="project_thumbnail"
                      className="group-hover:scale-105 transition-transform duration-500"
                      containerClassName="w-full h-full"
                    />
                  ) : post.videoUrl ? (
                    <video
                      src={post.videoUrl}
                      controls
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-600 bg-[#060B14]">
                      <ImageIcon className="w-8 h-8 mb-1" />
                      <span className="text-xs">Sem mídia visual</span>
                    </div>
                  )}

                  {/* Badges de Mídia */}
                  <div className="absolute top-3 left-3 flex gap-2">
                    {post.imageUrl && (
                      <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-xs font-medium text-white flex items-center gap-1">
                        <ImageIcon className="w-3 h-3 text-[#C5A059]" /> Foto
                      </span>
                    )}
                    {post.videoUrl && (
                      <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-xs font-medium text-white flex items-center gap-1">
                        <Video className="w-3 h-3 text-sky-400" /> Vídeo
                      </span>
                    )}
                  </div>
                </div>

                {/* Informações da Obra */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-lg font-bold text-white group-hover:text-[#C5A059] transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-slate-400 text-xs sm:text-sm line-clamp-3 leading-relaxed">
                      {post.description || 'Sem descrição cadastrada.'}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {post.createdAt ? new Date(post.createdAt).toLocaleDateString('pt-BR') : 'Data N/I'}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedPost(post)}
                      className="text-[#C5A059] hover:underline flex items-center gap-1 text-xs font-semibold cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" /> Ampliar
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Modal de Detalhes / Ampliação */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0B1526] border border-white/20 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-4 relative">
            <button
              type="button"
              onClick={() => setSelectedPost(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 w-8 h-8 rounded-full flex items-center justify-center"
            >
              ✕
            </button>
            <h2 className="text-xl font-bold text-white">{selectedPost.title}</h2>
            <p className="text-slate-300 text-sm leading-relaxed">{selectedPost.description}</p>

            {selectedPost.imageUrl && (
              <div>
                <span className="text-xs text-slate-400 mb-1 block">Imagem:</span>
                <img src={selectedPost.imageUrl} alt={selectedPost.title} className="w-full rounded-xl max-h-96 object-contain bg-black" />
              </div>
            )}

            {selectedPost.videoUrl && (
              <div>
                <span className="text-xs text-slate-400 mb-1 block">Vídeo:</span>
                <video src={selectedPost.videoUrl} controls className="w-full rounded-xl max-h-96 bg-black" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
