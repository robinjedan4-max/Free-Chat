import React, { useState, useEffect } from 'react';
import { Shield, Users, Mic, Diamond, Ban, RefreshCw, Key } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { GlassCard } from '../../components/common/GlassCard';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export const AdminPanel: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [stats, setStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [promoCodes, setPromoCodes] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const statsRes = await api.getAdminStats();
      if (statsRes.success && statsRes.data) {
        setStats(statsRes.data);
      }

      const usersRes = await api.getCreators('', 1);
      if (usersRes.success && usersRes.data?.creators) {
        setUsersList(usersRes.data.creators);
      }
    } catch {
      showToast('Access Denied: Admins only', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchAdminData();
    setRefreshing(false);
    showToast('Analytics refreshed successfully', 'success');
  };

  const handleBanToggle = async (targetUser: any) => {
    const nextBanState = !targetUser.isBanned;
    try {
      const res = await api.toggleBanUser(targetUser._id, nextBanState);
      if (res.success && res.data) {
        showToast(`User @${targetUser.username} successfully ${nextBanState ? 'banned' : 'unbanned'}!`, 'success');
        
        // Update local users list
        setUsersList((prev) =>
          prev.map((u) => (u._id === targetUser._id ? { ...u, isBanned: nextBanState } : u))
        );
        
        // Refresh metrics
        fetchAdminData();
      } else {
        showToast(res.message || 'Operation failed', 'error');
      }
    } catch {
      showToast('Ban request error', 'error');
    }
  };

  const handleGenerateCodes = async () => {
    try {
      const res = await api.generatePromoCodes();
      if (res.success && res.data) {
        setPromoCodes(res.data);
        showToast('Redemption promo keys generated!', 'success');
      }
    } catch {
      showToast('Promo code generation failed', 'error');
    }
  };

  if (user?.role !== 'admin' && user?.role !== 'moderator') {
    return (
      <div className="flex-grow flex items-center justify-center p-6 text-center">
        <div>
          <Shield className="w-8 h-8 text-rose-500 mx-auto mb-2" />
          <p className="text-xs text-rose-400 font-bold">Access Denied</p>
          <p className="text-[10px] text-slate-500 mt-1">This panel is reserved for administrators only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-y-auto px-4 pt-4 pb-20 scrollbar-none relative pointer-events-auto">
      
      {/* Header with refresh */}
      <div className="flex items-center justify-between mb-5 border-b border-white/5 pb-3">
        <div className="flex items-center gap-1.5">
          <Shield className="w-4 h-4 text-cyber-cyan" />
          <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest">System Admin Control</h2>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="p-2 rounded-xl bg-glass-white border border-white/5 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-30"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Analytics Dashboard Grid */}
      {loading ? (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <LoadingSkeleton className="h-16" />
          <LoadingSkeleton className="h-16" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="p-3.5 rounded-2xl glass-pane border-white/5 flex items-center gap-3">
            <Users className="w-5 h-5 text-cyber-cyan" />
            <div>
              <div className="text-[14px] font-black text-slate-100">{stats?.totalUsers || 0}</div>
              <div className="text-[8px] uppercase font-bold text-slate-500">Registered Users</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-pane border-white/5 flex items-center gap-3">
            <Mic className="w-5 h-5 text-cyber-purple" />
            <div>
              <div className="text-[14px] font-black text-slate-100">{stats?.activeRooms || 0}</div>
              <div className="text-[8px] uppercase font-bold text-slate-500">Active Rooms</div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl glass-pane border-white/5 flex items-center gap-3 col-span-2">
            <Diamond className="w-5 h-5 text-fuchsia-400" />
            <div>
              <div className="text-[14px] font-black text-slate-100">💎 {stats?.systemDiamonds || 0}</div>
              <div className="text-[8px] uppercase font-bold text-slate-500">Total System Diamonds Volume</div>
            </div>
          </div>
        </div>
      )}

      {/* User Ban Moderation Desk */}
      <GlassCard glow="pink" className="p-4 mb-5">
        <div className="flex items-center gap-2 mb-3 text-[10px] uppercase font-black tracking-widest text-slate-400">
          <Ban className="w-4 h-4 text-cyber-pink" />
          User Moderation desk
        </div>

        {loading ? (
          <LoadingSkeleton className="h-10" />
        ) : (
          <div className="flex flex-col gap-3">
            {usersList.filter((u) => u._id !== user?._id).map((u) => (
              <div key={u._id} className="p-2.5 rounded-xl bg-glass-white/20 flex items-center justify-between border border-white/5">
                <div className="flex items-center gap-2">
                  <img src={u.avatar} alt={u.username} className="w-7 h-7 rounded-full object-cover" />
                  <div>
                    <span className="text-[10px] text-slate-200 font-bold">@{u.username}</span>
                    <span className="text-[8px] text-slate-500 block">Role: {u.role}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleBanToggle(u)}
                  className={`text-[9px] font-black px-2.5 py-1.5 rounded-xl uppercase transition-colors
                    ${u.isBanned
                      ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                      : 'bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                    }
                  `}
                >
                  {u.isBanned ? 'Unban' : 'Ban User'}
                </button>
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      {/* VIP Key Generator (Admin Only) */}
      {user?.role === 'admin' && (
        <GlassCard glow="purple" className="p-4">
          <div className="flex items-center gap-2 mb-3 text-[10px] uppercase font-black tracking-widest text-slate-400">
            <Key className="w-4 h-4 text-cyber-purple" />
            Promo Voucher Key Generator
          </div>

          <button
            onClick={handleGenerateCodes}
            className="w-full py-3.5 rounded-xl btn-cyber-primary text-xs font-bold text-obsidian tracking-wider uppercase mb-4"
          >
            Generate VIP Activation Vouchers
          </button>

          {promoCodes.length > 0 && (
            <div className="flex flex-col gap-2">
              {promoCodes.map((code, idx) => (
                <div key={idx} className="p-2 bg-obsidian-900 border border-white/5 rounded-xl text-center select-text font-mono text-[10px] text-cyber-cyan font-bold tracking-widest">
                  {code}
                </div>
              ))}
            </div>
          )}
        </GlassCard>
      )}
    </div>
  );
};

export default AdminPanel;
