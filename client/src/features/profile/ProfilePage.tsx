import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { User, Star, LogOut, Heart, Diamond, Sparkles, CheckCircle2 } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { GlassCard } from '../../components/common/GlassCard';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';
import { AvatarUploader } from '../../components/common/AvatarUploader';
import { LogoUploader } from '../../components/common/LogoUploader';
import { BannerUploader } from '../../components/common/BannerUploader';

export const ProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, logout, updateUserWallet } = useAuth();
  const { showToast } = useToast();

  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOwnProfile = !id || id === currentUser?._id;

  const loadProfileData = async () => {
    setLoading(true);
    try {
      const targetId = isOwnProfile ? currentUser?._id : id;
      if (!targetId) return;

      const res = await api.getUserProfile(targetId);
      if (res.success && res.data) {
        setProfile(res.data);
      }
    } catch {
      showToast('Failed to load profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfileData();
  }, [id, isOwnProfile, currentUser?._id]);

  const handleBuyDiamonds = async (amount: number) => {
    setIsSubmitting(true);
    try {
      const res = await api.purchaseDiamonds(amount);
      if (res.success && res.data) {
        updateUserWallet(res.data.diamonds);
        setProfile((prev: any) => prev ? { ...prev, diamonds: res.data.diamonds } : null);
        showToast(`Successfully purchased 💎 ${amount} diamonds!`, 'success');
      } else {
        showToast('Purchase failed', 'error');
      }
    } catch {
      showToast('Topup error occurred', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBuyVIP = async (plan: 'VIP' | 'SVIP') => {
    setIsSubmitting(true);
    try {
      const res = await api.purchaseVIP(plan);
      if (res.success && res.data) {
        updateUserWallet(res.data.diamonds, res.data.vipLevel);
        setProfile((prev: any) => prev ? { ...prev, diamonds: res.data.diamonds, vipLevel: res.data.vipLevel } : null);
        showToast(`You are now an official ${plan} Member! 🌟`, 'success');
      } else {
        showToast(res.message || 'VIP purchase failed', 'error');
      }
    } catch {
      showToast('Upgrade transaction error', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!profile) return;
    try {
      const res = await api.toggleFollow(profile._id);
      if (res.success && res.data) {
        showToast(res.message, 'success');
        setProfile((prev: any) => ({
          ...prev,
          followers: res.data.followers
        }));
      }
    } catch {
      showToast('Social update failed', 'error');
    }
  };

  const handleAvatarUploadSuccess = (url: string) => {
    setProfile((prev: any) => ({
      ...prev,
      avatar: url,
      profileImage: url,
    }));
    showToast('Profile picture updated!', 'success');
  };

  const handleLogoUploadSuccess = (url: string) => {
    setProfile((prev: any) => ({
      ...prev,
      logoImage: url,
    }));
    showToast('Logo updated!', 'success');
  };

  const handleBannerUploadSuccess = (url: string) => {
    setProfile((prev: any) => ({
      ...prev,
      bannerImage: url,
    }));
    showToast('Banner updated!', 'success');
  };

  if (loading) {
    return (
      <div className="flex-grow p-6 flex flex-col gap-4">
        <LoadingSkeleton variant="circle" className="w-20 h-20 mx-auto" />
        <LoadingSkeleton className="h-6 w-32 mx-auto" />
        <LoadingSkeleton variant="card" />
        <LoadingSkeleton variant="card" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex-grow flex items-center justify-center p-6 text-center">
        <div>
          <User className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400">Failed to retrieve user card</p>
        </div>
      </div>
    );
  }

  const followersCount = profile.followers?.length || 0;
  const followingCount = profile.following?.length || 0;
  const isFollowing = profile.followers?.some((f: any) => (f._id || f) === currentUser?._id);

  return (
    <div className="flex-grow overflow-y-auto px-4 pt-4 pb-20 scrollbar-none relative pointer-events-auto">
      
      {/* Profile Overview Card */}
      <GlassCard glow={profile.vipLevel !== 'none' ? 'purple' : 'none'} className="p-5 flex flex-col items-center text-center relative mb-5">
        <div className={`relative p-0.5 rounded-full border-2 
          ${profile.vipLevel === 'SVIP' ? 'border-cyber-pink shadow-neon-pink' : profile.vipLevel === 'VIP' ? 'border-cyber-purple shadow-neon-purple' : 'border-white/10'}`}
        >
          <img src={profile.avatar} alt={profile.username} className="w-20 h-20 rounded-full object-cover" />
          {profile.isVerified && (
            <span className="absolute -bottom-1 -right-1 bg-cyber-cyan p-0.5 rounded-full text-black">
              <CheckCircle2 className="w-3.5 h-3.5 fill-black" />
            </span>
          )}
        </div>

        <h3 className="text-sm font-black text-slate-100 mt-3 flex items-center gap-1.5 justify-center">
          @{profile.username}
          {profile.vipLevel !== 'none' && (
            <span className="px-2 py-0.5 text-[8px] bg-cyber-purple text-white rounded-full font-black uppercase shadow-md flex items-center gap-0.5">
              <Star className="w-2 h-2 fill-white" />
              {profile.vipLevel}
            </span>
          )}
        </h3>
        
        <p className="text-[10px] text-slate-400 max-w-xs leading-relaxed mt-2 italic px-4">
          "{profile.bio}"
        </p>

        {/* Stats counter row */}
        <div className="flex items-center gap-6 mt-4 border-t border-white/5 pt-3 w-full justify-center">
          <div className="text-center">
            <div className="text-xs font-black text-slate-100">{followersCount}</div>
            <div className="text-[8px] uppercase tracking-wider text-slate-500 font-bold mt-0.5">Followers</div>
          </div>
          <div className="w-[1px] h-6 bg-white/5" />
          <div className="text-center">
            <div className="text-xs font-black text-slate-100">{followingCount}</div>
            <div className="text-[8px] uppercase tracking-wider text-slate-500 font-bold mt-0.5">Following</div>
          </div>
        </div>

        {/* Dynamic button controls */}
        {!isOwnProfile ? (
          <button
            onClick={handleFollowToggle}
            className={`w-full py-3 mt-4 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all
              ${isFollowing
                ? 'bg-glass-white/20 border border-white/10 text-slate-300 hover:bg-glass-white/40'
                : 'btn-cyber-primary text-obsidian'
              }
            `}
          >
            <Heart className={`w-3.5 h-3.5 ${isFollowing ? 'fill-cyber-pink stroke-cyber-pink' : ''}`} />
            {isFollowing ? 'Following' : 'Follow Creator'}
          </button>
        ) : (
          <button
            onClick={logout}
            className="w-full py-3 mt-4 rounded-xl bg-glass-white/20 border border-white/10 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 text-slate-400 text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign Out
          </button>
        )}
      </GlassCard>

      {/* Wallet Deposit Center (Own Profile Only) */}
      {isOwnProfile && (
        <div className="flex flex-col gap-5">
          {/* Diamond Topups grid */}
          <GlassCard glow="cyan" className="p-4">
            <div className="flex items-center gap-2 mb-3 text-[10px] uppercase font-black tracking-widest text-slate-400">
              <Diamond className="w-4 h-4 text-cyber-cyan" />
              Diamond Wallet Center
            </div>
            
            <div className="grid grid-cols-3 gap-2">
              {[
                { count: 100, price: '$0.99' },
                { count: 500, price: '$4.99' },
                { count: 1500, price: '$12.99' },
              ].map((p) => (
                <button
                  key={p.count}
                  onClick={() => handleBuyDiamonds(p.count)}
                  disabled={isSubmitting}
                  className="p-3 bg-obsidian-900 border border-white/5 hover:border-cyber-cyan/30 rounded-xl flex flex-col items-center justify-center transition-all group disabled:opacity-40"
                >
                  <span className="text-[10px] text-slate-300 font-extrabold group-hover:text-cyber-cyan">💎 {p.count}</span>
                  <span className="text-[8px] text-slate-500 mt-1 font-bold">{p.price}</span>
                </button>
              ))}
            </div>
          </GlassCard>

          {/* Image Uploads Section */}
          <GlassCard glow="cyan" className="p-5">
            <div className="flex items-center gap-2 mb-4 text-[10px] uppercase font-black tracking-widest text-slate-400">
              <User className="w-4 h-4 text-cyber-cyan" />
              Profile Media
            </div>

            {/* Avatar Uploader */}
            <div className="mb-6">
              <AvatarUploader
                currentAvatar={profile.avatar}
                onUploadSuccess={handleAvatarUploadSuccess}
                size="medium"
              />
            </div>

            {/* Logo Uploader */}
            <div className="mb-6 pb-6 border-b border-white/10">
              <LogoUploader
                currentLogo={profile.logoImage}
                onUploadSuccess={handleLogoUploadSuccess}
              />
            </div>

            {/* Banner Uploader */}
            <div>
              <BannerUploader
                currentBanner={profile.bannerImage}
                onUploadSuccess={handleBannerUploadSuccess}
              />
            </div>
          </GlassCard>

          {/* VIP membership options */}
          <GlassCard glow="purple" className="p-4">
            <div className="flex items-center gap-2 mb-3 text-[10px] uppercase font-black tracking-widest text-slate-400">
              <Sparkles className="w-4 h-4 text-cyber-purple animate-pulse" />
              Membership Upgrades
            </div>

            <div className="flex flex-col gap-3">
              {/* VIP card */}
              <div className="p-3 bg-glass-white/20 border border-white/5 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-100 flex items-center gap-1">
                    🌟 AETHER VIP
                  </div>
                  <div className="text-[8px] text-slate-400 mt-0.5">Custom badge + Glowing chat nameplate</div>
                </div>
                <button
                  onClick={() => handleBuyVIP('VIP')}
                  disabled={isSubmitting || profile.vipLevel === 'VIP' || profile.vipLevel === 'SVIP'}
                  className="px-3 py-2 rounded-xl bg-cyber-purple/20 border border-cyber-purple/40 text-[9px] font-black text-cyber-purple uppercase disabled:opacity-30"
                >
                  {profile.vipLevel === 'VIP' || profile.vipLevel === 'SVIP' ? 'ACTIVE' : '💎 500'}
                </button>
              </div>

              {/* SVIP card */}
              <div className="p-3 bg-glass-white/20 border border-white/5 rounded-2xl flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-cyber-pink flex items-center gap-1">
                    👑 AETHER SVIP
                  </div>
                  <div className="text-[8px] text-slate-400 mt-0.5">Royal nameplate + Free micro effects</div>
                </div>
                <button
                  onClick={() => handleBuyVIP('SVIP')}
                  disabled={isSubmitting || profile.vipLevel === 'SVIP'}
                  className="px-3 py-2 rounded-xl bg-cyber-pink/20 border border-cyber-pink/40 text-[9px] font-black text-cyber-pink uppercase disabled:opacity-30"
                >
                  {profile.vipLevel === 'SVIP' ? 'ACTIVE' : '💎 1500'}
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;
