// /src/components/sections/Projects.tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { SectionHeader } from '../ui/SectionHeader';
import { PROJECTS_DATA, getWhatsAppUrl } from '../../data/companyData';
import { ProjectItem } from '../../types';
import { supabaseDatabase } from '../../services/supabaseDatabase';
import { useSiteContent } from '../../context/SiteContentContext';
import { useMediaDisplay } from '../../context/MediaDisplayContext';
import { ManagedMedia } from '../ui/ManagedMedia';
import { getAssetUrl, handleStructuralPhotoError, handleStructuralVideoError } from '../../utils/assetUtils';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { SmartText } from '../ui/SmartText';
import { 
  MapPin, 
  Calendar, 
  Ruler, 
  ChevronLeft,
  ChevronRight,
  Video,
  Image as ImageIcon,
  CheckCircle2,
  Phone,
  ShieldCheck,
  Building2,
  Play,
  Volume2
} from 'lucide-react';

interface LazyVideoPlayerProps {
  videoUrl: string;
  posterUrl: string;
  title?: string;
  autoPlayOnInit?: boolean;
}

const LazyVideoPlayer: React.FC<LazyVideoPlayerProps> = ({ videoUrl, posterUrl, title, autoPlayOnInit = true }) => {
  const [isPlaying, setIsPlaying] = useState(autoPlayOnInit);

  useEffect(() => {
    setIsPlaying(autoPlayOnInit);
  }, [videoUrl, autoPlayOnInit]);

  const formattedVideoUrl = getAssetUrl(videoUrl);
  const formattedPosterUrl = getAssetUrl(posterUrl);

  const handleMediaError = (e: React.SyntheticEvent<HTMLImageElement | HTMLVideoElement, Event>) => {
    handleStructuralVideoError(e);
  };

  if (videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be') || videoUrl.includes('vimeo.com')) {
    return (
      <div className="relative aspect-video rounded-2xl overflow-hidden border border-[#C5A059]/40 shadow-2xl bg-[#0A1220] flex items-center justify-center">
        <iframe
          src={videoUrl}
          title={title || 'Vídeo do projeto'}
          className="w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      </div>
    );
  }

  if (isPlaying) {
    return (
      <div className="relative aspect-video rounded-2xl overflow-hidden border border-[#C5A059]/40 shadow-2xl bg-[#0A1220] flex items-center justify-center group">
        <video
          controls
          autoPlay
          preload="auto"
          onError={handleMediaError}
          controlsList="nodownload"
          playsInline
          className="w-full h-full object-cover rounded-2xl"
          poster={formattedPosterUrl}
        >
          <source src={formattedVideoUrl} type="video/mp4" />
          Seu navegador não suporta a reprodução direta deste formato de vídeo.
        </video>
      </div>
    );
  }

  return (
    <div 
      onClick={() => setIsPlaying(true)}
      className="relative aspect-video rounded-2xl overflow-hidden border border-[#C5A059]/40 shadow-2xl bg-[#0A1220] cursor-pointer group flex items-center justify-center select-none"
    >
      <img
        src={formattedPosterUrl}
        alt={title || 'Capa do vídeo'}
        loading="lazy"
        decoding="async"
        onError={handleMediaError}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-60 group-hover:opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex flex-col items-center justify-center p-6 text-center space-y-3">
        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-[#C5A059] group-hover:bg-amber-400 text-black flex items-center justify-center shadow-[0_0_35px_rgba(197,160,89,0.6)] group-hover:scale-110 transition-all duration-300">
          <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-black ml-1" />
        </div>
        <div className="space-y-1 max-w-md">
          <span className="font-cinzel font-bold text-white text-base sm:text-lg tracking-wide block group-hover:text-[#C5A059] transition-colors">
            Assistir ao Vídeo do Projeto
          </span>
          <p className="text-xs text-slate-300 font-jakarta flex items-center justify-center gap-1.5">
            <Volume2 className="w-3.5 h-3.5 text-[#C5A059]" />
            Clique para iniciar a reprodução imediata em HD (MP4)
          </p>
        </div>
      </div>
    </div>
  );
};

interface ProjectCardProps {
  project: ProjectItem;
  onOpenModal: (project: ProjectItem, defaultTab?: 'photos' | 'video') => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ project, onOpenModal }) => {
  const [photoIndex, setPhotoIndex] = useState(0);

  const photos = project.gallery && project.gallery.length > 0 
    ? project.gallery 
    : [project.imageUrl];

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.96, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: 15 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="bg-[#122038] border border-white/10 rounded-2xl overflow-hidden group hover:border-[#C5A059]/60 transition-all duration-300 flex flex-col justify-between shadow-xl hover:-translate-y-1 hover:shadow-2xl hover:shadow-[#C5A059]/10"
    >
      <div>
        <div className="relative h-56 sm:h-60 overflow-hidden bg-black/50 group/slide">
          <ManagedMedia
            mediaKey={`project:${project.id}:photo_${photoIndex}`}
            src={getAssetUrl(photos[photoIndex])}
            alt={`${project.title} - Foto ${photoIndex + 1}`}
            context="project_thumbnail"
            className="group-hover:scale-105 transition-transform duration-500 ease-out"
            containerClassName="w-full h-full"
            onError={handleStructuralPhotoError}
          />

          <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
            <span className="bg-[#0A1220]/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#C5A059]/40 text-[#C5A059] text-[10px] font-jakarta font-bold uppercase tracking-wider shadow-md">
              {project.categoryLabel}
            </span>
          </div>

          {(project.hasVideo || project.videoUrl) && (
            <div className="absolute top-3 right-3 z-10">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenModal(project, 'video');
                }}
                className="bg-amber-500 hover:bg-amber-400 text-black font-jakarta font-bold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 shadow-md transition-transform hover:scale-105 cursor-pointer"
              >
                <Play className="w-3 h-3 fill-black" />
                <span>Vídeo</span>
              </button>
            </div>
          )}

          {photos.length > 1 && (
            <>
              <button
                type="button"
                onClick={handlePrevPhoto}
                aria-label="Foto anterior"
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#122038]/80 hover:bg-[#C5A059] text-white hover:text-black flex items-center justify-center transition-all opacity-80 hover:opacity-100 z-10 cursor-pointer backdrop-blur-sm border border-[#C5A059]/30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleNextPhoto}
                aria-label="Próxima foto"
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-[#122038]/80 hover:bg-[#C5A059] text-white hover:text-black flex items-center justify-center transition-all opacity-80 hover:opacity-100 z-10 cursor-pointer backdrop-blur-sm border border-[#C5A059]/30"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 bg-[#0A1220]/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10">
                {photos.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPhotoIndex(idx);
                    }}
                    className={`h-1.5 rounded-full transition-all ${
                      idx === photoIndex
                        ? 'w-4 bg-[#C5A059]'
                        : 'w-1.5 bg-white/40 hover:bg-white'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>

        <div className="p-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-jakarta text-slate-300 border-b border-white/5 pb-2.5">
            <span className="flex items-center gap-1.5 font-medium text-[#C5A059]">
              <MapPin className="w-3.5 h-3.5 text-[#C5A059]" />
              <span>{project.location}</span>
            </span>
            {(project.year || project.area) && (
              <div className="flex items-center gap-3 text-slate-400">
                {project.year && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-[#C5A059]" /> {project.year}
                  </span>
                )}
                {project.area && (
                  <span className="flex items-center gap-1">
                    <Ruler className="w-3 h-3 text-[#C5A059]" /> {project.area}
                  </span>
                )}
              </div>
            )}
          </div>

          <h3 className="font-cinzel font-bold text-lg text-white group-hover:text-[#C5A059] transition-colors line-clamp-1">
            {project.title}
          </h3>

          <SmartText
            section="projects"
            text={project.description}
            className="font-jakarta text-xs text-slate-400 leading-relaxed"
          />
        </div>
      </div>

      <div className="p-5 pt-0 flex gap-2">
        <button
          type="button"
          onClick={() => onOpenModal(project, 'photos')}
          className="flex-1 py-2.5 px-4 rounded-xl bg-[#0A1220] hover:bg-[#C5A059] text-slate-200 hover:text-black border border-white/10 hover:border-[#C5A059] font-jakarta text-xs uppercase tracking-wider font-semibold transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"
        >
          <span>Ver Fotos e Detalhes</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {(project.hasVideo || project.videoUrl) && (
          <button
            type="button"
            onClick={() => onOpenModal(project, 'video')}
            title="Assistir Vídeo do Projeto"
            className="py-2.5 px-3 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-black border border-amber-500/30 transition-all duration-300 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <Video className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.article>
  );
};

export const Projects: React.FC = () => {
  const { content } = useSiteContent();
  const projectsContent = content.projects;
  const [projectsList, setProjectsList] = useState<ProjectItem[]>(PROJECTS_DATA);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('todos');
  const [activeGalleryIndex, setActiveGalleryIndex] = useState<number>(0);
  const [activeMediaTab, setActiveMediaTab] = useState<'photos' | 'video'>('photos');

  useEffect(() => {
    let isMounted = true;

    async function loadProjects() {
      try {
        setIsLoading(true);
        const data = await supabaseDatabase.getProjects();
        if (!isMounted) return;

        if (data && data.length > 0) {
          const mappedProjects: ProjectItem[] = data.map((item: any) => {
            const sortedImages = Array.isArray(item.project_images)
              ? [...item.project_images].sort((a: any, b: any) => (a.order_index ?? 0) - (b.order_index ?? 0))
              : [];

            const gallery = sortedImages.length > 0
              ? sortedImages.map((img: any) => img.image_url)
              : (item.image_url ? [item.image_url] : []);

            return {
              id: item.id,
              title: item.title || '',
              category: item.category || 'estrutural',
              categoryLabel: item.category_label || item.category || 'Projeto',
              location: item.location || 'Ariquemes - RO',
              year: item.year || undefined,
              area: item.area || undefined,
              status: item.status || 'Concluído',
              description: item.description || '',
              challenge: item.challenge || '',
              solution: item.solution || '',
              imageUrl: item.image_url || gallery[0] || '',
              gallery: gallery,
              highlights: Array.isArray(item.highlights) ? item.highlights : [],
              servicesExecuted: Array.isArray(item.services_executed) ? item.services_executed : [],
              videoUrl: item.video_url || undefined,
              videoTitle: item.video_title || undefined,
              hasVideo: item.has_video || Boolean(item.video_url),
            };
          });

          setProjectsList(mappedProjects);
        } else {
          console.info('[Projects] Nenhuma obra encontrada no Supabase. Utilizando fallback temporário PROJECTS_DATA.');
          setProjectsList(PROJECTS_DATA);
        }
      } catch (err) {
        if (!isMounted) return;
        console.error('[Projects] Erro ao carregar projetos do Supabase:', err);
        setProjectsList(PROJECTS_DATA);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadProjects();

    return () => {
      isMounted = false;
    };
  }, []);

  const categories = [
    { id: 'todos', label: 'Todos os Projetos' },
    { id: 'estrutural', label: 'Projetos Estruturais' },
    { id: 'metalicas', label: 'Estruturas Metálicas' },
    { id: 'agronegocio', label: 'Agronegócio' },
    { id: 'industriais', label: 'Obras Industriais' },
    { id: 'consultoria', label: 'Consultorias Técnicas' },
    { id: 'fiscalizacao', label: 'Fiscalizações' },
    { id: 'laudos', label: 'Laudos Técnicos' },
  ];

  const filteredProjects = activeCategory === 'todos'
    ? projectsList
    : projectsList.filter(p => p.category === activeCategory);

  const handleOpenModal = (project: ProjectItem, defaultTab: 'photos' | 'video' = 'photos') => {
    setSelectedProject(project);
    setActiveGalleryIndex(0);
    setActiveMediaTab(defaultTab);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedProject) {
        setSelectedProject(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProject]);

  return (
    <section id="projetos" className="py-20 md:py-28 bg-[#0A1220] relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <SectionHeader
          badgeText={projectsContent.badgeText || "Portfólio de Engenharia"}
          title={projectsContent.title || "Projetos Executados e"}
          highlightTitle={projectsContent.highlightTitle || "Tipos de Obras"}
          subtitle={projectsContent.subtitle || "Explore abaixo os projetos desenvolvidos com localização, fotos em galeria deslizante e informações técnicas completas."}
        />

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-12" role="tablist" aria-label="Tipos de projetos">
          {categories.map((cat) => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => setActiveCategory(cat.id)}
                className={`relative px-4 py-2.5 rounded-full font-jakarta text-xs uppercase tracking-wider transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C5A059] ${
                  isActive
                    ? 'text-black font-bold shadow-lg shadow-[#C5A059]/20'
                    : 'bg-[#122038] text-slate-300 hover:text-[#C5A059] border border-white/10 hover:border-[#C5A059]/30'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeCategoryPill"
                    className="absolute inset-0 bg-[#C5A059] rounded-full z-0"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{cat.label}</span>
              </button>
            );
          })}
        </div>

        <motion.div 
          layout 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
        >
          <AnimatePresence mode="popLayout">
            {filteredProjects.map((project) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onOpenModal={handleOpenModal} 
              />
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-16 bg-[#122038] rounded-2xl border border-white/10 space-y-4">
            <Building2 className="w-12 h-12 text-[#C5A059] mx-auto opacity-50" />
            <h4 className="font-cinzel text-xl text-white">Nenhum projeto encontrado nesta categoria</h4>
            <button
              type="button"
              onClick={() => setActiveCategory('todos')}
              className="px-6 py-2 rounded-full bg-[#C5A059] text-black font-jakarta font-bold text-xs uppercase tracking-wider"
            >
              Ver Todos os Projetos
            </button>
          </div>
        )}

      </div>

      <Modal
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        title={selectedProject?.title}
        maxWidth="4xl"
      >
        {selectedProject && (
          <div className="space-y-6 text-slate-300 font-jakarta">
            
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <button
                type="button"
                onClick={() => setActiveMediaTab('photos')}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-jakarta uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeMediaTab === 'photos'
                    ? 'bg-[#C5A059] text-black shadow-md'
                    : 'bg-[#0A1220] text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                <ImageIcon className="w-4 h-4" />
                <span>Fotos do Projeto ({selectedProject.gallery.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveMediaTab('video')}
                className={`px-4 py-2 rounded-xl text-xs font-bold font-jakarta uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer ${
                  activeMediaTab === 'video'
                    ? 'bg-amber-500 text-black shadow-md'
                    : 'bg-[#0A1220] text-slate-400 hover:text-white border border-white/10'
                }`}
              >
                <Video className="w-4 h-4" />
                <span>Espaço para Vídeo</span>
              </button>
            </div>

            {activeMediaTab === 'photos' ? (
              <div className="space-y-3">
                <div className="relative h-64 sm:h-96 rounded-2xl overflow-hidden border border-[#C5A059]/30 shadow-2xl bg-black">
                  <ManagedMedia
                    mediaKey={`project:${selectedProject.id}:gallery_${activeGalleryIndex}`}
                    src={getAssetUrl(selectedProject.gallery[activeGalleryIndex] || selectedProject.imageUrl)}
                    alt={`Galeria ${activeGalleryIndex + 1} - ${selectedProject.title}`}
                    context="project_gallery"
                    containerClassName="w-full h-full"
                    onError={handleStructuralPhotoError}
                  />
                  
                  {selectedProject.gallery.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setActiveGalleryIndex(prev => prev === 0 ? selectedProject.gallery.length - 1 : prev - 1)}
                        className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-[#C5A059] text-white hover:text-black flex items-center justify-center transition-all cursor-pointer"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setActiveGalleryIndex(prev => prev === selectedProject.gallery.length - 1 ? 0 : prev + 1)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/60 hover:bg-[#C5A059] text-white hover:text-black flex items-center justify-center transition-all cursor-pointer"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}

                  <div className="absolute top-4 left-4 bg-[#0A1220]/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#C5A059]/40 text-[#C5A059] text-xs font-bold uppercase tracking-wider">
                    {selectedProject.categoryLabel}
                  </div>

                  <div className="absolute bottom-4 right-4 bg-[#0A1220]/80 backdrop-blur-md px-3 py-1 rounded-full text-slate-300 text-xs font-medium">
                    Foto {activeGalleryIndex + 1} de {selectedProject.gallery.length}
                  </div>
                </div>

                {selectedProject.gallery.length > 1 && (
                  <div className="flex items-center gap-3 overflow-x-auto pb-1">
                    {selectedProject.gallery.map((imgUrl, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setActiveGalleryIndex(idx)}
                        className={`relative w-20 h-16 rounded-lg overflow-hidden border-2 transition-all shrink-0 cursor-pointer ${
                          activeGalleryIndex === idx
                            ? 'border-[#C5A059] scale-105'
                            : 'border-white/10 opacity-60 hover:opacity-100'
                        }`}
                      >
                        <img
                          src={getAssetUrl(imgUrl)}
                          alt={`Miniatura ${idx + 1}`}
                          loading="lazy"
                          decoding="async"
                          onError={handleStructuralPhotoError}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {selectedProject.videoUrl ? (
                  <LazyVideoPlayer
                    videoUrl={selectedProject.videoUrl}
                    posterUrl={selectedProject.imageUrl}
                    title={selectedProject.videoTitle || `Vídeo do projeto ${selectedProject.title}`}
                  />
                ) : (
                  <div className="relative aspect-video rounded-2xl overflow-hidden border border-dashed border-white/20 bg-[#0A1220] flex flex-col items-center justify-center p-6 text-center space-y-3">
                    <Video className="w-12 h-12 text-[#C5A059]" />
                    <div className="space-y-1 max-w-md">
                      <h5 className="font-cinzel font-bold text-white text-base">
                        Local para Registro em Vídeo ({selectedProject.categoryLabel})
                      </h5>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#0A1220] rounded-xl border border-white/10 text-xs">
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Localidade / Cidade</span>
                <span className="text-white font-semibold flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-[#C5A059]" /> {selectedProject.location}
                </span>
              </div>
              {selectedProject.year && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Ano / Status</span>
                  <span className="text-white font-semibold flex items-center gap-1 mt-0.5">
                    <Calendar className="w-3.5 h-3.5 text-[#C5A059]" /> {selectedProject.year} ({selectedProject.status})
                  </span>
                </div>
              )}
              {selectedProject.area && (
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Área Construída</span>
                  <span className="text-white font-semibold flex items-center gap-1 mt-0.5">
                    <Ruler className="w-3.5 h-3.5 text-[#C5A059]" /> {selectedProject.area}
                  </span>
                </div>
              )}
              <div>
                <span className="text-slate-400 block text-[10px] uppercase tracking-wider">Registro Técnico</span>
                <span className="text-[#C5A059] font-bold flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5" /> ART CREA-RO
                </span>
              </div>
            </div>

            <div>
              <SmartText
                section="projects"
                text={selectedProject.description}
                className="text-sm leading-relaxed text-slate-300 bg-[#0A1220]/50 p-4 rounded-xl border border-white/5"
              />
            </div>

            {selectedProject.servicesExecuted && selectedProject.servicesExecuted.length > 0 && (
              <div>
                <h4 className="font-cinzel font-bold text-white text-sm mb-2 text-[#C5A059]">
                  Serviços Executados no Projeto
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {selectedProject.servicesExecuted.map((service, idx) => (
                    <li key={idx} className="flex items-start gap-2 bg-[#0A1220] p-2.5 rounded-lg border border-white/5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#C5A059] shrink-0 mt-0.5" />
                      <span className="text-slate-200">{service}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400 text-center sm:text-left">
                <p className="font-medium text-slate-300">Deseja um projeto semelhante para sua obra?</p>
              </div>

              <a
                href={getWhatsAppUrl(`Olá, Engª Jucélia Santana! Gostaria de orçar um projeto semelhante a: "${selectedProject.title}" em Rondônia.`)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto"
              >
                <Button size="md" variant="gold" icon={<Phone className="w-4 h-4" />} className="w-full sm:w-auto justify-center">
                  Consultar Orçamento
                </Button>
              </a>
            </div>

          </div>
        )}
      </Modal>

    </section>
  );
};
