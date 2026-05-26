import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Flame, Mic, ShieldAlert } from 'lucide-react';
import { GlassCard } from '../../components/common/GlassCard';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="flex-1 overflow-y-auto px-6 pt-12 pb-8 flex flex-col justify-between select-none relative scrollbar-none">
      {/* Decorative Shifting Circles */}
      <div className="absolute -top-12 -left-12 w-48 h-48 bg-cyber-purple/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute top-1/2 -right-12 w-48 h-48 bg-cyber-cyan/20 rounded-full blur-3xl pointer-events-none" />

      {/* Header Branding */}
      <div className="text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-glass-white border border-white/10 text-[11px] font-semibold text-cyber-cyan tracking-wider uppercase mb-6 shadow-sm">
          <Sparkles className="w-3.5 h-3.5 animate-spin" />
          The Future of Interactive Socials
        </div>

        <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
          AETHER<span className="text-cyber-cyan text-glow-cyan">GLOW</span>
        </h1>
        <p className="mt-4 text-sm text-slate-400 max-w-xs mx-auto leading-relaxed">
          Step into liquid glass neon streams, real-time voice rooms, and premium social economies.
        </p>
      </div>

      {/* Core Features Showcase Carousel/Grid */}
      <div className="my-8 flex flex-col gap-4 relative z-10">
        <GlassCard glow="purple" hoverable className="p-4 flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-cyber-purple/10 border border-cyber-purple/20 text-cyber-purple">
            <Flame className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-200">Interactive Streams</h3>
            <p className="text-xs text-slate-400 mt-1 leading-normal">
              Join high-fidelity live feeds, chat instantly, and send animated neon cascades.
            </p>
          </div>
        </GlassCard>

        <GlassCard glow="cyan" hoverable className="p-4 flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-cyber-cyan/10 border border-cyber-cyan/20 text-cyber-cyan">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-200">Glass Voice Rooms</h3>
            <p className="text-xs text-slate-400 mt-1 leading-normal">
              Claim guest seats in real-time conversation rooms with active mic soundwaves.
            </p>
          </div>
        </GlassCard>

        <GlassCard glow="pink" hoverable className="p-4 flex items-start gap-4">
          <div className="p-2.5 rounded-xl bg-cyber-pink/10 border border-cyber-pink/20 text-cyber-pink">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-slate-200">VIP Gift Economy</h3>
            <p className="text-xs text-slate-400 mt-1 leading-normal">
              Purchase diamonds, activate VIP status, and reward creators with real value.
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Primary Action Buttons */}
      <div className="flex flex-col gap-3 relative z-10 w-full">
        <button
          onClick={() => navigate('/auth')}
          className="w-full py-4 rounded-2xl btn-cyber-primary text-sm font-bold text-obsidian tracking-wider uppercase"
        >
          Enter the Glow
        </button>
        <div className="text-center text-[10px] text-slate-500 font-medium">
          By entering, you agree to AetherGlow terms & code of conduct.
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
