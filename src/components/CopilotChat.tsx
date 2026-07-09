import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Sparkles, MessageSquare, Bot, ArrowRight } from 'lucide-react';
import { MSME } from '../types';

interface CopilotChatProps {
  isOpen: boolean;
  onClose: () => void;
  msme: MSME | null;
}

interface ChatMessage {
  sender: 'user' | 'bot';
  text: string;
}

export const CopilotChat: React.FC<CopilotChatProps> = ({ isOpen, onClose, msme }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Suggested prompt chips
  const promptChips = [
    { label: "🔍 Explain current risk profile", text: "What are the primary credit risks for this business?" },
    { label: "📈 How to improve credit score", text: "Give me a prioritized roadmap to improve the credit health score." },
    { label: "🏛️ Applicable Government Schemes", text: "Which government credit schemes (like Mudra, CGTMSE) are suited for this MSME?" },
    { label: "💳 Loan eligibility detail", text: "What credit limit and interest rates do they qualify for, and why?" },
  ];

  useEffect(() => {
    if (msme) {
      setMessages([
        {
          sender: 'bot',
          text: `### CreditPulse AI CFO active for **${msme.name}**
          
I have indexed their alternate records (GSTIN: \`${msme.GSTIN}\`, Sector: \`${msme.sector}\`). 
* Current Credit Score: **${msme.score?.composite_score || 'N/A'}/100**
* Risk Profile: **${msme.score?.risk_band || 'N/A'} Risk**

Ask me anything about their cash flow stability, working capital, compliance details, or recommended loan products.`
        }
      ]);
    }
  }, [msme]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !msme) return;

    const userMessage: ChatMessage = { sender: 'user', text: textToSend };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch(`/api/msmes/${msme.id}/copilot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: textToSend,
          chatHistory: messages.slice(1),
        }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessages(prev => [...prev, { sender: 'bot', text: data.reply }]);
      } else {
        throw new Error(data.error || "Server error");
      }
    } catch (err: any) {
      setMessages(prev => [
        ...prev,
        {
          sender: 'bot',
          text: `❌ **Error Connecting to AI Engine**: ${err.message || 'Please check your connection or GEMINI_API_KEY.'}`
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatText = (text: string) => {
    return text.split('\n').map((line, idx) => {
      if (line.startsWith('### ')) {
        return <h4 key={idx} className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-3 mb-1 font-display uppercase tracking-wider">{line.replace('### ', '')}</h4>;
      }
      if (line.startsWith('## ')) {
        return <h3 key={idx} className="text-base font-bold text-slate-900 dark:text-slate-100 mt-4 mb-2 font-display">{line.replace('## ', '')}</h3>;
      }
      if (line.startsWith('# ')) {
        return <h2 key={idx} className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2 font-display">{line.replace('# ', '')}</h2>;
      }
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        const cleaned = line.replace(/^\s*[\*\-]\s+/, '');
        return (
          <ul key={idx} className="list-disc pl-4 space-y-1 my-1">
            <li className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {parseBold(cleaned)}
            </li>
          </ul>
        );
      }
      if (/^\s*\d+\.\s+/.test(line)) {
        const cleaned = line.replace(/^\s*\d+\.\s+/, '');
        const num = line.match(/^\s*(\d+)\.\s+/)?.[1] || '1';
        return (
          <ol key={idx} className="list-decimal pl-4 space-y-1 my-1">
            <li value={parseInt(num)} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
              {parseBold(cleaned)}
            </li>
          </ol>
        );
      }
      return line.trim() === '' ? <div key={idx} className="h-2" /> : <p key={idx} className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed my-1">{parseBold(line)}</p>;
    });
  };

  const parseBold = (text: string) => {
    const parts = text.split(/\*\*([^*]+)\*\*/g);
    return parts.map((part, i) => {
      if (i % 2 === 1) {
        if (part.startsWith('`') && part.endsWith('`')) {
          return <code key={i} className="px-1 py-0.5 font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded">{part.replace(/`/g, '')}</code>;
        }
        return <strong key={i} className="font-semibold text-slate-900 dark:text-white">{part}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i} className="px-1 py-0.5 font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded">{part.replace(/`/g, '')}</code>;
      }
      return part;
    });
  };

  const renderAvatar = () => {
    const risk = msme?.score?.risk_band || 'Medium';
    const isThinking = isLoading;
    
    let mouthPath = "M14 24s2 2 4 2 4-2 4-2"; // smiling
    let avatarBg = "from-emerald-500/10 to-teal-500/10 border-brand-green-500/25";
    let statusColor = "bg-brand-green-500";
    
    if (risk === 'Medium') {
      mouthPath = "M14 24h8"; // neutral
      avatarBg = "from-amber-500/10 to-orange-500/10 border-brand-saffron-500/25";
      statusColor = "bg-brand-saffron-500";
    } else if (risk === 'High') {
      mouthPath = "M14 26s2-2 4-2 4 2 4 2"; // frown
      avatarBg = "from-rose-500/10 to-red-500/10 border-rose-500/25";
      statusColor = "bg-rose-500";
    }

    if (isThinking) {
      mouthPath = "M15 25 a 3 3 0 0 0 6 0"; // speaking oval
    }

    return (
      <div className={`p-3 bg-gradient-to-r ${avatarBg} border-b border-slate-100 dark:border-slate-800 flex items-center gap-3 shrink-0`}>
        <div className="relative">
          <svg width="40" height="40" viewBox="0 0 36 36" fill="none" className="rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm animate-float animate-pulse-slow">
            <circle cx="18" cy="18" r="14" fill="#f8fafc" className="dark:fill-slate-800" />
            <circle cx="13" cy="16" r="1.5" fill="#334155" className="dark:fill-slate-300" />
            <circle cx="23" cy="16" r="1.5" fill="#334155" className="dark:fill-slate-300" />
            <path d={mouthPath} stroke="#334155" strokeWidth="2" strokeLinecap="round" className="dark:stroke-slate-300 transition-all duration-300" />
            <path d="M 8 18 A 10 10 0 0 1 28 18" stroke="#0B6E4F" strokeWidth="1" strokeDasharray="3 3" strokeOpacity="0.4" />
          </svg>
          <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full ${statusColor} border-2 border-white dark:border-slate-900 ${isThinking ? 'animate-ping' : ''}`} />
        </div>
        <div className="text-[10px] leading-snug">
          <span className="font-bold text-slate-800 dark:text-slate-200 block">Avatar CFO Advisor</span>
          <span className="text-slate-400">
            {isThinking ? 'Avatar is thinking...' : `Status: Active (${risk} Risk Expression)`}
          </span>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-40 flex justify-end">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Chat Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="relative w-full max-w-md h-full bg-white dark:bg-slate-900 shadow-2xl border-l border-slate-200 dark:border-slate-800 flex flex-col z-10"
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-brand-green-600 dark:bg-brand-green-700 flex items-center justify-center text-white shadow-md shadow-brand-green-500/10">
                  <Bot className="w-4.5 h-4.5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold font-display text-slate-900 dark:text-white flex items-center gap-1.5">
                    CreditPulse CFO Copilot
                    <Sparkles className="w-3.5 h-3.5 text-brand-saffron-500 animate-pulse" />
                  </h3>
                  <p className="text-[10px] text-brand-green-600 dark:text-brand-green-400 font-semibold uppercase tracking-wide">
                    Live Grounded Context Active
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 dark:hover:text-slate-200 rounded-lg transition-colors"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>

            {/* AI Avatar block */}
            {renderAvatar()}

            {/* Chat History */}
            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.sender === 'bot' && (
                    <div className="w-7 h-7 rounded-full bg-brand-green-100 dark:bg-brand-green-950 flex items-center justify-center text-brand-green-700 dark:text-brand-green-400 shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-brand-green-600 text-white dark:bg-brand-green-700 shadow-md shadow-brand-green-500/10 rounded-tr-none'
                        : 'bg-slate-50 border border-slate-100 dark:bg-slate-800/60 dark:border-slate-800/80 rounded-tl-none text-slate-800 dark:text-slate-200'
                    }`}
                  >
                    {msg.sender === 'user' ? <p>{msg.text}</p> : formatText(msg.text)}
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-full bg-brand-green-100 dark:bg-brand-green-950 flex items-center justify-center text-brand-green-700 dark:text-brand-green-400 shrink-0">
                    <Sparkles className="w-3.5 h-3.5 animate-spin" />
                  </div>
                  <div className="max-w-[80%] rounded-2xl p-3 bg-slate-50 border border-slate-100 dark:bg-slate-800/60 dark:border-slate-800/80 rounded-tl-none">
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Prompt Chips */}
            {messages.length <= 1 && (
              <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2 px-1">
                  Suggested CFO Inquiries
                </span>
                <div className="flex flex-wrap gap-2">
                  {promptChips.map((chip, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(chip.text)}
                      className="px-2.5 py-1.5 text-[10px] text-left font-medium bg-white border border-slate-200 hover:border-brand-green-400 text-slate-700 hover:text-brand-green-700 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300 dark:hover:border-brand-green-500 dark:hover:text-brand-green-400 rounded-xl transition-all shadow-xs flex items-center justify-between gap-1 w-full"
                    >
                      <span>{chip.label}</span>
                      <ArrowRight className="w-3 h-3 text-slate-300" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Input Form */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage(input);
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about compliance logs, cash runways..."
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-900 dark:text-white rounded-xl focus:outline-none focus:ring-1 focus:ring-brand-green-500"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="p-2 bg-brand-green-600 text-white hover:bg-brand-green-700 dark:bg-brand-green-700 dark:hover:bg-brand-green-800 disabled:opacity-50 rounded-xl transition-all shadow-md flex items-center justify-center shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default CopilotChat;
