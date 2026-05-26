import React from 'react';

interface iPhoneWrapperProps {
  children: React.ReactNode;
}

export const IPhoneWrapper: React.FC<iPhoneWrapperProps> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center py-4 px-2 md:py-8 bg-obsidian text-slate-100 overflow-hidden relative">
      {/* Dynamic Background Glowing Blobs */}
      <div className="absolute top-1/4 left-1/4 w-[40vw] h-[40vw] bg-cyber-purple/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-[40vw] h-[40vw] bg-cyber-cyan/10 rounded-full blur-[120px] pointer-events-none animate-pulse" />

      {/* Screen Width Check Wrapper */}
      <div className="w-full max-w-md md:max-w-none md:flex md:justify-center md:items-center">
        {/* iPhone 15 Pro Frame (Only applied on desktop widths md:+) */}
        <div className="relative w-full md:w-[395px] md:h-[844px] bg-[#060609] md:rounded-[55px] md:border-[10px] md:border-zinc-800 md:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8),_0_0_0_2px_rgba(255,255,255,0.05),_inset_0_0_15px_rgba(255,255,255,0.15)] flex flex-col overflow-hidden">
          
          {/* Dynamic Island Notch (Only visible on desktop) */}
          <div className="hidden md:flex absolute top-3 left-1/2 -translate-x-1/2 w-28 h-6 bg-black rounded-full z-[100] items-center justify-between px-3 border border-zinc-900 shadow-inner">
            {/* Dynamic camera lens dot */}
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-900 border border-zinc-800" />
            
            {/* Pulsing neon stream live indicator dot inside dynamic island */}
            <div className="w-2 h-2 rounded-full bg-cyber-pink animate-pulse" />
            <div className="w-2.5 h-2.5 rounded-full bg-zinc-950 flex items-center justify-center">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1b1c20]" />
            </div>
          </div>

          {/* iPhone speaker notch indicator */}
          <div className="hidden md:block absolute top-1.5 left-1/2 -translate-x-1/2 w-16 h-1 bg-zinc-900 rounded-full z-[100] opacity-40" />

          {/* Internal Mobile Screen Content Container */}
          <div className="flex-1 w-full h-full flex flex-col overflow-hidden relative bg-[#09090e] md:rounded-[45px]">
            {children}
          </div>

          {/* iPhone Home Swipe Indicator Bar at bottom (Only desktop) */}
          <div className="hidden md:block absolute bottom-1.5 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/40 rounded-full z-[100] pointer-events-none hover:bg-white/70 transition-colors" />
        </div>
      </div>
    </div>
  );
};

export default IPhoneWrapper;
