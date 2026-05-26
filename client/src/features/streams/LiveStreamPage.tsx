import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, Gift as GiftIcon, LogOut, Send, Eye } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSocket } from '../../context/SocketContext';
import { Room, Message, Gift } from '../../types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

interface FloatingHeart {
  id: number;
  x: number; // horizontal offset percentage
  color: string;
}

export const LiveStreamPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, updateUserWallet } = useAuth();
  const { showToast } = useToast();
  const { socket, joinRoom, leaveRoom } = useSocket();

  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  
  const [inputText, setInputText] = useState('');
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [floatingHearts, setFloatingHearts] = useState<FloatingHeart[]>([]);
  const [activeGiftEffect, setActiveGiftEffect] = useState<{ icon: string; name: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heartCounter = useRef(0);

  // 1. Fetch Room, Messages, and Gifts
  useEffect(() => {
    const loadStreamData = async () => {
      if (!id) return;
      try {
        const res = await api.getRooms();
        if (res.success && res.data) {
          const target = res.data.find((r: Room) => r._id === id);
          if (target) {
            setRoom(target);
          } else {
            showToast('Stream not found', 'error');
            navigate('/dashboard');
          }
        }

        const msgRes = await api.getRoomMessages(id);
        if (msgRes.success && msgRes.data) {
          setMessages(msgRes.data);
        }

        const giftRes = await api.getGifts();
        if (giftRes.success && giftRes.data) {
          setGifts(giftRes.data);
        }
      } catch (err) {
        showToast('Error loading live stream', 'error');
      }
    };

    loadStreamData();
  }, [id, navigate, showToast]);

  // 2. Setup Socket connections
  useEffect(() => {
    if (!id || !user || !socket) return;

    joinRoom(id, user.username);

    socket.on('receive_room_msg', (newMsg: Message) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    socket.on('viewer_update', (data: { viewersCount: number; eventMsg: string }) => {
      setRoom((prev) => prev ? { ...prev, viewersCount: data.viewersCount } : null);
    });

    socket.on('receive_gift_effect', (data: { gift: Gift; senderUsername: string; recipientUsername: string }) => {
      showToast(`${data.senderUsername} sent ${data.gift.name} ${data.gift.icon}!`, 'gift');
      
      setActiveGiftEffect({
        icon: data.gift.icon,
        name: data.gift.name,
      });

      // Clear after 3 seconds
      setTimeout(() => {
        setActiveGiftEffect(null);
      }, 3000);
    });

    // Receive heart reactions from other viewers
    socket.on('voice_active_broadcast', (data: { type: string; x: number; color: string }) => {
      if (data.type === 'heart') {
        const id = heartCounter.current++;
        setFloatingHearts((prev) => [...prev, { id, x: data.x, color: data.color }]);
        setTimeout(() => {
          setFloatingHearts((prev) => prev.filter((h) => h.id !== id));
        }, 2500);
      }
    });

    return () => {
      leaveRoom(id, user.username);
      socket.off('receive_room_msg');
      socket.off('viewer_update');
      socket.off('receive_gift_effect');
      socket.off('voice_active_broadcast');
    };
  }, [id, user, socket, joinRoom, leaveRoom, showToast]);

  // Scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Render Shifting Neon Canvas video stream
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let width = (canvas.width = canvas.offsetWidth);
    let height = (canvas.height = canvas.offsetHeight);

    const particles: Array<{ x: number; y: number; r: number; color: string; speed: number }> = [];
    const colorsList = ['#00f2fe', '#bc4eff', '#ff4e91'];

    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        r: Math.random() * 2 + 1,
        color: colorsList[Math.floor(Math.random() * colorsList.length)],
        speed: Math.random() * 0.5 + 0.2
      });
    }

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth;
      height = canvas.height = canvas.offsetHeight;
    };
    window.addEventListener('resize', handleResize);

    const draw = () => {
      ctx.fillStyle = 'rgba(6, 6, 9, 0.2)'; // Slow trail
      ctx.fillRect(0, 0, width, height);

      // Shifting background gradients
      const grad = ctx.createRadialGradient(width / 2, height / 2, 20, width / 2, height / 2, width / 1.2);
      grad.addColorStop(0, 'rgba(30, 20, 50, 0.4)');
      grad.addColorStop(1, 'rgba(6, 6, 9, 0.8)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Render cosmic particles
      particles.forEach((p) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = p.color;
        ctx.fill();

        p.y -= p.speed;
        if (p.y < 0) {
          p.y = height;
          p.x = Math.random() * width;
        }
      });

      // Shimmer overlay text info
      ctx.shadowBlur = 0;
      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
    };
  }, [room]);

  const handleEmitHeart = () => {
    if (!socket || !id) return;

    const x = Math.random() * 60 + 20; // x offset percentage
    const colors = ['#00f2fe', '#bc4eff', '#ff4e91', '#ffffff'];
    const color = colors[Math.floor(Math.random() * colors.length)];

    // Send reaction to other viewers
    socket.emit('voice_active', {
      roomId: id,
      type: 'heart',
      x,
      color
    });

    const heartId = heartCounter.current++;
    setFloatingHearts((prev) => [...prev, { id: heartId, x, color }]);
    setTimeout(() => {
      setFloatingHearts((prev) => prev.filter((h) => h.id !== heartId));
    }, 2500);
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !socket || !id || !user) return;

    const newMsgPayload = {
      sender: user,
      content: inputText,
      isGift: false,
      createdAt: new Date().toISOString()
    };

    socket.emit('send_room_msg', {
      roomId: id,
      message: newMsgPayload
    });

    setInputText('');
  };

  const handleEndStream = async () => {
    if (!id || !user) return;
    try {
      const res = await api.closeRoom(id);
      if (res.success) {
        showToast('Stream ended successfully.', 'success');
        navigate('/dashboard');
      } else {
        showToast(res.message || 'Could not end stream', 'error');
      }
    } catch {
      showToast('An error occurred trying to end the stream', 'error');
    }
  };

  const isHost = room?.host?._id === user?._id;

  const handleSendGiftSubmit = async (gift: Gift) => {
    if (!id || !user || !socket || !room) return;
    try {
      const res = await api.sendGift({
        giftId: gift._id,
        recipientId: room.host._id,
        roomId: id
      });

      if (res.success && res.data) {
        updateUserWallet(res.data.senderDiamonds);
        setShowGiftPanel(false);

        socket.emit('send_gift_effect', {
          roomId: id,
          gift,
          senderUsername: user.username,
          recipientUsername: room.host.username
        });

        socket.emit('send_room_msg', {
          roomId: id,
          message: res.data.message
        });
      } else {
        showToast(res.message || 'Gift purchase failed', 'error');
      }
    } catch {
      showToast('Transaction error', 'error');
    }
  };

  if (!room) {
    return (
      <div className="flex-grow p-6 flex flex-col justify-center gap-4">
        <LoadingSkeleton variant="circle" className="w-16 h-16 mx-auto" />
        <LoadingSkeleton className="h-6 w-40 mx-auto" />
        <LoadingSkeleton variant="card" />
      </div>
    );
  }

  return (
    <div className="flex-grow overflow-hidden flex flex-col relative pointer-events-auto h-full bg-[#060609]">
      
      {/* 1. Live Shifting Particle Video Feed */}
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-cover z-0" />

      {/* High Fidelity Screen Wide Gift Overlay */}
      {activeGiftEffect && (
        <div className="absolute inset-0 bg-black/60 z-[99] flex flex-col items-center justify-center pointer-events-none">
          <div className="text-center animate-gift-crown">
            <span className="text-8xl filter drop-shadow-[0_0_30px_rgba(255,100,255,0.7)] block mb-4 animate-bounce">
              {activeGiftEffect.icon}
            </span>
            <div className="text-sm font-black text-cyber-cyan text-glow-cyan uppercase tracking-widest">
              {activeGiftEffect.name} SHOWER
            </div>
          </div>
        </div>
      )}

      {/* Floating Hearts Overlay Layer */}
      <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
        {floatingHearts.map((heart) => (
          <span
            key={heart.id}
            style={{
              left: `${heart.x}%`,
              bottom: '80px',
              color: heart.color,
              textShadow: `0 0 10px ${heart.color}`
            }}
            className="absolute text-2xl select-none pointer-events-none animate-heart-float"
          >
            ❤️
          </span>
        ))}
      </div>

      {/* 2. Top Stream Info Header */}
      <div className="absolute top-4 inset-x-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="pointer-events-auto p-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/5 flex items-center gap-2 pr-4 shadow-lg">
          <img src={room.host.avatar} alt={room.host.username} className="w-8 h-8 rounded-full object-cover border border-white/10" />
          <div>
            <div className="text-[10px] font-black text-slate-100 truncate max-w-[80px]">@{room.host.username}</div>
            <div className="flex items-center gap-1 text-[8px] text-cyber-cyan font-bold uppercase tracking-wider mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyber-pink animate-pulse" />
              Live Stream
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="px-2.5 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/5 text-[9px] font-bold text-slate-300 flex items-center gap-1.5 shadow-lg">
            <Eye className="w-3.5 h-3.5 text-cyber-cyan" />
            {room.viewersCount}
          </div>
          {isHost && (
            <button
              onClick={handleEndStream}
              className="px-3 py-2 rounded-full bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-200 hover:bg-red-500/30 transition-all active:scale-95 shadow-lg"
            >
              End Stream
            </button>
          )}
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-full bg-rose-500/20 backdrop-blur-md border border-rose-500/30 text-rose-300 hover:bg-rose-500/30 transition-all active:scale-95 shadow-lg"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 3. Bottom public transparent comments overlay */}
      <div className="absolute bottom-16 inset-x-0 h-44 z-20 flex flex-col justify-end pointer-events-none p-4">
        <div className="overflow-y-auto max-h-full flex flex-col gap-1.5 scrollbar-none pointer-events-auto select-text pr-8">
          {messages.map((msg, i) => (
            <div
              key={msg._id || i}
              className="p-2 rounded-2xl bg-black/30 backdrop-blur-sm border border-white/5 text-[11px] max-w-[85%] self-start flex items-start gap-1.5 shadow-sm"
            >
              <span className="font-extrabold text-cyber-cyan">@{msg.sender.username}:</span>
              <span className={msg.isGift ? 'text-fuchsia-300 font-bold italic' : 'text-slate-300'}>
                {msg.content}
              </span>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 4. Floating Interaction Buttons Bar */}
      <div className="absolute bottom-2 inset-x-4 z-30 flex items-center gap-2 pointer-events-auto">
        <form onSubmit={handleSendMessage} className="flex-grow flex items-center bg-black/40 backdrop-blur-md border border-white/5 rounded-2xl px-3 py-1 shadow-lg">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            type="text"
            placeholder="Type comment..."
            className="flex-grow py-2.5 bg-transparent text-xs text-slate-100 placeholder-slate-500 focus:outline-none"
          />
          <button type="submit" className="text-cyber-cyan hover:text-cyan-300">
            <Send className="w-4 h-4" />
          </button>
        </form>

        <button
          onClick={() => setShowGiftPanel(true)}
          className="p-3 rounded-2xl bg-cyber-purple/20 backdrop-blur-md border border-cyber-purple/30 text-cyber-purple shadow-lg hover:scale-105 active:scale-95 transition-transform"
        >
          <GiftIcon className="w-4 h-4 fill-cyber-purple" />
        </button>

        <button
          onClick={handleEmitHeart}
          className="p-3 rounded-2xl bg-cyber-pink/20 backdrop-blur-md border border-cyber-pink/30 text-cyber-pink shadow-lg hover:scale-110 active:scale-90 transition-all"
        >
          <Heart className="w-4 h-4 fill-cyber-pink" />
        </button>
      </div>

      {/* virtual gift catalog sheet */}
      {showGiftPanel && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center pointer-events-auto">
          <div className="w-full bg-[#0a0a0f] border-t border-white/10 rounded-t-[30px] p-6 animate-[slideUp_0.3s_ease] z-50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">GIFT BROADCASTER</h3>
                <p className="text-[9px] text-slate-500 mt-0.5">Deducted from: 💎 {user?.diamonds || 0} diamonds</p>
              </div>
              <button onClick={() => setShowGiftPanel(false)} className="text-xs text-slate-500 hover:text-slate-300 font-bold">CANCEL</button>
            </div>

            <div className="grid grid-cols-5 gap-3 my-4">
              {gifts.map((g) => (
                <button
                  key={g._id}
                  onClick={() => handleSendGiftSubmit(g)}
                  className="flex flex-col items-center justify-center p-2 rounded-xl bg-glass-white/20 border border-white/5 hover:border-cyber-purple/40 hover:bg-glass-white/40 transition-all group"
                >
                  <span className="text-2xl group-hover:scale-115 transition-transform">{g.icon}</span>
                  <span className="text-[9px] font-bold text-slate-300 mt-1 truncate max-w-full">{g.name}</span>
                  <span className="text-[8px] font-black text-cyber-cyan mt-0.5">💎 {g.cost}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveStreamPage;
