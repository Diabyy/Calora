import React, { useEffect, useState } from 'react';
import { Download, WifiOff, X, Sparkles } from 'lucide-react';
import { promptPwaInstall, subscribeToInstallPrompt, subscribeToOnlineStatus } from '@/pwa';

export default function PwaInstallPrompt() {
    const [canInstall, setCanInstall] = useState(false);
    const [isOnline, setIsOnline] = useState(true);
    const [isDismissed, setIsDismissed] = useState(false);

    useEffect(() => {
        const unsubInstall = subscribeToInstallPrompt((installable) => {
            setCanInstall(installable);
        });

        const unsubOnline = subscribeToOnlineStatus((online) => {
            setIsOnline(online);
        });

        // Check if user dismissed prompt earlier in session
        if (sessionStorage.getItem('calora:pwa-dismissed')) {
            setIsDismissed(true);
        }

        return () => {
            unsubInstall();
            unsubOnline();
        };
    }, []);

    const handleInstall = async () => {
        const accepted = await promptPwaInstall();
        if (accepted) {
            setCanInstall(false);
        }
    };

    const handleDismiss = () => {
        setIsDismissed(true);
        sessionStorage.setItem('calora:pwa-dismissed', 'true');
    };

    return (
        <>
            {/* 1. Offline Notification Strip */}
            {!isOnline && (
                <div className="fixed top-0 inset-x-0 z-50 bg-[#fc4c02] text-white px-4 py-2 text-xs font-bold flex items-center justify-center gap-2 shadow-md animate-pulse">
                    <WifiOff className="h-4 w-4" />
                    <span>Mode Luar Jaringan (Offline) — Live GPS tetap merekam dan tersimpan lokal di perangkat.</span>
                </div>
            )}

            {/* 2. PWA Install Bottom Card (Mobile & Desktop) */}
            {canInstall && !isDismissed && (
                <aside aria-label="Instalasi Aplikasi" className="fixed bottom-20 md:bottom-6 right-4 left-4 sm:left-auto sm:w-96 z-40">
                    <div className="rounded-3xl border border-white/10 bg-[#111827]/95 text-white p-4 shadow-2xl backdrop-blur-xl flex items-start gap-3.5">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#c8f169] font-athletic text-2xl text-[#111827]">
                            C
                        </span>

                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c8f169]">
                                    PWA Ready
                                </span>
                                <Sparkles className="h-3 w-3 text-[#c8f169]" />
                            </div>
                            <h2 className="text-sm font-black text-white truncate mt-0.5">
                                Pasang Aplikasi Calora
                            </h2>
                            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                                Buka langsung dari Home Screen smartphone tanpa browser bar.
                            </p>

                            <div className="mt-3 flex items-center gap-2">
                                <button
                                    onClick={handleInstall}
                                    className="inline-flex items-center gap-1.5 rounded-full bg-[#c8f169] px-4 py-1.5 text-xs font-black uppercase tracking-wider text-[#111827] transition hover:bg-white"
                                >
                                    <Download className="h-3.5 w-3.5" />
                                    Install
                                </button>
                                <button
                                    onClick={handleDismiss}
                                    className="rounded-full px-3 py-1.5 text-xs font-bold text-slate-400 hover:text-white transition"
                                >
                                    Nanti
                                </button>
                            </div>
                        </div>

                        <button
                            onClick={handleDismiss}
                            className="text-slate-500 hover:text-white transition p-1"
                            aria-label="Tutup"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </aside>
            )}
        </>
    );
}
