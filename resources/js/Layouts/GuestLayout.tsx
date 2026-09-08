import { Link } from '@inertiajs/react';
import { ArrowLeft, ArrowUpRight, Check, HeartPulse } from 'lucide-react';
import { PropsWithChildren } from 'react';
import { visualAssets } from '@/data/visualAssets';

export default function Guest({ children }: PropsWithChildren) {
    return (
        <div className="min-h-screen bg-[#111827] text-slate-100 selection:bg-[#c8f169] selection:text-[#111827]">
            <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
                <section className="relative hidden overflow-hidden bg-[#1c2533] lg:block">
                    <img src={visualAssets.runner} alt="Pelari berlatih di luar ruangan" className="absolute inset-0 h-full w-full object-cover opacity-70 mix-blend-screen" />
                    <div className="absolute inset-0 bg-gradient-to-br from-[#111827]/95 via-[#111827]/55 to-[#fc4c02]/30" />
                    <div className="noise-layer pointer-events-none absolute inset-0 opacity-20" />

                    <div className="relative flex h-full flex-col justify-between p-10 xl:p-16">
                        <Link href="/" className="group flex items-center gap-3">
                            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#c8f169] font-athletic text-3xl text-[#111827] transition-transform group-hover:-rotate-6">C</span>
                            <span>
                                <span className="block font-athletic text-3xl leading-none tracking-tight text-white">CALORA</span>
                                <span className="mt-1 block text-[9px] font-bold uppercase tracking-[0.22em] text-slate-400">Field manual</span>
                            </span>
                        </Link>

                        <div className="max-w-xl">
                            <div className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#c8f169]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#c8f169]" />
                                A daily system for real life
                            </div>
                            <h1 className="display-tight text-6xl uppercase text-white xl:text-8xl">Train your rhythm.</h1>
                            <p className="mt-6 max-w-md text-sm leading-7 text-slate-300">
                                Satu tempat untuk membaca energi tubuh, bergerak dengan konsisten, dan makan lebih sadar.
                            </p>
                            <div className="mt-10 flex flex-wrap gap-3">
                                {['Live GPS', 'AI nutrition', 'Progress system'].map((item) => (
                                    <span key={item} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-bold text-white backdrop-blur">
                                        <Check className="h-3.5 w-3.5 text-[#c8f169]" />
                                        {item}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-white/15 pt-5 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                            <span>Move / Track / Eat</span>
                            <span className="flex items-center gap-2"><HeartPulse className="h-4 w-4 text-[#fc4c02]" /> Indonesia built</span>
                        </div>
                    </div>
                </section>

                <section className="flex min-h-screen flex-col bg-[#f4f2ed] text-slate-900">
                    <div className="flex items-center justify-between px-5 py-6 sm:px-10">
                        <Link href="/" className="flex items-center gap-2 lg:hidden">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#111827] font-athletic text-2xl text-[#c8f169]">C</span>
                            <span className="font-athletic text-2xl text-[#111827]">CALORA</span>
                        </Link>
                        <span className="ms-auto text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Personal performance system</span>
                    </div>

                    <div className="flex flex-1 items-center justify-center px-5 pb-10 sm:px-10">
                        <div className="w-full max-w-md">
                            {children}
                            <Link href="/" className="mt-8 inline-flex items-center gap-2 text-xs font-bold text-slate-400 transition hover:text-slate-900">
                                <ArrowLeft className="h-3.5 w-3.5" />
                                Kembali ke beranda
                                <ArrowUpRight className="h-3 w-3" />
                            </Link>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
