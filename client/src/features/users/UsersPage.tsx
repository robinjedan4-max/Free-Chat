import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, Users } from 'lucide-react';
import { api } from '../../services/api';
import { User } from '../../types';
import { useToast } from '../../context/ToastContext';
import { GlassCard } from '../../components/common/GlassCard';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

const UsersPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getCreators(search, page);
      if (res.success && res.data) {
        setUsers(res.data.creators);
        setPages(res.data.pagination.pages);
      }
    } catch (error) {
      showToast('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, [search, page]);

  return (
    <div className="flex-grow overflow-y-auto px-4 pt-4 pb-20 scrollbar-none relative pointer-events-auto">
      <div className="flex items-center justify-between gap-3 mb-5">
        <button
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-glass-white/20 border border-white/10 text-slate-200 text-xs uppercase tracking-wider shadow-lg hover:bg-glass-white/30"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <div className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-obsidian-900 border border-white/10 shadow-lg">
          <Users className="w-4 h-4 text-cyber-cyan" />
          <span className="text-[10px] uppercase tracking-widest text-slate-400">All Users</span>
        </div>
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search users..."
          className="w-full py-3 pl-12 pr-4 bg-obsidian-700/40 border border-white/10 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyber-cyan/40"
        />
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, idx) => (
            <LoadingSkeleton key={idx} variant="card" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {users.length === 0 ? (
            <GlassCard className="p-8 text-center">
              <p className="text-sm text-slate-400">No users match your query.</p>
            </GlassCard>
          ) : (
            users.map((user) => (
              <GlassCard key={user._id} hoverable className="p-4 cursor-pointer" onClick={() => navigate(`/profile/${user._id}`)}>
                <div className="flex items-start gap-3">
                  <img src={user.avatar} alt={user.username} className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-black text-slate-100">@{user.username}</h3>
                      {user.vipLevel !== 'none' && (
                        <span className="text-[10px] uppercase tracking-widest text-cyber-purple font-black bg-white/5 px-2 py-1 rounded-full">
                          {user.vipLevel}
                        </span>
                      )}
                    </div>
                    <p className="mt-2 text-[11px] text-slate-400 leading-relaxed line-clamp-3">
                      {user.bio || 'This user has not added a bio yet.'}
                    </p>
                    <div className="mt-3 flex gap-2 flex-wrap text-[10px] text-slate-400">
                      <span>{user.followers.length} followers</span>
                      <span>{user.following.length} following</span>
                    </div>
                  </div>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      )}

      {!loading && users.length > 0 && (
        <div className="mt-6 flex items-center justify-between text-[11px] text-slate-400">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page <= 1}
            className="px-3 py-2 rounded-2xl bg-obsidian-800 border border-white/10 disabled:opacity-40"
          >
            Previous
          </button>
          <span>Page {page} of {pages}</span>
          <button
            onClick={() => setPage((prev) => Math.min(prev + 1, pages))}
            disabled={page >= pages}
            className="px-3 py-2 rounded-2xl bg-obsidian-800 border border-white/10 disabled:opacity-40"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default UsersPage;
