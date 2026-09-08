import React, { useState, useRef, useEffect } from 'react';
import { 
    Sparkles, 
    X, 
    Send, 
    Bot, 
    User as UserIcon, 
    Loader2, 
    ChevronDown, 
    Flame, 
    Utensils, 
    Activity 
} from 'lucide-react';

interface ChatMessage {
    id: string;
    sender: 'user' | 'assistant';
    text: string;
    timestamp: string;
}

export default function AiAssistantDrawer() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'welcome',
            sender: 'assistant',
            text: 'Halo! Saya Calora AI — asisten gizi & kebugaran pribadimu. Ada yang ingin kamu tanyakan seputar makanan atau latihan hari ini?',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
    ]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSendMessage = async (textToSend?: string) => {
        const query = textToSend || inputText;
        if (!query.trim() || loading) return;

        const userMsg: ChatMessage = {
            id: Date.now().toString(),
            sender: 'user',
            text: query,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setMessages((prev) => [...prev, userMsg]);
        setInputText('');
        setLoading(true);

        try {
            const token = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content
                || (document.cookie.match(/XSRF-TOKEN=([^;]+)/)?.[1] ? decodeURIComponent(document.cookie.match(/XSRF-TOKEN=([^;]+)/)![1]) : '');

            const res = await fetch(route('ai.chat'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': token,
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    message: query,
                    history: messages.map((m) => ({ sender: m.sender, text: m.text })),
                }),
            });

            const contentType = res.headers.get('content-type') || '';
            if (!contentType.includes('application/json')) {
                throw new Error(
                    res.status === 419
                        ? 'Sesi kadaluarsa. Silakan muat ulang halaman dan coba lagi.'
                        : `Server mengembalikan respons tidak valid (${res.status}).`
                );
            }

            const data = await res.json();
            if (!res.ok) {
                throw new Error(data.message || 'Gagal mendapatkan jawaban AI.');
            }
            const aiMsg: ChatMessage = {
                id: (Date.now() + 1).toString(),
                sender: 'assistant',
                text: data.reply || 'Maaf, terjadi kendala saat memproses jawaban.',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };
            setMessages((prev) => [...prev, aiMsg]);
        } catch (err) {
            console.error(err);
            setMessages((prev) => [
                ...prev,
                {
                    id: (Date.now() + 1).toString(),
                    sender: 'assistant',
                    text: 'Koneksi terputus. Silakan coba kirim pesan kembali.',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const suggestedPrompts = [
        'Aku habis olahraga, makan apa yang pas?',
        'Apakah protein saya hari ini cukup?',
        'Berapa sisa kalori saya hari ini?',
    ];

    return (
        <>
            {/* Floating Action Button (Positioned safely above mobile bottom bar) */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-[calc(5.75rem+env(safe-area-inset-bottom,0px))] right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 rounded-2xl bg-[#111827] border border-white/15 p-3.5 sm:p-4 text-white shadow-2xl hover:bg-[#1e293b] active:scale-95 transition-all group backdrop-blur-md"
                    aria-label="Buka Tanya Calora AI"
                    title="Tanya Calora AI"
                >
                    <div className="relative">
                        <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-[#c8f169]" />
                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c8f169] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#c8f169]"></span>
                        </span>
                    </div>
                    <span className="font-athletic text-sm tracking-wider hidden sm:inline text-white">
                        TANYA AI
                    </span>
                </button>
            )}

            {/* Mobile Backdrop Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm sm:hidden transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Chat Drawer: Mobile Bottom Sheet + Desktop Floating Card */}
            {isOpen && (
                <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:bottom-6 sm:right-6 z-50 w-full sm:w-[420px] sm:max-w-md h-[85vh] sm:h-[34rem] rounded-t-[2rem] sm:rounded-3xl bg-white border border-slate-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
                    {/* Mobile Sheet Drag Handle Pill */}
                    <div
                        className="py-2.5 sm:hidden flex justify-center cursor-pointer bg-[#111827]"
                        onClick={() => setIsOpen(false)}
                    >
                        <div className="w-12 h-1.5 bg-slate-500 rounded-full" />
                    </div>

                    {/* Header */}
                    <div className="bg-[#111827] px-5 py-4 text-white flex items-center justify-between border-b border-white/10">
                        <div className="flex items-center gap-3">
                            <div className="rounded-xl bg-white/10 p-2 backdrop-blur-sm border border-white/10">
                                <Sparkles className="h-5 w-5 text-[#c8f169]" />
                            </div>
                            <div>
                                <h3 className="font-athletic text-lg tracking-wider flex items-center gap-2">
                                    CALORA AI ASSISTANT
                                    <span className="rounded-full bg-[#c8f169]/20 px-2 py-0.5 text-[9px] font-black uppercase tracking-wider text-[#c8f169] border border-[#c8f169]/30">
                                        Free Tier
                                    </span>
                                </h3>
                                <p className="text-[11px] text-slate-400 font-medium">Ahli Gizi & Kebugaran Pribadimu</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="rounded-full p-1.5 text-slate-400 hover:bg-white/10 hover:text-white transition-colors"
                            aria-label="Tutup Calora AI"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#f8fafc]">
                        {messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`flex items-start gap-2.5 ${
                                    msg.sender === 'user' ? 'flex-row-reverse' : ''
                                }`}
                            >
                                <div
                                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                                        msg.sender === 'user'
                                            ? 'bg-[#111827] text-white'
                                            : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                >
                                    {msg.sender === 'user' ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4 text-emerald-700" />}
                                </div>

                                <div
                                    className={`max-w-[82%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm whitespace-pre-line ${
                                        msg.sender === 'user'
                                            ? 'bg-[#111827] text-white rounded-tr-none font-medium'
                                            : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                                    }`}
                                >
                                    {msg.text}
                                    <span
                                        className={`block text-[9px] mt-1 text-right font-medium ${
                                            msg.sender === 'user' ? 'text-slate-400' : 'text-slate-400'
                                        }`}
                                    >
                                        {msg.timestamp}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex items-center gap-2 text-xs text-slate-500 py-1 bg-white p-3 rounded-2xl border border-slate-100 max-w-[80%] shadow-sm">
                                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                                <span className="font-medium">Calora AI sedang menganalisis data...</span>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggested Prompt Chips */}
                    <div className="px-3 py-2 border-t border-slate-100 bg-white flex gap-1.5 overflow-x-auto no-scrollbar">
                        {suggestedPrompts.map((prompt, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleSendMessage(prompt)}
                                className="whitespace-nowrap rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 px-3 py-1.5 text-[11px] font-bold text-slate-600 transition-colors border border-transparent hover:border-emerald-200 shrink-0"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>

                    {/* Input Field with Safe Area Inset Padding */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage();
                        }}
                        className="p-3 border-t border-slate-100 bg-white flex items-center gap-2 pb-safe"
                        style={{ paddingBottom: 'calc(0.75rem + env(safe-area-inset-bottom, 0px))' }}
                    >
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Tanyakan saran makanan atau olahraga..."
                            className="flex-1 rounded-2xl border border-slate-200 px-4 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-slate-900 focus:ring-slate-900"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !inputText.trim()}
                            className="rounded-2xl bg-slate-950 p-2.5 text-white hover:bg-[#fc4c02] disabled:opacity-40 transition-all shadow-sm flex items-center justify-center shrink-0"
                            aria-label="Kirim Pesan"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
