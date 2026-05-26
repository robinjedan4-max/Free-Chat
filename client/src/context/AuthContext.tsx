import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { useToast } from './ToastContext';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: any) => Promise<boolean>;
  register: (payload: any) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserWallet: (diamonds: number, vipLevel?: 'none' | 'VIP' | 'SVIP') => void;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();

  const reloadUser = useCallback(async () => {
    try {
      const res = await api.getMe();
      if (res.success && res.data) {
        setUser(res.data);
        localStorage.setItem('user', JSON.stringify(res.data));
      }
    } catch {
      // Fail silently
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('accessToken');
      const cachedUser = localStorage.getItem('user');

      if (token && cachedUser) {
        setUser(JSON.parse(cachedUser));
        // Silently refresh profile in the background to ensure details are up-to-date
        reloadUser();
      }
      setIsLoading(false);
    };

    initializeAuth();

    // Listen to token expirations/logouts triggered from inside the API client
    const handleAuthChange = () => {
      setUser(null);
    };
    window.addEventListener('auth-status-change', handleAuthChange);

    return () => {
      window.removeEventListener('auth-status-change', handleAuthChange);
    };
  }, [reloadUser]);

  const login = async (credentials: any): Promise<boolean> => {
    setIsLoading(true);
    const res = await api.login(credentials);
    setIsLoading(false);

    if (res.success && res.data) {
      const { user, accessToken, refreshToken } = res.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      showToast(`Welcome back, @${user.username}!`, 'success');
      return true;
    } else {
      showToast(res.message || 'Login failed', 'error');
      return false;
    }
  };

  const register = async (payload: any): Promise<boolean> => {
    setIsLoading(true);
    const res = await api.register(payload);
    setIsLoading(false);

    if (res.success && res.data) {
      const { user, accessToken, refreshToken } = res.data;
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      showToast(`Welcome to AetherGlow, @${user.username}! ✨`, 'success');
      return true;
    } else {
      showToast(res.message || 'Registration failed', 'error');
      return false;
    }
  };

  const logout = async () => {
    setUser(null);
    showToast('Logged out successfully', 'info');
    await api.logout();
  };

  const updateUserWallet = (diamonds: number, vipLevel?: 'none' | 'VIP' | 'SVIP') => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = {
        ...prev,
        diamonds,
        ...(vipLevel !== undefined ? { vipLevel } : {}),
      };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        updateUserWallet,
        reloadUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
export default AuthContext;
