import React from 'react';
import { BrowserRouter, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '../context/ToastContext';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { SocketProvider } from '../context/SocketContext';
import { IPhoneWrapper } from '../components/iPhoneWrapper';
import { BottomNav } from '../components/common/BottomNav';
import { AppRoutes } from './routes';
import { Sparkles } from 'lucide-react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const LayoutContent: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Hide general bottom nav when inside active streaming channels (they use fullscreen custom action bars)
  const isInsideLiveChannel = 
    location.pathname.startsWith('/rooms/') || 
    location.pathname.startsWith('/streams/');

  if (isLoading) {
    return (
      <div className="flex-grow flex flex-col items-center justify-center bg-obsidian text-slate-100 gap-3">
        <div className="relative">
          <div className="w-12 h-12 rounded-full border-4 border-cyber-cyan/20 border-t-cyber-cyan animate-spin" />
          <Sparkles className="w-4 h-4 text-cyber-purple absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
        </div>
        <span className="text-[10px] text-slate-400 font-extrabold tracking-widest uppercase animate-pulse">
          Loading Aura...
        </span>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full h-full flex flex-col relative overflow-hidden">
      {/* Scrollable Page Body */}
      <AppRoutes />

      {/* Dynamic Immersive Nav Bar toggle */}
      {isAuthenticated && !isInsideLiveChannel && <BottomNav />}
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <SocketProvider>
              <IPhoneWrapper>
                <LayoutContent />
              </IPhoneWrapper>
            </SocketProvider>
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
