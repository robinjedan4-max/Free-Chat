import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, ArrowLeft, ShieldAlert } from 'lucide-react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { User, Message } from '../../types';
import { LoadingSkeleton } from '../../components/common/LoadingSkeleton';

export const ChatPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [friends, setFriends] = useState<User[]>([]);
  const [activePartner, setActivePartner] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load mutual friends list
  useEffect(() => {
    const loadFriends = async () => {
      setLoading(true);
      try {
        const res = await api.getFriends();
        if (res.success && res.data) {
          setFriends(res.data);
        }
      } catch {
        showToast('Failed to load friends', 'error');
      } finally {
        setLoading(false);
      }
    };
    loadFriends();
  }, [showToast]);

  // Load DM logs when active chat partner changes
  useEffect(() => {
    if (!activePartner) return;

    const loadDMs = async () => {
      setLoadingMsgs(true);
      try {
        const res = await api.getDirectMessages(activePartner._id);
        if (res.success && res.data) {
          setMessages(res.data);
        }
      } catch {
        showToast('Error loading DM log', 'error');
      } finally {
        setLoadingMsgs(false);
      }
    };

    loadDMs();
  }, [activePartner, showToast]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendDM = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activePartner) return;

    try {
      const res = await api.sendDirectMessage(activePartner._id, inputText);
      if (res.success && res.data) {
        setMessages((prev) => [...prev, res.data]);
        setInputText('');
      } else {
        showToast('Failed to send message', 'error');
      }
    } catch {
      showToast('Error sending message', 'error');
    }
  };

  if (loading) {
    return (
      <div className="flex-grow p-6 flex flex-col gap-4">
        <LoadingSkeleton className="h-10" />
        <LoadingSkeleton variant="card" />
      </div>
    );
  }

  // Active Thread View
  if (activePartner) {
    return (
      <div className="flex-grow overflow-hidden flex flex-col pt-4 pb-2 relative pointer-events-auto h-full">
        {/* Chat Thread Header */}
        <div className="px-4 flex items-center gap-3 border-b border-white/5 pb-3">
          <button
            onClick={() => {
              setActivePartner(null);
              setMessages([]);
            }}
            className="p-2 rounded-xl bg-glass-white border border-white/5 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <img src={activePartner.avatar} alt={activePartner.username} className="w-8 h-8 rounded-full object-cover border border-white/10" />
          
          <div>
            <div className="text-xs font-black text-slate-100">@{activePartner.username}</div>
            <div className="text-[8px] text-cyber-cyan uppercase font-bold tracking-wider">Direct Message Connection</div>
          </div>
        </div>

        {/* Message Logs Thread */}
        <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3 scrollbar-none">
          {loadingMsgs ? (
            <div className="flex flex-col gap-2">
              <LoadingSkeleton className="h-8 w-2/3" />
              <LoadingSkeleton className="h-8 w-1/2 self-end" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center my-auto">
              <ShieldAlert className="w-6 h-6 text-slate-600 mx-auto mb-1.5" />
              <p className="text-[10px] text-slate-500 italic">This conversation is secure. Type below to say hi!</p>
            </div>
          ) : (
            messages.map((msg, i) => {
              const isOwn = msg.sender._id === user?._id;
              return (
                <div
                  key={msg._id || i}
                  className={`flex flex-col max-w-[80%] rounded-2xl p-3 text-xs shadow-sm
                    ${isOwn
                      ? 'self-end bg-cyber-purple/20 border border-cyber-purple/30 text-slate-200 rounded-tr-none'
                      : 'self-start bg-glass-white/20 border border-white/5 text-slate-300 rounded-tl-none'
                    }
                  `}
                >
                  <span className="font-medium leading-relaxed break-all select-text">{msg.content}</span>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Inputs Footer */}
        <form onSubmit={handleSendDM} className="p-3 bg-obsidian-900/60 border-t border-white/5 flex items-center gap-2">
          <input
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            type="text"
            placeholder="Type your message..."
            className="flex-1 py-2.5 px-4 bg-obsidian-900 border border-white/5 focus:border-cyber-cyan/30 rounded-xl text-xs text-slate-100 placeholder-slate-600 focus:outline-none"
          />
          <button
            type="submit"
            className="p-2.5 rounded-xl btn-cyber-primary text-obsidian active:scale-95 transition-all"
          >
            <Send className="w-3.5 h-3.5 fill-obsidian" />
          </button>
        </form>
      </div>
    );
  }

  // Friends Listing View
  return (
    <div className="flex-grow overflow-y-auto px-4 pt-4 pb-20 scrollbar-none relative pointer-events-auto">
      
      {/* Header title */}
      <div className="flex items-center gap-1.5 mb-5 border-b border-white/5 pb-3">
        <MessageSquare className="w-4 h-4 text-cyber-cyan" />
        <h2 className="text-xs font-black text-slate-100 uppercase tracking-widest">Private Direct Messages</h2>
      </div>

      {friends.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-12 text-center glass-pane rounded-3xl border-dashed border-white/5 my-auto h-60">
          <MessageSquare className="w-8 h-8 text-slate-600 mb-2" />
          <p className="text-xs text-slate-400 font-bold">No message connections yet</p>
          <p className="text-[10px] text-slate-500 mt-1 max-w-xs leading-relaxed">
            Follow creators mutually (mutual follow graph) to open active friend direct messaging channels!
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          {friends.map((friend) => (
            <div
              key={friend._id}
              onClick={() => setActivePartner(friend)}
              className="p-3 rounded-2xl glass-pane border-white/5 hover:border-cyber-cyan/30 flex items-center justify-between cursor-pointer transition-all duration-300 transform hover:scale-[1.01]"
            >
              <div className="flex items-center gap-3">
                <img src={friend.avatar} alt={friend.username} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                <div>
                  <div className="text-xs font-bold text-slate-200">@{friend.username}</div>
                  <div className="text-[9px] text-slate-500 mt-0.5 truncate max-w-[180px]">{friend.bio}</div>
                </div>
              </div>
              
              <div className="text-[8px] font-black text-cyber-cyan tracking-wider uppercase bg-cyber-cyan/10 border border-cyber-cyan/20 px-2 py-1 rounded-lg">
                MESSAGE
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ChatPage;
