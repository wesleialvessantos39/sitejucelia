// /src/components/sections/PublicGallery.tsx
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Image, Video, Film, Eye, X, Filter, Sparkles } from 'lucide-react';

export interface PublicPost {
  id: string;
  type: string;
  title: string;
  description: string;
  image_url?: string;
  video_url?: string;
  gallery_urls?: string[];
  category?: string;
  created_at: string;
}

export const PublicGallery: React.FC = () => {
  const [posts] = useState<PublicPost[]>([]);
  const [filter, setFilter] = useState<'all' | 'photos' | 'videos'>('all');
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; isVideo: boolean; title: string; desc: string } | null>(null);

  // Coleta todas as mídias individuais (fotos e vídeos) para exibição direta
  const allItems: Array<{ id: string; url: string; isVideo: boolean; title: string; desc: string; category?: string }> = [];

  posts.forEach((post) => {
    if (post.image_url) {
      allItems.push({
        id: `${post.id}-cover`,
        url: post.image_url,
        isVideo: false,
        title: post.title,
        desc: post.description,
        category: post.category,
      });
    }

    if (post.video_url) {
      allItems.push({
        id: `${post.id}-video`,
        url: post.video_url,
        isVideo: true,
        title: post.title,
        desc: post.description,
        category: post.category,
      });
    }

    if (post.gallery_urls && post.gallery_urls.length > 0) {
      post.gallery_urls.forEach((gUrl, idx) => {
        allItems.push({
          id: `${post.id}-gallery-${idx}`,
          url: gUrl,
          isVideo: false,
          title: `${post.title} (Foto ${idx + 1})`,
          desc: post.description,
          category: post.category,
        });
      });
    }
  });

  const filteredItems = allItems.filter((item) => {
    if (filter === 'photos') return !item.isVideo;
    if (filter === 'videos') return item.isVideo;
    return true;
  });

  return (
    <section id="galeria" className="py-20 bg-[#070D18] relative text-white overflow-hidden border-t border-b border-[#C5A059]/20">
      {/* Background Glows */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#C5A059]/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-900/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#122038] border border-[#C5A059]/40 text-[#C5A059] text-xs font-jakarta font-semibold tracking-widest uppercase mb-4 shadow-sm">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mídias e Registros de Campo</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-cinzel font-bold text-white mb-4">
            Galeria Pública de <span className="text-gradient-gold">Fotos e Vídeos</span>
          </h2>
          <p className="text-slate-300 font-jakarta text-sm sm:text-base leading-relaxed">
            Acompanhe em tempo real os registros visuais, laudos em vídeo e acervo fotográfico das obras e vistorias publicadas.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-5 py-2.5 rounded-xl font-jakarta text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2 cursor-pointer ${
              filter === 'all'
                ? 'bg-[#C5A059] text-black shadow-lg shadow-[#C5A059]/20'
                : 'bg-[#122038] text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span>Todas as Mídias ({allItems.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('photos')}
            className={`px-5 py-2.5 rounded-xl font-jakarta text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2 cursor-pointer ${
              filter === 'photos'
                ? 'bg-[#C5A059] text-black shadow-lg shadow-[#C5A059]/20'
                : 'bg-[#122038] text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            <Image className="w-4 h-4" />
            <span>Fotos ({allItems.filter((i) => !i.isVideo).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setFilter('videos')}
            className={`px-5 py-2.5 rounded-xl font-jakarta text-xs uppercase tracking-wider font-bold transition-all flex items-center gap-2 cursor-pointer ${
              filter === 'videos'
                ? 'bg-[#C5A059] text-black shadow-lg shadow-[#C5A059]/20'
                : 'bg-[#122038] text-slate-300 hover:text-white border border-white/10'
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Vídeos ({allItems.filter((i) => i.isVideo).length})</span>
          </button>
        </div>

        {/* Empty State */}
        {filteredItems.length === 0 && (
          <div className="text-center py-16 bg-[#122038]/50 border border-white/10 rounded-2xl max-w-xl mx-auto">
            <Film className="w-12 h-12 text-[#C5A059] mx-auto mb-3 opacity-60" />
            <h3 className="text-lg font-bold text-white mb-1">Nenhuma mídia encontrada</h3>
            <p className="text-slate-400 text-xs font-jakarta">
              Nenhuma foto ou vídeo cadastrado no momento.
            </p>
          </div>
        )}

        {/* Media Grid */}
        {filteredItems.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="group relative bg-[#0E1729] border border-[#C5A059]/30 rounded-2xl overflow-hidden shadow-xl hover:border-[#C5A059] transition-all flex flex-col"
              >
                {/* Media Preview Container */}
                <div className="relative aspect-video w-full bg-black overflow-hidden flex items-center justify-center">
                  {item.isVideo ? (
                    <div className="relative w-full h-full">
                      <video
                        src={item.url}
                        controls
                        preload="metadata"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[#C5A059] text-[10px] font-bold flex items-center gap-1 border border-[#C5A059]/30 pointer-events-none">
                        <Video className="w-3 h-3" />
                        <span>VÍDEO</span>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setSelectedMedia({ url: item.url, isVideo: false, title: item.title, desc: item.desc })}
                      className="relative w-full h-full cursor-pointer group-hover:scale-105 transition-transform duration-500"
                    >
                      <img
                        src={item.url}
                        alt={item.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="p-3 bg-[#C5A059] text-black rounded-full shadow-lg">
                          <Eye className="w-5 h-5" />
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[#C5A059] text-[10px] font-bold flex items-center gap-1 border border-[#C5A059]/30">
                        <Image className="w-3 h-3" />
                        <span>FOTO</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Info Container */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    {item.category && (
                      <span className="text-[10px] uppercase font-bold text-[#C5A059] tracking-wider block mb-1">
                        {item.category}
                      </span>
                    )}
                    <h3 className="font-cinzel font-bold text-white text-base leading-snug mb-2 line-clamp-1">
                      {item.title}
                    </h3>
                    {item.desc && (
                      <p className="text-slate-300 font-jakarta text-xs leading-relaxed line-clamp-2">
                        {item.desc}
                      </p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>

      {/* Lightbox / Fullscreen Modal */}
      <AnimatePresence>
        {selectedMedia && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-6"
            onClick={() => setSelectedMedia(null)}
          >
            <div
              className="relative max-w-4xl w-full bg-[#0E1729] border border-[#C5A059] rounded-2xl overflow-hidden shadow-2xl flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-4 border-b border-white/10 bg-[#0A1220]">
                <h3 className="font-cinzel font-bold text-white text-lg">{selectedMedia.title}</h3>
                <button
                  type="button"
                  onClick={() => setSelectedMedia(null)}
                  className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-2 bg-black flex items-center justify-center max-h-[75vh]">
                {selectedMedia.isVideo ? (
                  <video src={selectedMedia.url} controls autoPlay className="max-h-[70vh] w-auto rounded-lg" />
                ) : (
                  <img src={selectedMedia.url} alt={selectedMedia.title} className="max-h-[70vh] w-auto object-contain rounded-lg" />
                )}
              </div>

              {selectedMedia.desc && (
                <div className="p-4 bg-[#0A1220] border-t border-white/10">
                  <p className="text-slate-300 font-jakarta text-xs sm:text-sm leading-relaxed">
                    {selectedMedia.desc}
                  </p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};
