import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { Shield, Mail, Lock, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { GlassCard } from '../../components/common/GlassCard';

const loginValidationSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerValidationSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must not exceed 20 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Letters, numbers, and underscores only'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const AuthPage: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const { login, register, isLoading } = useAuth();
  const navigate = useNavigate();

  const loginForm = useForm({
    resolver: zodResolver(loginValidationSchema),
    defaultValues: { email: '', password: '' }
  });

  const registerForm = useForm({
    resolver: zodResolver(registerValidationSchema),
    defaultValues: { username: '', email: '', password: '' }
  });

  const onLoginSubmit = async (data: any) => {
    const success = await login(data);
    if (success) navigate('/dashboard');
  };

  const onRegisterSubmit = async (data: any) => {
    const success = await register(data);
    if (success) navigate('/dashboard');
  };

  return (
    <div className="flex-1 overflow-y-auto px-6 py-10 flex flex-col justify-center scrollbar-none relative">
      {/* Decorative Glow Circles */}
      <div className="absolute top-10 -left-10 w-36 h-36 bg-cyber-cyan/15 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute bottom-10 -right-10 w-36 h-36 bg-cyber-purple/15 rounded-full blur-2xl pointer-events-none" />

      <div className="w-full max-w-sm mx-auto relative z-10">
        {/* Title branding header */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            {isRegister ? 'JOIN THE GLOW' : 'WELCOME BACK'}
          </h2>
          <p className="text-xs text-slate-400 mt-2">
            {isRegister ? 'Create your profile to start streaming' : 'Sign in to access your wallet & rooms'}
          </p>
        </div>

        <GlassCard glow={isRegister ? 'purple' : 'cyan'} className="p-6">
          {isRegister ? (
            /* Registration Form */
            <form onSubmit={registerForm.handleSubmit(onRegisterSubmit)} className="flex flex-col gap-4">
              <div className="relative">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Username</label>
                <div className="relative">
                  <UserIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    {...registerForm.register('username')}
                    type="text"
                    placeholder="e.g. glow_creator"
                    className="w-full py-3 pl-10 pr-4 bg-obsidian-900/40 border border-white/5 focus:border-cyber-purple/50 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
                  />
                </div>
                {registerForm.formState.errors.username && (
                  <p className="text-[10px] text-rose-400 mt-1 font-semibold">{registerForm.formState.errors.username.message}</p>
                )}
              </div>

              <div className="relative">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    {...registerForm.register('email')}
                    type="email"
                    placeholder="e.g. name@email.com"
                    className="w-full py-3 pl-10 pr-4 bg-obsidian-900/40 border border-white/5 focus:border-cyber-purple/50 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
                  />
                </div>
                {registerForm.formState.errors.email && (
                  <p className="text-[10px] text-rose-400 mt-1 font-semibold">{registerForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="relative">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    {...registerForm.register('password')}
                    type="password"
                    placeholder="••••••••"
                    className="w-full py-3 pl-10 pr-4 bg-obsidian-900/40 border border-white/5 focus:border-cyber-purple/50 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
                  />
                </div>
                {registerForm.formState.errors.password && (
                  <p className="text-[10px] text-rose-400 mt-1 font-semibold">{registerForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-2 rounded-xl btn-cyber-primary text-xs font-bold text-obsidian tracking-wider uppercase disabled:opacity-50"
              >
                {isLoading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </form>
          ) : (
            /* Login Form */
            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="flex flex-col gap-4">
              <div className="relative">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    {...loginForm.register('email')}
                    type="email"
                    placeholder="name@email.com"
                    className="w-full py-3 pl-10 pr-4 bg-obsidian-900/40 border border-white/5 focus:border-cyber-cyan/50 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
                  />
                </div>
                {loginForm.formState.errors.email && (
                  <p className="text-[10px] text-rose-400 mt-1 font-semibold">{loginForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="relative">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    {...loginForm.register('password')}
                    type="password"
                    placeholder="••••••••"
                    className="w-full py-3 pl-10 pr-4 bg-obsidian-900/40 border border-white/5 focus:border-cyber-cyan/50 rounded-xl text-sm text-slate-100 placeholder-slate-600 focus:outline-none transition-all"
                  />
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-[10px] text-rose-400 mt-1 font-semibold">{loginForm.formState.errors.password.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 mt-2 rounded-xl btn-cyber-primary text-xs font-bold text-obsidian tracking-wider uppercase disabled:opacity-50"
              >
                {isLoading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Form bottom switcher button */}
          <div className="text-center mt-6">
            <button
              onClick={() => {
                setIsRegister(!isRegister);
                loginForm.reset();
                registerForm.reset();
              }}
              className="text-xs text-slate-400 hover:text-cyber-cyan transition-colors"
            >
              {isRegister ? 'Already have an account? Sign In' : "Don't have an account yet? Sign Up"}
            </button>
          </div>
        </GlassCard>

        {/* Security / Badge indicator */}
        <div className="flex items-center justify-center gap-1.5 mt-6 text-[10px] text-slate-500 font-semibold tracking-wider uppercase">
          <Shield className="w-3.5 h-3.5 text-cyber-cyan" />
          End-to-End Secure JWT Authentication
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
