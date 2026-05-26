import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Flame, Users, Plus, Star, Mic, Play } from 'lucide-react';
import { api } from '../../services/api';
import { Room, User } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { GlassCard } from '../../components/common/GlassCard';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [rooms, setRooms] = useState<Room[]>([]);
  const [creators, setCreators] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states for creating a new room
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newType, setNewType] = useState<'voice' | 'stream'>('stream');
  const [newCategory, setNewCategory] = useState('Social');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const roomsPayload = await api.getRooms(category);
        if (roomsPayload.success && roomsPayload.data) {
          setRooms(roomsPayload.data);
        }
        
        const creatorsPayload = await api.getCreators();
        if (creatorsPayload.success && creatorsPayload.data?.creators) {
          setCreators(creatorsPayload.data.creators);
        }
      } catch (err: any) {
        showToast('Failed to load feed', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [category, showToast]);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      const res = await api.createRoom({
        title: newTitle,
        description: newDesc,
        type: newType,
        category: newCategory,
      });

      if (res.success && res.data) {
        setShowCreateModal(false);
        showToast('Room created successfully! 🚀', 'success');
        
        // Clear inputs
        setNewTitle('');
        setNewDesc('');
        
        // Navigate directly into the room
        if (newType === 'voice') {
          navigate(`/rooms/${res.data._id}`);
        } else {
          navigate(`/streams/${res.data._id}`);
        }
      } else {
        showToast(res.message || 'Failed to launch room', 'error');
      }
    } catch (err: any) {
      showToast('Error launching room', 'error');
    }
  };

  const filteredRooms = rooms.filter(
    (room) =>
      room.title.toLowerCase().includes(search.toLowerCase()) ||
      room.host.username.toLowerCase().includes(search.toLowerCase())
  );

  const categories = ['All', 'Social', 'Music', 'Gaming', 'Talk'];

  return (
    <div className="flex-grow overflow-y-auto px-4 pt-4 pb-20 scrollbar-none relative pointer-events-auto">
      
      {/* Wallet overview header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Wallet Balance</div>
          <div className="flex items-center gap-1 mt-0.5">
            <span className="text-sm font-black text-cyber-cyan text-glow-cyan">💎 {user?.diamonds || 0}</span>
            <span className="text-[10px] text-slate-400 font-semibold">Diamonds</span>
          </div>
        </div>
        {user?.vipLevel !== 'none' && (
          <div className="px-2.5 py-1 rounded-full bg-cyber-purple/20 border border-cyber-purple/40 text-[10px] font-black text-cyber-purple tracking-widest uppercase flex items-center gap-1 shadow-sm">
            <Star className="w-3 h-3 fill-cyber-purple" />
            {user?.vipLevel} MEMBER
          </div>
        )}
      </div>

      {/* Discover Search Bar */}
      <div className="relative mb-5">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          type="text"
          placeholder="Search active streams or hosts..."
          className="w-full py-3 pl-10 pr-4 bg-obsidian-700/40 border border-white/5 focus:border-cyber-cyan/30 rounded-2xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition-all"
        />
      </div>

      {/* Online Top Creators Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-black tracking-widest">
            <Users className="w-3.5 h-3.5 text-cyber-purple" />
            Active Creators
          </div>
          <button
            onClick={() => navigate('/users')}
            className="px-3 py-2 rounded-2xl bg-glass-white/20 border border-white/10 text-[10px] font-black uppercase tracking-widest text-slate-100 hover:bg-glass-white/30"
          >
            View All Users
          </button>
        </div>
        <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <LoadingSkeleton variant="circle" className="w-12 h-12" />
                <LoadingSkeleton className="w-12 h-2.5" />
              </div>
            ))
          ) : creators.length === 0 ? (
            <div className="text-[10px] text-slate-500 italic">No creators active</div>
          ) : (
            creators.map((c) => (
              <div
                key={c._id}
                onClick={() => navigate(`/profile/${c._id}`)}
                className="flex flex-col items-center gap-1.5 cursor-pointer flex-shrink-0 group"
              >
                <div className={`relative p-0.5 rounded-full border transition-all duration-300 group-hover:scale-105
                  ${c.vipLevel !== 'none' ? 'border-cyber-purple' : 'border-white/10'}`}
                >
                  <img src={c.avatar} alt={c.username} className="w-12 h-12 rounded-full object-cover" />
                  {c.vipLevel !== 'none' && (
                    <span className="absolute -bottom-1 -right-1 bg-cyber-purple text-[8px] px-1 rounded-full font-black text-white shadow-md uppercase">
                      VIP
                    </span>
                  )}
                </div>
                <span className="text-[10px] text-slate-300 font-bold group-hover:text-cyber-cyan transition-colors">@{c.username}</span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Live Categories Selection Header */}
      <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-2 rounded-xl text-xs font-bold tracking-wide transition-all flex-shrink-0
              ${
                category === cat
                  ? 'bg-glass-white border border-cyber-cyan text-cyber-cyan text-glow-cyan shadow-neon-cyan/15'
                  : 'bg-glass-white/30 border border-white/5 text-slate-400 hover:text-slate-200'
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Active Streaming Feed Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 uppercase font-black tracking-widest">
            <Flame className="w-3.5 h-3.5 text-cyber-cyan" />
            Active Rooms ({filteredRooms.length})
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col gap-4">
            <LoadingSkeleton variant="card" />
            <LoadingSkeleton variant="card" />
          </div>
        ) : filteredRooms.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center glass-pane rounded-3xl border-dashed border-white/5">
            <Flame className="w-8 h-8 text-slate-600 mb-2" />
            <p className="text-xs text-slate-400 font-bold">No active rooms found</p>
            <p className="text-[10px] text-slate-500 mt-1">Be the first to spark a live room!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredRooms.map((room) => (
              <GlassCard
                key={room._id}
                glow={room.type === 'voice' ? 'purple' : 'cyan'}
                hoverable
                onClick={() => navigate(room.type === 'voice' ? `/rooms/${room._id}` : `/streams/${room._id}`)}
                className="cursor-pointer p-4 group"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={room.host.avatar} alt={room.host.username} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                      {room.type === 'voice' ? (
                        <span className="absolute -bottom-1 -right-1 p-1 bg-cyber-purple rounded-full text-white shadow-md">
                          <Mic className="w-2.5 h-2.5" />
                        </span>
                      ) : (
                        <span className="absolute -bottom-1 -right-1 p-1 bg-cyber-cyan rounded-full text-black shadow-md">
                          <Play className="w-2.5 h-2.5 fill-black" />
                        </span>
                      )}
                    </div>
                    <div>
                      <h4 className="text-xs font-black text-slate-100 group-hover:text-cyber-cyan transition-colors">{room.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">by @{room.host.username}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-300 font-bold uppercase tracking-wider">
                      {room.category}
                    </span>
                    <span className="text-[9px] font-black text-cyber-cyan">
                      🔥 {room.viewersCount} active
                    </span>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        )}
      </div>

      {/* Floating Action Button: Go Live! */}
      <button
        onClick={() => setShowCreateModal(true)}
        className="fixed bottom-20 right-6 md:right-auto md:translate-x-[260px] p-4 rounded-full btn-cyber-primary text-obsidian shadow-lg z-40 transition-all hover:scale-105 active:scale-95"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      {/* Action Sheet Modal: Create Room */}
      {showCreateModal && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md z-50 flex items-end justify-center pointer-events-auto">
          <div className="w-full bg-[#0a0a0f] border-t border-white/10 rounded-t-[30px] p-6 max-h-[90%] overflow-y-auto animate-[slideUp_0.3s_ease] pointer-events-auto shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-base font-extrabold text-slate-100">LAUNCH ACTIVE ROOM</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-xs text-slate-500 hover:text-slate-300 font-black">CLOSE</button>
            </div>

            <form onSubmit={handleCreateRoom} className="flex flex-col gap-4">
              <div>
                <label className="text-[9px] uppercase font-black text-slate-400 tracking-wider block mb-1">Room Title</label>
                <input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  type="text"
                  placeholder="e.g. Acoustic Neon Jam session 🎸"
                  className="w-full py-3 px-4 bg-obsidian-900 border border-white/5 focus:border-cyber-cyan/30 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="text-[9px] uppercase font-black text-slate-400 tracking-wider block mb-1">Short Description</label>
                <input
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  type="text"
                  placeholder="Tell people what's happening..."
                  className="w-full py-3 px-4 bg-obsidian-900 border border-white/5 focus:border-cyber-cyan/30 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] uppercase font-black text-slate-400 tracking-wider block mb-1">Room Type</label>
                  <select
                    value={newType}
                    onChange={(e: any) => setNewType(e.target.value)}
                    className="w-full py-3 px-4 bg-obsidian-900 border border-white/5 rounded-xl text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="stream">🎥 Live Stream</option>
                    <option value="voice">🎙️ Voice Room</option>
                  </select>
                </div>

                <div>
                  <label className="text-[9px] uppercase font-black text-slate-400 tracking-wider block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full py-3 px-4 bg-obsidian-900 border border-white/5 rounded-xl text-xs text-slate-300 focus:outline-none"
                  >
                    <option value="Social">Social</option>
                    <option value="Music">Music</option>
                    <option value="Gaming">Gaming</option>
                    <option value="Talk">Talk</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 mt-4 rounded-xl btn-cyber-primary text-xs font-bold text-obsidian tracking-wider uppercase"
              >
                Go Live Now ⚡
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;
