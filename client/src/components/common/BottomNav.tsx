import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Flame, Mic, MessageSquare, User, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const path = location.pathname;

  const tabs = [
    { name: 'Feed', icon: Flame, path: '/dashboard' },
    { name: 'Rooms', icon: Mic, path: '/rooms' },
    { name: 'Chat', icon: MessageSquare, path: '/chat' },
    { name: 'Profile', icon: User, path: '/profile' },
  ];

  // If user is admin/moderator, show admin icon
  if (user && (user.role === 'admin' || user.role === 'moderator')) {
    tabs.push({ name: 'Admin', icon: Shield, path: '/admin' });
  }

  return (
    <div className="absolute bottom-0 inset-x-0 h-16 bg-obsidian-900/60 backdrop-blur-xl border-t border-white/5 px-6 flex items-center justify-between z-50 pointer-events-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = path === tab.path || (tab.path !== '/dashboard' && path.startsWith(tab.path));
        
        return (
          <button
            key={tab.name}
            onClick={() => navigate(tab.path)}
            className="flex flex-col items-center justify-center flex-1 h-full relative transition-all duration-300 group"
          >
            {/* Active Indicator Glow Ring */}
            {isActive && (
              <span className="absolute -top-1 w-8 h-1 bg-gradient-to-r from-cyber-cyan to-cyber-purple rounded-full shadow-[0_0_10px_rgba(0,242,254,0.6)] animate-pulse" />
            )}

            <Icon
              className={`w-5 h-5 transition-all duration-300 group-hover:scale-110 
                ${
                  isActive
                    ? 'text-cyber-cyan filter drop-shadow-[0_0_5px_rgba(0,242,254,0.5)]'
                    : 'text-slate-400 group-hover:text-slate-200'
                }
              `}
            />
            <span
              className={`text-[10px] mt-1 font-medium transition-colors duration-300
                ${isActive ? 'text-cyber-cyan' : 'text-slate-400 group-hover:text-slate-200'}
              `}
            >
              {tab.name}
            </span>
          </button>
        );
      })}
    </div>
  );
};

export default BottomNav;
