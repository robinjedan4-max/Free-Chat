import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Mic, MicOff, MessageSquare, LogOut, Send } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { useSocket } from '../../context/SocketContext';
import { Room, Message, Gift } from '../../types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export const VoiceRoomPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, updateUserWallet } = useAuth();
  const { showToast } = useToast();
  const { socket, joinRoom, leaveRoom } = useSocket();

  const [room, setRoom] = useState<Room | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [gifts, setGifts] = useState<Gift[]>([]);
  
  const [inputText, setInputText] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [speakingSeat, setSpeakingSeat] = useState<number | null>(null);
  const [showGiftPanel, setShowGiftPanel] = useState(false);
  const [selectedRecipientId, setSelectedRecipientId] = useState<string | null>(null);
  
  // High fidelity visual effect state
  const [activeGiftEffect, setActiveGiftEffect] = useState<{ icon: string; name: string; effect: string } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadRoomData = async () => {
      if (!id) return;
      try {
        const res = await api.getRooms();
        if (res.success && res.data) {
          const target = res.data.find((r: Room) => r._id === id);
          if (target) {
            setRoom(target);
          } else {
            showToast('Room not found', 'error');
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
        showToast('Error loading voice room', 'error');
      }
    };

    loadRoomData();
  }, [id, navigate, showToast]);

  // Hook up Socket.io connections
  useEffect(() => {
    if (!id || !user || !socket) return;

    joinRoom(id, user.username);

    // Listener for new comments
    socket.on('receive_room_msg', (newMsg: Message) => {
      setMessages((prev) => [...prev, newMsg]);
    });

    // Listener for room member counts
    socket.on('viewer_update', (data: { viewersCount: number; eventMsg: string }) => {
      setRoom((prev) => prev ? { ...prev, viewersCount: data.viewersCount } : null);
      showToast(data.eventMsg, 'info');
    });

    // Listener for gift effects
    socket.on('receive_gift_effect', (data: { gift: Gift; senderUsername: string; recipientUsername: string }) => {
      showToast(`${data.senderUsername} sent ${data.gift.name} ${data.gift.icon} to @${data.recipientUsername}!`, 'gift');
      
      // Trigger glowing particle splash on screen
      setActiveGiftEffect({
        icon: data.gift.icon,
        name: data.gift.name,
        effect: data.gift.effectClass
      });

      // Clear after 3.5s
      setTimeout(() => {
        setActiveGiftEffect(null);
      }, 3500);
    });

    // Listener for soundwave indicators
    socket.on('voice_active_broadcast', (data: { seatIndex: number; isActive: boolean }) => {
      if (data.isActive) {
        setSpeakingSeat(data.seatIndex);
      } else {
        setSpeakingSeat((prev) => prev === data.seatIndex ? null : prev);
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

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Simulate speaking waveform of guests on interval
  useEffect(() => {
    if (isMuted) return;

    // Find if the current user occupies any seat
    const userSeat = room?.seats.find((s) => s.user?._id === user?._id);
    if (!userSeat) return;

    const interval = setInterval(() => {
      const active = Math.random() > 0.4;
      if (socket && id) {
        socket.emit('voice_active', {
          roomId: id,
          seatIndex: userSeat.index,
          username: user?.username,
          isActive: active
        });
        setSpeakingSeat(active ? userSeat.index : null);
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      if (socket && id && userSeat) {
        socket.emit('voice_active', {
          roomId: id,
          seatIndex: userSeat.index,
          username: user?.username,
          isActive: false
        });
      }
    };
  }, [isMuted, room, user, socket, id]);

  const handleClaimSeat = async (seatIndex: number) => {
    if (!id) return;
    try {
      const res = await api.claimSeat(id, seatIndex);
      if (res.success && res.data) {
        setRoom((prev) => prev ? { ...prev, seats: res.data } : null);
        showToast(`You occupied Seat ${seatIndex + 1}! 🎙️`, 'success');
      } else {
        showToast(res.message || 'Could not claim seat', 'error');
      }
    } catch {
      showToast('Error occupying seat', 'error');
    }
  };

  const handleLeaveSeat = async () => {
    if (!id) return;
    try {
      const res = await api.leaveSeat(id);
      if (res.success && res.data) {
        setRoom((prev) => prev ? { ...prev, seats: res.data } : null);
        showToast('You left your seat.', 'info');
        setSpeakingSeat(null);
      }
    } catch {
      showToast('Error vacating seat', 'error');
    }
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

    // Emit comment to socket channel
    socket.emit('send_room_msg', {
      roomId: id,
      message: newMsgPayload
    });

    setInputText('');
  };

  const handleSendGiftSubmit = async (gift: Gift) => {
    if (!selectedRecipientId || !id || !user) return;

    try {
      const res = await api.sendGift({
        giftId: gift._id,
        recipientId: selectedRecipientId,
        roomId: id
      });

      if (res.success && res.data) {
        // Update user diamonds
        updateUserWallet(res.data.senderDiamonds);
        setShowGiftPanel(false);

        // Emit gift visual trigger to channel
        if (socket) {
          socket.emit('send_gift_effect', {
            roomId: id,
            gift,
            senderUsername: user.username,
            recipientUsername: room?.host._id === selectedRecipientId ? room.host.username : 'Guest'
          });

          // Also socket emit message
          socket.emit('send_room_msg', {
            roomId: id,
            message: res.data.message
          });
        }
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

  const isUserSeated = room.seats.some((s) => s.user?._id === user?._id);

  return (
    <div className="flex-grow overflow-hidden flex flex-col pt-4 pb-2 relative pointer-events-auto">
      
      {/* High Fidelity Screen Wide Neon Gift Splash */}
      {activeGiftEffect && (
        <div className="absolute inset-0 bg-black/40 z-[99] flex flex-col items-center justify-center pointer-events-none">
          <div className="text-center animate-gift-crown">
            <span className="text-8xl filter drop-shadow-[0_0_35px_rgba(255,215,0,0.8)] block mb-4">
              {activeGiftEffect.icon}
            </span>
            <div className="text-lg font-black text-cyber-cyan text-glow-cyan uppercase tracking-wider">
              {activeGiftEffect.name} ACTIVATED
            </div>
            <div className="text-[10px] text-fuchsia-300 uppercase tracking-widest mt-1">
              Ambient Aura Loaded
            </div>
          </div>
        </div>
      )}

      {/* Voice room header bar */}
      <div className="px-4 flex items-center justify-between border-b border-white/5 pb-3">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-xs font-black text-slate-100">{room.title}</h2>
            <span className="px-1.5 py-0.5 rounded bg-cyber-purple/20 border border-cyber-purple/30 text-[8px] font-black text-cyber-purple uppercase">
              🎙️ Voice
            </span>
          </div>
          <p className="text-[9px] text-slate-400 mt-0.5">🔥 {room.viewersCount} active viewers</p>
        </div>
        <button
          onClick={() => navigate('/dashboard')}
          className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 hover:bg-rose-500/20 transition-all active:scale-95"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

      {/* 8 Seats Grid (Host + Guests) */}
      <div className="p-4 grid grid-cols-4 gap-4 bg-obsidian-800/40 border-b border-white/5">
        {/* Host Seat - Large top position */}
        <div className="col-span-4 flex flex-col items-center gap-1.5 border border-dashed border-cyber-purple/30 rounded-2xl p-2.5 bg-glass-white/20">
          <div className="text-[8px] font-bold text-cyber-purple uppercase tracking-wider mb-1">Room Host</div>
          <div
            onClick={() => {
              setSelectedRecipientId(room.host._id);
              setShowGiftPanel(true);
            }}
            className={`relative p-0.5 rounded-full cursor-pointer transition-all duration-300
              ${speakingSeat === 0 ? 'border-2 border-cyber-cyan ring-4 ring-cyber-cyan/20 animate-pulse' : 'border border-cyber-purple/40'}
            `}
          >
            <img src={room.host.avatar} alt={room.host.username} className="w-12 h-12 rounded-full object-cover" />
            <span className="absolute -bottom-1 -right-1 bg-cyber-purple text-[8px] px-1 rounded-full font-black text-white shadow-md uppercase">
              HOST
            </span>
          </div>
          <span className="text-[10px] text-slate-300 font-bold">@{room.host.username}</span>
        </div>

        {/* 7 Guest Seats */}
        {room.seats.slice(1).map((seat) => {
          const isSeatTaken = !!seat.user;
          const isSpeaking = speakingSeat === seat.index;

          return (
            <div key={seat.index} className="flex flex-col items-center gap-1 flex-shrink-0">
              {isSeatTaken ? (
                <div
                  onClick={() => {
                    setSelectedRecipientId(seat.user!._id);
                    setShowGiftPanel(true);
                  }}
                  className={`relative p-0.5 rounded-full cursor-pointer transition-all duration-300
                    ${isSpeaking ? 'border-2 border-cyber-cyan ring-2 ring-cyber-cyan/25' : 'border border-white/10'}
                  `}
                >
                  <img src={seat.user!.avatar} alt={seat.user!.username} className="w-9 h-9 rounded-full object-cover" />
                  {seat.user!.vipLevel !== 'none' && (
                    <span className="absolute -bottom-1 -right-1 bg-cyber-purple text-[6px] px-0.5 rounded-full font-black text-white uppercase">
                      VIP
                    </span>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => !isUserSeated && handleClaimSeat(seat.index)}
                  disabled={isUserSeated}
                  className="w-10 h-10 rounded-full border border-dashed border-slate-700 bg-obsidian-900/60 hover:border-cyber-cyan/40 transition-colors flex items-center justify-center text-slate-500 disabled:opacity-30"
                >
                  +
                </button>
              )}
              <span className="text-[8px] text-slate-400 truncate max-w-[48px]">
                {isSeatTaken ? `@${seat.user!.username}` : `Seat ${seat.index + 1}`}
              </span>
            </div>
          );
        })}
      </div>

      {/* Seat vacuum bar */}
      {isUserSeated && (
        <div className="px-4 py-2 bg-glass-white/20 flex items-center justify-between border-b border-white/5">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-xl border transition-colors
                ${isMuted ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' : 'bg-cyber-cyan/10 border-cyber-cyan/20 text-cyber-cyan'}
              `}
            >
              {isMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>
            <span className="text-[10px] text-slate-300 font-bold uppercase">
              {isMuted ? 'MIC MUTED' : 'MIC TRANSMITTING LIVE'}
            </span>
          </div>
          <button
            onClick={handleLeaveSeat}
            className="text-[9px] px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors font-bold text-slate-300 uppercase"
          >
            Leave Seat
          </button>
        </div>
      )}

      {/* public room chat comments logs */}
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2 scrollbar-none">
        {messages.length === 0 ? (
          <div className="text-center my-auto">
            <MessageSquare className="w-6 h-6 text-slate-600 mx-auto mb-1.5" />
            <p className="text-[10px] text-slate-500 italic">No chat messages yet. Say hello!</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div key={msg._id || i} className="flex items-start gap-2 max-w-[90%] text-xs">
              <img src={msg.sender.avatar} alt={msg.sender.username} className="w-5 h-5 rounded-full object-cover mt-0.5" />
              <div>
                <span className="font-extrabold text-slate-300">@{msg.sender.username}: </span>
                <span className={msg.isGift ? 'text-fuchsia-300 font-bold italic' : 'text-slate-400'}>
                  {msg.content}
                </span>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Message Form */}
      <form onSubmit={handleSendMessage} className="p-3 bg-obsidian-900/60 border-t border-white/5 flex items-center gap-2">
        <input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          type="text"
          placeholder="Send a supportive message..."
          className="flex-1 py-2.5 px-4 bg-obsidian-900 border border-white/5 focus:border-cyber-cyan/30 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none"
        />
        <button
          type="submit"
          className="p-2.5 rounded-xl btn-cyber-primary text-obsidian active:scale-95 transition-all"
        >
          <Send className="w-3.5 h-3.5 fill-obsidian" />
        </button>
      </form>

      {/* virtual gift catalog panel */}
      {showGiftPanel && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center pointer-events-auto">
          <div className="w-full bg-[#0a0a0f] border-t border-white/10 rounded-t-[30px] p-6 animate-[slideUp_0.3s_ease]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-black text-slate-100 uppercase tracking-wider">SEND VIRTUAL REWARD</h3>
                <p className="text-[9px] text-slate-500 mt-0.5">Deducted from: 💎 {user?.diamonds || 0} diamonds</p>
              </div>
              <button
                onClick={() => {
                  setShowGiftPanel(false);
                  setSelectedRecipientId(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-300 font-bold"
              >
                CANCEL
              </button>
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
            <div className="text-center text-[8px] text-slate-500">
              Diamonds support the creator. Recipient keeps 80% reputation value.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceRoomPage;
