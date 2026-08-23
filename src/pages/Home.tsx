import React, { useState } from 'react';
import { Navbar } from '../components/layout/Navbar';
import { Hero } from '../components/sections/Hero';
import { About } from '../components/sections/About';
import { Services } from '../components/sections/Services';
import { Projects } from '../components/sections/Projects';
import { Blog } from '../components/sections/Blog';
import { Differentials } from '../components/sections/Differentials';
import { Process } from '../components/sections/Process';
import { FAQ } from '../components/sections/FAQ';
import { CTA } from '../components/sections/CTA';
import { Contact } from '../components/sections/Contact';
import { Footer } from '../components/layout/Footer';
import { AdminModal } from '../components/admin/AdminModal';
import { IntroSplashScreen } from '../components/ui/IntroSplashScreen';

export default function Home() {
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 font-sans selection:bg-[#C5A059] selection:text-black">
      {showSplash && (
        <IntroSplashScreen
          autoDismissTime={2200}
          onComplete={() => setShowSplash(false)}
        />
      )}
      <Navbar onOpenAdmin={() => setIsAdminOpen(true)} />
      <main id="main-content">
        <Hero />
        <About />
        <Services />
        <Projects />
        <Blog />
        <Differentials />
        <Process />
        <FAQ />
        <CTA />
        <Contact />
      </main>
      <Footer />
      <AdminModal isOpen={isAdminOpen} onClose={() => setIsAdminOpen(false)} />
    </div>
  );
}
