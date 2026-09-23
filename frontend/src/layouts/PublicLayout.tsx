import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export function PublicLayout() {
  const { pathname } = useLocation();

  // Scroll to top on route change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="bg-[--color-page-bg] min-h-screen w-full px-2 py-2 md:px-6 md:py-6 overflow-hidden transition-colors duration-500 flex flex-col">
      {/* Global Navbar */}
      <Navbar />
      
      {/* FULL APP CONTAINER */}
      <div className="bg-[--color-bg-base] rounded-[2.5rem] md:rounded-[3rem] mx-auto w-full max-w-[1600px] shadow-[0_30px_60px_rgba(0,0,0,0.15)] overflow-hidden relative transition-colors duration-500 flex-1 flex flex-col">
        
        {/* GLOBAL AMBIENT BACKGROUNDS */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          <div className="absolute top-[20%] right-[-10%] w-[50vw] h-[50vw] md:w-[600px] md:h-[600px] bg-[--color-accent-cyan] rounded-full blur-[150px] opacity-[0.03] dark:opacity-[0.02]" />
          <div className="absolute bottom-[20%] left-[-10%] w-[50vw] h-[50vw] md:w-[600px] md:h-[600px] bg-[--color-accent-lime] rounded-full blur-[150px] opacity-[0.03] dark:opacity-[0.01]" />
        </div>
        
        <main className="flex-1 relative z-10">
          <Outlet />
        </main>
        
        <Footer />
      </div>
    </div>
  );
}
