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
            {/* Floating Action Button */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 p-4 text-white shadow-xl hover:shadow-2xl hover:from-emerald-500 hover:to-teal-400 transition-all transform hover:-translate-y-1 group"
                >
                    <div className="relative">
                        <Sparkles className="h-6 w-6 animate-pulse text-amber-200" />
                        <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-300"></span>
                        </span>
                    </div>
                    <span className="font-bold text-sm hidden sm:inline">Tanya Calora AI</span>
                </button>
            )}

            {/* Chat Drawer */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-full max-w-sm sm:max-w-md h-[34rem] rounded-3xl bg-white border border-gray-200 shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 p-4 text-white flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                            <div className="rounded-xl bg-white/20 p-2 backdrop-blur-sm">
                                <Sparkles className="h-5 w-5 text-amber-200" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm flex items-center gap-1.5">
                                    Calora AI Assistant
                                    <span className="rounded bg-white/20 px-1.5 py-0.5 text-[10px] font-medium text-emerald-100">
                                        Active
                                    </span>
                                </h3>
                                <p className="text-[11px] text-emerald-100/80">Ahli Gizi & Kebugaran Pribadimu</p>
                            </div>
                        </div>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="rounded-full p-1.5 text-white/80 hover:bg-white/10 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Messages Container */}
                    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/60">
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
                                            ? 'bg-emerald-600 text-white'
                                            : 'bg-emerald-100 text-emerald-800'
                                    }`}
                                >
                                    {msg.sender === 'user' ? <UserIcon className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                                </div>

                                <div
                                    className={`max-w-[80%] rounded-2xl p-3 text-xs leading-relaxed shadow-sm whitespace-pre-line ${
                                        msg.sender === 'user'
                                            ? 'bg-emerald-600 text-white rounded-tr-none font-medium'
                                            : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                                    }`}
                                >
                                    {msg.text}
                                    <span
                                        className={`block text-[9px] mt-1 text-right ${
                                            msg.sender === 'user' ? 'text-emerald-200' : 'text-gray-400'
                                        }`}
                                    >
                                        {msg.timestamp}
                                    </span>
                                </div>
                            </div>
                        ))}

                        {loading && (
                            <div className="flex items-center gap-2 text-xs text-gray-400 py-1">
                                <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                                <span>Calora AI sedang menganalisa data...</span>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Suggested Prompt Chips */}
                    <div className="p-2 border-t border-gray-100 bg-white flex gap-1.5 overflow-x-auto no-scrollbar">
                        {suggestedPrompts.map((prompt, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleSendMessage(prompt)}
                                className="whitespace-nowrap rounded-xl bg-gray-100 hover:bg-emerald-50 hover:text-emerald-700 px-2.5 py-1 text-[11px] font-medium text-gray-600 transition-colors border border-transparent hover:border-emerald-200"
                            >
                                {prompt}
                            </button>
                        ))}
                    </div>

                    {/* Input Field */}
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            handleSendMessage();
                        }}
                        className="p-3 border-t border-gray-100 bg-white flex items-center gap-2"
                    >
                        <input
                            type="text"
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            placeholder="Tanyakan saran makanan atau olahraga..."
                            className="flex-1 rounded-xl border border-gray-200 px-3.5 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                            disabled={loading}
                        />
                        <button
                            type="submit"
                            disabled={loading || !inputText.trim()}
                            className="rounded-xl bg-emerald-600 p-2.5 text-white hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-sm"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}
