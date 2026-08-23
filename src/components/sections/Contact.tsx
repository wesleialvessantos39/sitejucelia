// /src/components/sections/Contact.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { SectionHeader } from '../ui/SectionHeader';
import { useSiteContent } from '../../context/SiteContentContext';
import { useContactSettings } from '../../context/ContactSettingsContext';
import { 
  COMPANY_INFO, 
  getGmailComposeUrl, 
  getOutlookComposeUrl, 
  getOutlookOfficeComposeUrl,
  getMailtoUrl 
} from '../../data/companyData';
import { Button } from '../ui/Button';
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  MessageSquare, 
  Award, 
  ExternalLink,
  ShieldCheck,
  Building2,
  Sparkles,
  RefreshCw,
  User,
  Compass,
  FileText,
  ArrowRight
} from 'lucide-react';
import { supabaseDatabase } from '../../services/supabaseDatabase';

interface FormState {
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  phone?: string;
  subject?: string;
  message?: string;
}

export const Contact: React.FC = () => {
  const { content } = useSiteContent();
  const contactContent = content.contact;
  const { settings: contactSettings, getWhatsAppHref, getPhoneHref, formattedPhone, formattedWhatsApp } = useContactSettings();

  // Form State
  const [formData, setFormData] = useState<FormState>({
    name: '',
    email: '',
    phone: '',
    subject: 'Projetos Estruturais e Cálculo',
    message: ''
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Phone Masking Utility
  const formatPhone = (value: string): string => {
    const digits = value.replace(/\D/g, '').slice(0, 11);
    if (!digits) return '';
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    if (digits.length <= 10) {
      return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
    }
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  };

  // Field Validation Helper
  const validateField = (name: keyof FormState, value: string): string | undefined => {
    switch (name) {
      case 'name':
        if (!value.trim()) return 'Por favor, informe seu nome completo ou empresa.';
        if (value.trim().length < 3) return 'O nome deve conter pelo menos 3 caracteres.';
        return undefined;

      case 'email':
        if (!value.trim()) return 'Por favor, informe seu e-mail de contato.';
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value.trim())) return 'Informe um endereço de e-mail válido.';
        return undefined;

      case 'phone':
        const phoneDigits = value.replace(/\D/g, '');
        if (!phoneDigits) return 'Por favor, informe seu telefone ou WhatsApp.';
        if (phoneDigits.length < 10) return 'Informe um número com DDD válido (mínimo 10 dígitos).';
        return undefined;

      case 'subject':
        if (!value.trim()) return 'Selecione o assunto ou serviço de seu interesse.';
        return undefined;

      case 'message':
        if (!value.trim()) return 'Por favor, descreva sucintamente sua demanda ou projeto.';
        if (value.trim().length < 10) return 'A mensagem deve conter ao menos 10 caracteres explicativos.';
        return undefined;

      default:
        return undefined;
    }
  };

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {
      name: validateField('name', formData.name),
      email: validateField('email', formData.email),
      phone: validateField('phone', formData.phone),
      subject: validateField('subject', formData.subject),
      message: validateField('message', formData.message)
    };

    setErrors(newErrors);
    return !Object.values(newErrors).some(Boolean);
  };

  // Input change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    let updatedValue = value;
    if (name === 'phone') {
      updatedValue = formatPhone(value);
    }

    setFormData(prev => ({ ...prev, [name]: updatedValue }));

    // Real-time validation if field was touched
    if (touched[name]) {
      const errorMsg = validateField(name as keyof FormState, updatedValue);
      setErrors(prev => ({ ...prev, [name]: errorMsg }));
    }
  };

  // Input Blur Handler
  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTouched(prev => ({ ...prev, [name]: true }));
    const errorMsg = validateField(name as keyof FormState, value);
    setErrors(prev => ({ ...prev, [name]: errorMsg }));
  };

  // Form Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Mark all as touched
    setTouched({
      name: true,
      email: true,
      phone: true,
      subject: true,
      message: true
    });

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      await supabaseDatabase.sendContactMessage({
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim() || null,
        subject: formData.subject,
        message: formData.message.trim(),
        status: 'new',
        priority: 'normal',
        origin: 'website_form',
      });
    } catch (err) {
      console.warn('[Contact] Erro ao enviar para o Supabase, procedendo com confirmação local:', err);
    } finally {
      setIsSubmitting(false);
      setSubmitted(true);
    }
  };

  // Direct WhatsApp dispatch helper
  const handleDirectWhatsApp = () => {
    const text = `*SOLICITAÇÃO DE ORÇAMENTO - JUCÉLIA SANTANA ENGENHARIA*\n\n` +
      `*Nome:* ${formData.name || 'Não informado'}\n` +
      `*Telefone:* ${formData.phone || 'Não informado'}\n` +
      `*E-mail:* ${formData.email || 'Não informado'}\n` +
      `*Assunto/Serviço:* ${formData.subject}\n` +
      `*Mensagem:* ${formData.message || 'Gostaria de solicitar uma análise técnica para meu projeto.'}`;

    window.open(`https://wa.me/${COMPANY_INFO.whatsapp}?text=${encodeURIComponent(text)}`, '_blank');
  };

  // Reset Form
  const handleReset = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: 'Projetos Estruturais e Cálculo',
      message: ''
    });
    setTouched({});
    setErrors({});
    setSubmitted(false);
  };

  // Google Maps Search Query URL
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(COMPANY_INFO.address)}`;
  const googleMapsEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(COMPANY_INFO.address)}&t=&z=15&ie=UTF8&iwloc=&output=embed`;

  return (
    <section 
      id="contato" 
      className="py-20 md:py-28 bg-[#0A1220] relative overflow-hidden"
      aria-label="Seção de Contato Institucional e Atendimento"
    >
      {/* Radial Gold Ambient Glow */}
      <div className="absolute top-1/4 right-0 w-[500px] h-[500px] bg-[#C5A059]/10 rounded-full filter blur-[140px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Header Section */}
        <SectionHeader
          badgeText={contactContent.badgeText || "Atendimento Personalizado e Consultoria"}
          title={contactContent.title || "Fale com a"}
          highlightTitle={contactContent.highlightTitle || "Engª Jucélia Santana"}
          subtitle={contactContent.subtitle || "Solicite um orçamento para seu projeto estrutural, laudo pericial ou consultoria técnica. Resposta ágil com o rigor que seu empreendimento exige."}
        />

        {/* Two Column Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 mt-12 items-start">
          
          {/* ========================================================= */}
          {/* LEFT COLUMN: COMPANY INFO, WHATSAPP DIRECT & GOOGLE MAPS   */}
          {/* ========================================================= */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-5 space-y-6"
          >
            {/* Company Info Box */}
            <div className="bg-[#122038] border border-[#C5A059]/30 rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
              
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div>
                  <h3 className="font-cinzel font-bold text-xl text-white">
                    Canais de Atendimento
                  </h3>
                  <p className="text-slate-400 font-jakarta text-xs mt-0.5">
                    Atendimento presencial e remoto especializado
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 border border-[#C5A059]/30 flex items-center justify-center text-[#C5A059] shrink-0">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>

              {/* Info Items List */}
              <div className="space-y-4 font-jakarta text-xs sm:text-sm">
                
                {/* Address */}
                <div className="flex items-start gap-3.5 group">
                  <div className="w-9 h-9 rounded-lg bg-[#0A1220] border border-[#C5A059]/30 group-hover:border-[#C5A059] flex items-center justify-center text-[#C5A059] shrink-0 transition-colors shadow-inner mt-0.5">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#C5A059] block">
                      Endereço e Localização
                    </span>
                    <span className="text-slate-200 leading-relaxed block font-medium">
                      {COMPANY_INFO.address}
                    </span>
                    <span className="text-slate-400 text-[11px] block">
                      Ariquemes • Estado de Rondônia — CEP 76870-000
                    </span>
                  </div>
                </div>

                {/* Phone & WhatsApp */}
                <div className="flex items-start gap-3.5 group">
                  <div className="w-9 h-9 rounded-lg bg-[#0A1220] border border-[#C5A059]/30 group-hover:border-[#C5A059] flex items-center justify-center text-[#C5A059] shrink-0 transition-colors shadow-inner mt-0.5">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#C5A059] block">
                      Telefone e WhatsApp Comercial
                    </span>
                    <a 
                      href={`tel:${COMPANY_INFO.phone.replace(/\D/g, '')}`} 
                      className="text-slate-200 hover:text-[#C5A059] font-bold block transition-colors"
                    >
                      {COMPANY_INFO.phone}
                    </a>
                  </div>
                </div>

                {/* Email Contacts Block: Outlook & Gmail */}
                <div className="space-y-3 pt-2 border-t border-white/5">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-[#C5A059] block flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-[#C5A059]" />
                    Atendimento por E-mail (Outlook e Gmail)
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Outlook Contact Card */}
                    <div className="p-3 bg-[#0A1220] border border-blue-500/30 rounded-xl space-y-2 hover:border-blue-400 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                          <Mail className="w-3 h-3" /> Outlook
                        </span>
                        <span className="text-[9px] bg-blue-500/10 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30 font-mono">Oficial</span>
                      </div>
                      <span className="text-xs text-white font-semibold block truncate" title={COMPANY_INFO.emailOutlook}>
                        {COMPANY_INFO.emailOutlook}
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <a
                          href={getOutlookComposeUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-1.5 px-2 bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer border border-blue-500/30"
                          title="Abrir no Navegador (Google Chrome / Edge)"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Navegador</span>
                        </a>
                        <a
                          href={getMailtoUrl(COMPANY_INFO.emailOutlook)}
                          className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer border border-white/10"
                          title="Abrir no Aplicativo do Dispositivo (Mobile / App)"
                        >
                          <Mail className="w-3 h-3" />
                          <span>App</span>
                        </a>
                      </div>
                    </div>

                    {/* Gmail Contact Card */}
                    <div className="p-3 bg-[#0A1220] border border-red-500/30 rounded-xl space-y-2 hover:border-red-400 transition-all">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-red-400 uppercase tracking-wider flex items-center gap-1">
                          <Mail className="w-3 h-3" /> Gmail
                        </span>
                        <span className="text-[9px] bg-red-500/10 text-red-300 px-1.5 py-0.5 rounded border border-red-500/30 font-mono">Google</span>
                      </div>
                      <span className="text-xs text-white font-semibold block truncate" title={COMPANY_INFO.emailGmail}>
                        {COMPANY_INFO.emailGmail}
                      </span>
                      <div className="grid grid-cols-2 gap-1.5 pt-1">
                        <a
                          href={getGmailComposeUrl()}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-1.5 px-2 bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer border border-red-500/30"
                          title="Abrir no Google / Navegador Web"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Navegador</span>
                        </a>
                        <a
                          href={getMailtoUrl(COMPANY_INFO.emailGmail)}
                          className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer border border-white/10"
                          title="Abrir no Aplicativo do Dispositivo (Mobile / App)"
                        >
                          <Mail className="w-3 h-3" />
                          <span>App</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Working Hours */}
                <div className="flex items-start gap-3.5 group">
                  <div className="w-9 h-9 rounded-lg bg-[#0A1220] border border-[#C5A059]/30 group-hover:border-[#C5A059] flex items-center justify-center text-[#C5A059] shrink-0 transition-colors shadow-inner mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#C5A059] block">
                      Horário de Funcionamento
                    </span>
                    <span className="text-slate-200 block font-medium">
                      {COMPANY_INFO.hours}
                    </span>
                  </div>
                </div>

                {/* Highlight Proposal Portal Card */}
                <div className="p-4 bg-amber-950/30 border border-amber-500/40 rounded-xl space-y-2.5">
                  <div className="flex items-center gap-2 text-amber-400">
                    <FileText className="w-5 h-5 shrink-0" />
                    <span className="font-bold text-xs uppercase tracking-wider font-jakarta">
                      Pré-Dimensionamento Estrutural com Anexo
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 font-jakarta leading-relaxed">
                    Possui projeto arquitetônico, laudo de sondagem ou croquis em PDF/imagem? Envie através do nosso portal para triagem técnica personalizada.
                  </p>
                  <Link
                    to="/solicitar-proposta"
                    className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-jakarta text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 cursor-pointer"
                  >
                    <span>Acessar Portal de Pré-Dimensionamento</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>

                {/* CREA Credential Tag */}
                <div className="flex items-start gap-3.5 group">
                  <div className="w-9 h-9 rounded-lg bg-[#0A1220] border border-[#C5A059]/30 group-hover:border-[#C5A059] flex items-center justify-center text-[#C5A059] shrink-0 transition-colors shadow-inner mt-0.5">
                    <Award className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-[#C5A059] block">
                      Registro Profissional
                    </span>
                    <span className="text-slate-200 font-bold block">
                      {contactSettings.crea_registration || COMPANY_INFO.crea}
                    </span>
                  </div>
                </div>

              </div>

              {/* Highlight WhatsApp Direct Action Banner */}
              <div className="p-4 bg-emerald-950/40 border border-emerald-500/40 rounded-xl space-y-3">
                <div className="flex items-center gap-2.5 text-emerald-400">
                  <MessageSquare className="w-5 h-5 shrink-0" />
                  <span className="font-bold text-xs uppercase tracking-wider font-jakarta">
                    Atendimento Rápido via WhatsApp
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 font-jakarta leading-relaxed">
                  Prefere resposta imediata? Fale diretamente com o escritório pelo WhatsApp para tirar dúvidas rápidas ou consultar prazos de laudos.
                </p>
                <a
                  href={getWhatsAppHref("Olá, Engª Jucélia Santana! Gostaria de conversar sobre um projeto de engenharia.")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-jakarta text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-lg cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 fill-current" />
                  <span>Falar no WhatsApp ({formattedWhatsApp})</span>
                </a>
              </div>

            </div>

            {/* Google Maps Interactive Component */}
            <div className="bg-[#122038] border border-white/10 rounded-2xl p-5 space-y-3 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-white font-cinzel font-bold text-sm">
                  <Compass className="w-4 h-4 text-[#C5A059]" />
                  <span>Localização no Mapa</span>
                </div>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] font-jakarta text-[#C5A059] hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Abrir no Google Maps</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* Map Iframe Wrapper */}
              <div className="relative h-56 rounded-xl overflow-hidden border border-white/10 bg-[#0A1220] group">
                <iframe
                  title="Mapa de Localização - Jucélia Santana Engenharia Civil"
                  src={googleMapsEmbedUrl}
                  className="w-full h-full border-0 filter grayscale contrast-125 opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  aria-label="Mapa interativo da localização do escritório em Ariquemes RO"
                />
                
                {/* Address Pin Overlay Badge */}
                <div className="absolute bottom-3 left-3 right-3 bg-[#0A1220]/90 backdrop-blur-md px-3 py-2 rounded-lg border border-[#C5A059]/40 text-xs text-slate-300 font-jakarta flex items-center justify-between shadow-lg">
                  <span className="truncate pr-2 font-medium">
                    Ariquemes - RO • Av. dos Diamantes
                  </span>
                  <a
                    href={googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 px-2.5 py-1 bg-[#C5A059] text-black rounded font-bold text-[10px] uppercase hover:bg-[#b08e4a] transition-colors"
                  >
                    Como Chegar
                  </a>
                </div>
              </div>
            </div>

          </motion.div>

          {/* ========================================================= */}
          {/* RIGHT COLUMN: MODERN FORM WITH REAL-TIME VALIDATION        */}
          {/* ========================================================= */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-7"
          >
            <div className="bg-[#122038] border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl relative">
              
              {submitted ? (
                /* Success Feedback State */
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center py-10 space-y-6 font-jakarta"
                >
                  <div className="w-16 h-16 bg-[#C5A059]/20 border-2 border-[#C5A059] text-[#C5A059] rounded-full flex items-center justify-center mx-auto shadow-xl">
                    <CheckCircle2 className="w-8 h-8 animate-bounce" />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-cinzel font-bold text-2xl text-white">
                      Solicitação Registrada com Sucesso!
                    </h3>
                    <p className="text-slate-300 text-sm max-w-md mx-auto leading-relaxed">
                      Agradecemos pelo envio. Nossa equipe analisará sua solicitação e retornará o contato em até <strong className="text-[#C5A059]">24 horas úteis</strong>.
                    </p>
                  </div>

                  {/* Summary Box */}
                  <div className="p-4 bg-[#0A1220] border border-white/10 rounded-xl text-left text-xs text-slate-300 space-y-2 max-w-md mx-auto">
                    <div className="flex justify-between border-b border-white/10 pb-1.5">
                      <span className="text-slate-400">Cliente:</span>
                      <span className="font-bold text-white">{formData.name}</span>
                    </div>
                    <div className="flex justify-between border-b border-white/10 pb-1.5">
                      <span className="text-slate-400">Serviço:</span>
                      <span className="font-bold text-[#C5A059]">{formData.subject}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Contato:</span>
                      <span>{formData.phone} • {formData.email}</span>
                    </div>
                  </div>

                  {/* Direct Email Options with Form Context */}
                  <div className="p-3.5 bg-[#0A1220] border border-white/10 rounded-xl space-y-2.5 max-w-lg mx-auto">
                    <span className="text-[10px] uppercase font-bold text-[#C5A059] block tracking-wider text-center">
                      Envie a mensagem diretamente pelo seu provedor de e-mail:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Outlook Options */}
                      <div className="p-2.5 bg-blue-950/20 border border-blue-500/30 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-blue-400">
                          <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Outlook</span>
                          <span className="text-[10px] text-slate-400 font-normal">Oficial</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <a
                            href={getOutlookComposeUrl(
                              `Solicitação de Orçamento: ${formData.subject} - ${formData.name}`,
                              `Olá, Engª Jucélia Santana!\r\n\r\nEncaminho os detalhes da minha solicitação de orçamento:\r\n\r\n- Nome / Cliente: ${formData.name}\r\n- Telefone / WhatsApp: ${formData.phone}\r\n- E-mail de Contato: ${formData.email}\r\n- Serviço de Interesse: ${formData.subject}\r\n- Descrição da Demanda:\r\n${formData.message}\r\n\r\nAtenciosamente,`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-1.5 px-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                            title="Abrir no Navegador (Google Chrome / Edge)"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Navegador</span>
                          </a>
                          <a
                            href={getMailtoUrl(
                              COMPANY_INFO.emailOutlook,
                              `Solicitação de Orçamento: ${formData.subject} - ${formData.name}`,
                              `Olá, Engª Jucélia Santana!\r\n\r\nEncaminho os detalhes da minha solicitação de orçamento:\r\n\r\n- Nome / Cliente: ${formData.name}\r\n- Telefone / WhatsApp: ${formData.phone}\r\n- E-mail de Contato: ${formData.email}\r\n- Serviço de Interesse: ${formData.subject}\r\n- Descrição da Demanda:\r\n${formData.message}\r\n\r\nAtenciosamente,`
                            )}
                            className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-bold transition-all flex items-center justify-center gap-1 border border-white/10 cursor-pointer"
                            title="Abrir no App do Dispositivo"
                          >
                            <Mail className="w-3 h-3" />
                            <span>App</span>
                          </a>
                        </div>
                      </div>

                      {/* Gmail Options */}
                      <div className="p-2.5 bg-red-950/20 border border-red-500/30 rounded-lg space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-bold text-red-400">
                          <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> Gmail</span>
                          <span className="text-[10px] text-slate-400 font-normal">Google</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 pt-1">
                          <a
                            href={getGmailComposeUrl(
                              `Solicitação de Orçamento: ${formData.subject} - ${formData.name}`,
                              `Olá, Engª Jucélia Santana!\n\nEncaminho os detalhes da minha solicitação de orçamento:\n\n- Nome / Cliente: ${formData.name}\n- Telefone / WhatsApp: ${formData.phone}\n- E-mail de Contato: ${formData.email}\n- Serviço de Interesse: ${formData.subject}\n- Descrição da Demanda:\n${formData.message}\n\nAtenciosamente,`
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="py-1.5 px-2 bg-red-600 hover:bg-red-500 text-white rounded text-[11px] font-bold transition-all flex items-center justify-center gap-1 shadow-sm cursor-pointer"
                            title="Abrir no Google / Navegador Web"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Navegador</span>
                          </a>
                          <a
                            href={getMailtoUrl(
                              COMPANY_INFO.emailGmail,
                              `Solicitação de Orçamento: ${formData.subject} - ${formData.name}`,
                              `Olá, Engª Jucélia Santana!\r\n\r\nEncaminho os detalhes da minha solicitação de orçamento:\r\n\r\n- Nome / Cliente: ${formData.name}\r\n- Telefone / WhatsApp: ${formData.phone}\r\n- E-mail de Contato: ${formData.email}\r\n- Serviço de Interesse: ${formData.subject}\r\n- Descrição da Demanda:\r\n${formData.message}\r\n\r\nAtenciosamente,`
                            )}
                            className="py-1.5 px-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-bold transition-all flex items-center justify-center gap-1 border border-white/10 cursor-pointer"
                            title="Abrir no App do Dispositivo"
                          >
                            <Mail className="w-3 h-3" />
                            <span>App</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button
                      variant="gold"
                      size="md"
                      onClick={handleDirectWhatsApp}
                      icon={<MessageSquare className="w-4 h-4" />}
                      className="w-full sm:w-auto font-bold uppercase tracking-wider text-xs"
                    >
                      Acelerar Atendimento via WhatsApp
                    </Button>

                    <button
                      type="button"
                      onClick={handleReset}
                      className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-[#0A1220] hover:bg-white/10 text-slate-300 border border-white/10 font-jakarta text-xs uppercase font-bold tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Enviar Nova Mensagem</span>
                    </button>
                  </div>

                </motion.div>
              ) : (
                /* Active Form */
                <form onSubmit={handleSubmit} noValidate className="space-y-6">
                  
                  <div className="border-b border-white/10 pb-4">
                    <h3 className="font-cinzel font-bold text-xl text-white flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-[#C5A059]" />
                      <span>{contactContent.formTitle || "Formulário de Solicitação Técnica"}</span>
                    </h3>
                    <p className="text-slate-400 font-jakarta text-xs mt-1">
                      {contactContent.formSubtitle || "Preencha os dados abaixo para receber uma proposta customizada para seu projeto."}
                    </p>
                  </div>

                  {/* Field: Nome */}
                  <div className="space-y-1.5">
                    <label 
                      htmlFor="contact-name" 
                      className="block text-xs font-jakarta uppercase font-bold text-slate-300 tracking-wider flex items-center justify-between"
                    >
                      <span>Nome Completo / Empresa <span className="text-[#C5A059]">*</span></span>
                      {touched.name && !errors.name && (
                        <span className="text-emerald-400 text-[10px] flex items-center gap-1 font-normal">
                          <CheckCircle2 className="w-3 h-3" /> Válido
                        </span>
                      )}
                    </label>
                    <div className="relative">
                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        aria-invalid={!!errors.name}
                        aria-describedby={errors.name ? 'contact-name-error' : undefined}
                        placeholder="Ex: João Silva ou Construtora Rondônia"
                        className={`w-full bg-[#0A1220] border rounded-xl px-4 py-3 text-sm text-white focus:outline-none font-jakarta transition-all ${
                          touched.name && errors.name
                            ? 'border-red-500 focus:ring-2 focus:ring-red-500/50'
                            : 'border-white/10 focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/30'
                        }`}
                      />
                      <User className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
                    </div>
                    {touched.name && errors.name && (
                      <p id="contact-name-error" className="text-red-400 text-xs font-jakarta flex items-center gap-1 pt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.name}</span>
                      </p>
                    )}
                  </div>

                  {/* Grid 2 Cols: E-mail e Telefone */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    
                    {/* Field: E-mail */}
                    <div className="space-y-1.5">
                      <label 
                        htmlFor="contact-email" 
                        className="block text-xs font-jakarta uppercase font-bold text-slate-300 tracking-wider flex items-center justify-between"
                      >
                        <span>E-mail <span className="text-[#C5A059]">*</span></span>
                        {touched.email && !errors.email && (
                          <span className="text-emerald-400 text-[10px] flex items-center gap-1 font-normal">
                            <CheckCircle2 className="w-3 h-3" /> Válido
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          id="contact-email"
                          name="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          aria-invalid={!!errors.email}
                          aria-describedby={errors.email ? 'contact-email-error' : undefined}
                          placeholder="seuemail@dominio.com.br"
                          className={`w-full bg-[#0A1220] border rounded-xl px-4 py-3 text-sm text-white focus:outline-none font-jakarta transition-all ${
                            touched.email && errors.email
                              ? 'border-red-500 focus:ring-2 focus:ring-red-500/50'
                              : 'border-white/10 focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/30'
                          }`}
                        />
                        <Mail className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
                      </div>
                      {touched.email && errors.email && (
                        <p id="contact-email-error" className="text-red-400 text-xs font-jakarta flex items-center gap-1 pt-0.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.email}</span>
                        </p>
                      )}
                    </div>

                    {/* Field: Telefone com Máscara */}
                    <div className="space-y-1.5">
                      <label 
                        htmlFor="contact-phone" 
                        className="block text-xs font-jakarta uppercase font-bold text-slate-300 tracking-wider flex items-center justify-between"
                      >
                        <span>Telefone / WhatsApp <span className="text-[#C5A059]">*</span></span>
                        {touched.phone && !errors.phone && (
                          <span className="text-emerald-400 text-[10px] flex items-center gap-1 font-normal">
                            <CheckCircle2 className="w-3 h-3" /> Válido
                          </span>
                        )}
                      </label>
                      <div className="relative">
                        <input
                          id="contact-phone"
                          name="phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          aria-invalid={!!errors.phone}
                          aria-describedby={errors.phone ? 'contact-phone-error' : undefined}
                          placeholder="(69) 99208-6883"
                          className={`w-full bg-[#0A1220] border rounded-xl px-4 py-3 text-sm text-white focus:outline-none font-jakarta transition-all ${
                            touched.phone && errors.phone
                              ? 'border-red-500 focus:ring-2 focus:ring-red-500/50'
                              : 'border-white/10 focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/30'
                          }`}
                        />
                        <Phone className="w-4 h-4 text-slate-500 absolute right-3.5 top-3.5 pointer-events-none" />
                      </div>
                      {touched.phone && errors.phone && (
                        <p id="contact-phone-error" className="text-red-400 text-xs font-jakarta flex items-center gap-1 pt-0.5">
                          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                          <span>{errors.phone}</span>
                        </p>
                      )}
                    </div>

                  </div>

                  {/* Field: Assunto / Serviço Desejado */}
                  <div className="space-y-1.5">
                    <label 
                      htmlFor="contact-subject" 
                      className="block text-xs font-jakarta uppercase font-bold text-slate-300 tracking-wider"
                    >
                      Assunto / Serviço Principal <span className="text-[#C5A059]">*</span>
                    </label>
                    <select
                      id="contact-subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      className="w-full bg-[#0A1220] border border-white/10 focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/30 rounded-xl px-4 py-3 text-sm text-white focus:outline-none font-jakarta transition-all cursor-pointer"
                    >
                      <option value="Projetos Estruturais e Cálculo">Projetos Estruturais e Cálculo (NBR 6118 / 8800)</option>
                      <option value="Laudos Técnicos e Perícias">Laudos Periciais, Inspeções e Vistorias</option>
                      <option value="Engenharia para o Agronegócio">Engenharia para o Agronegócio (Galpões/Silos)</option>
                      <option value="Gestão e Fiscalização de Obras">Gestão e Fiscalização de Obras</option>
                      <option value="Compatibilização de Projetos">Compatibilização de Projetos</option>
                      <option value="Outros Assuntos">Outros Assuntos / Consultoria Especializada</option>
                    </select>
                  </div>

                  {/* Field: Mensagem */}
                  <div className="space-y-1.5">
                    <label 
                      htmlFor="contact-message" 
                      className="block text-xs font-jakarta uppercase font-bold text-slate-300 tracking-wider flex items-center justify-between"
                    >
                      <span>Descrição do Projeto / Mensagem <span className="text-[#C5A059]">*</span></span>
                      {touched.message && !errors.message && (
                        <span className="text-emerald-400 text-[10px] flex items-center gap-1 font-normal">
                          <CheckCircle2 className="w-3 h-3" /> Válido
                        </span>
                      )}
                    </label>
                    <textarea
                      id="contact-message"
                      name="message"
                      rows={4}
                      required
                      value={formData.message}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      aria-invalid={!!errors.message}
                      aria-describedby={errors.message ? 'contact-message-error' : undefined}
                      placeholder="Descreva brevemente a metragem estimada, local da obra, prazos desejados ou dúvidas específicas..."
                      className={`w-full bg-[#0A1220] border rounded-xl px-4 py-3 text-sm text-white focus:outline-none font-jakarta transition-all resize-y ${
                        touched.message && errors.message
                          ? 'border-red-500 focus:ring-2 focus:ring-red-500/50'
                          : 'border-white/10 focus:border-[#C5A059] focus:ring-2 focus:ring-[#C5A059]/30'
                      }`}
                    />
                    {touched.message && errors.message && (
                      <p id="contact-message-error" className="text-red-400 text-xs font-jakarta flex items-center gap-1 pt-0.5">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{errors.message}</span>
                      </p>
                    )}
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <Button
                      type="submit"
                      variant="gold"
                      size="lg"
                      fullWidth
                      disabled={isSubmitting}
                      icon={<Send className="w-4 h-4" />}
                      className="font-bold uppercase tracking-wider text-xs sm:text-sm py-4 shadow-xl hover:shadow-[#C5A059]/20"
                    >
                      {isSubmitting ? 'Processando Solicitação...' : 'Enviar Solicitação de Orçamento'}
                    </Button>
                  </div>

                  {/* LGPD & Security Disclaimer */}
                  <div className="p-3 bg-[#0A1220]/60 border border-white/5 rounded-xl flex items-center gap-2.5 text-[11px] text-slate-400 font-jakarta">
                    <ShieldCheck className="w-4 h-4 text-[#C5A059] shrink-0" />
                    <span>
                      Garantia de privacidade conforme LGPD. Seus dados e informações técnicas permanecem protegidos sob sigilo profissional.
                    </span>
                  </div>

                </form>
              )}

            </div>
          </motion.div>

        </div>

      </div>
    </section>
  );
};

