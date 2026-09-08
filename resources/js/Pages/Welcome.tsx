import { Head, Link } from '@inertiajs/react';
import PwaInstallPrompt from '@/Components/PwaInstallPrompt';
import {
    ArrowDownRight,
    ArrowRight,
    BarChart3,
    Camera,
    Check,
    CircleDot,
    Flame,
    MapPin,
    MoveUpRight,
    Play,
    ScanLine,
    Sparkles,
    Utensils,
} from 'lucide-react';
import { PageProps } from '@/types';
import { visualAssets } from '@/data/visualAssets';

const systemCards = [
    {
        index: '01',
        title: 'Move with data',
        description: 'Rekam sesi lari, jalan, sepeda, atau workout. Semua jarak, pace, durasi, dan kalori tersusun dalam satu timeline.',
        icon: MapPin,
        tone: 'bg-[#dff58d]',
    },
    {
        index: '02',
        title: 'Eat with context',
        description: 'Foto piringmu, baca menu Nusantara dengan AI, lalu cocokkan hasilnya dengan database TKPI.',
        icon: Camera,
        tone: 'bg-[#f7d9cc]',
    },
    {
        index: '03',
        title: 'See the pattern',
        description: 'Hubungkan energi masuk, energi keluar, progres berat, dan konsistensi latihan tanpa menebak-nebak.',
        icon: BarChart3,
        tone: 'bg-[#d8e5f0]',
    },
];

export default function Welcome({ auth }: PageProps) {
    const primaryHref = auth.user ? route('dashboard') : route('register');

    return (
        <div className="min-h-screen overflow-hidden bg-[#f4f2ed] text-[#111827] selection:bg-[#c8f169] selection:text-[#111827]">
            <Head title="Calora - Train your rhythm" />

            <nav className="sticky top-0 z-50 border-b border-slate-200/80 bg-[#f4f2ed]/90 backdrop-blur-xl">
                <div className="mx-auto flex h-[76px] max-w-[1440px] items-center justify-between gap-6 px-5 sm:px-8 lg:px-12">
                    <Link href="/" className="group flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111827] font-athletic text-2xl text-[#c8f169] transition-transform group-hover:-rotate-6">C</span>
                        <span>
                            <span className="block font-athletic text-2xl leading-none tracking-tight">CALORA</span>
                            <span className="mt-1 block text-[8px] font-black uppercase tracking-[0.22em] text-slate-500">Field manual</span>
                        </span>
                    </Link>

                    <div className="hidden items-center gap-8 text-xs font-bold text-slate-500 md:flex">
                        <a href="#system" className="transition hover:text-slate-950">The system</a>
                        <a href="#signals" className="transition hover:text-slate-950">Signals</a>
                        <a href="#method" className="transition hover:text-slate-950">Method</a>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                        {auth.user ? (
                            <Link href={route('dashboard')} className="inline-flex items-center gap-2 rounded-full bg-[#111827] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#fc4c02]">
                                Open dashboard <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        ) : (
                            <>
                                <Link href={route('login')} className="rounded-full px-3 py-2 text-xs font-bold text-slate-500 transition hover:text-slate-950">Sign in</Link>
                                <Link href={route('register')} className="rounded-full bg-[#111827] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-white transition hover:bg-[#fc4c02]">Start free</Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            <main>
                <section className="relative mx-auto max-w-[1440px] px-5 pb-16 pt-12 sm:px-8 lg:px-12 lg:pb-24 lg:pt-20">
                    <div className="grid items-end gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
                        <div className="relative z-10 max-w-2xl">
                            <div className="mb-7 flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.22em] text-[#fc4c02]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#fc4c02]" />
                                Your daily performance system
                            </div>
                            <h1 className="display-tight max-w-xl text-7xl uppercase sm:text-8xl lg:text-[9.5rem]">Train your rhythm.</h1>
                            <p className="mt-8 max-w-lg text-base leading-8 text-slate-600 sm:text-lg">
                                Calora menyatukan latihan, nutrisi, dan progres dalam satu sistem yang terasa manusiawi. Bukan untuk mengejar angka sempurna, tetapi untuk membaca pola yang bisa kamu jalani.
                            </p>
                            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                                <Link href={primaryHref} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#111827] px-6 py-4 text-sm font-black text-white transition hover:bg-[#fc4c02]">
                                    Mulai dengan baseline <ArrowRight className="h-4 w-4" />
                                </Link>
                                <a href="#system" className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-300 bg-white/50 px-6 py-4 text-sm font-bold text-slate-700 transition hover:border-slate-900 hover:text-slate-950">
                                    Lihat cara kerja <ArrowDownRight className="h-4 w-4" />
                                </a>
                            </div>
                            <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 border-t border-slate-300 pt-5 text-[10px] font-black uppercase tracking-[0.16em] text-slate-500">
                                <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#fc4c02]" /> Browser GPS</span>
                                <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#fc4c02]" /> TKPI nutrition</span>
                                <span className="flex items-center gap-2"><Check className="h-3.5 w-3.5 text-[#fc4c02]" /> Free to start</span>
                            </div>
                        </div>

                        <div className="relative min-h-[510px] overflow-hidden rounded-[2rem] bg-[#111827] shadow-2xl shadow-slate-900/15 sm:min-h-[620px]">
                            <img src={visualAssets.runner} alt="Atlet berlari di jalan luar ruangan" className="absolute inset-0 h-full w-full object-cover opacity-80" />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#111827] via-[#111827]/10 to-transparent" />
                            <div className="noise-layer pointer-events-none absolute inset-0 opacity-20" />
                            <div className="absolute left-5 top-5 flex items-center gap-2 rounded-full border border-white/20 bg-[#111827]/60 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white backdrop-blur sm:left-7 sm:top-7">
                                <CircleDot className="h-3.5 w-3.5 text-[#c8f169]" />
                                Live field note / 07:42
                            </div>
                            <div className="absolute bottom-6 left-5 right-5 sm:bottom-8 sm:left-8 sm:right-8">
                                <div className="flex items-end justify-between gap-5">
                                    <div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c8f169]">Today’s signal</span>
                                        <p className="mt-2 max-w-sm font-athletic text-4xl leading-[0.9] text-white sm:text-6xl">SHOW UP. THEN READ THE DATA.</p>
                                    </div>
                                    <div className="hidden h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[#c8f169] text-[#111827] sm:flex">
                                        <MoveUpRight className="h-6 w-6" />
                                    </div>
                                </div>
                                <div className="mt-7 grid grid-cols-3 gap-2 border-t border-white/20 pt-4 text-white">
                                    <div><span className="block text-[9px] font-bold uppercase tracking-widest text-slate-300">Distance</span><strong className="font-metric text-3xl">5.42</strong><span className="ms-1 text-[9px] font-bold text-slate-300">KM</span></div>
                                    <div><span className="block text-[9px] font-bold uppercase tracking-widest text-slate-300">Pace</span><strong className="font-metric text-3xl">5:13</strong><span className="ms-1 text-[9px] font-bold text-slate-300">/KM</span></div>
                                    <div><span className="block text-[9px] font-bold uppercase tracking-widest text-slate-300">Energy</span><strong className="font-metric text-3xl text-[#c8f169]">385</strong><span className="ms-1 text-[9px] font-bold text-slate-300">KCAL</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <section className="border-y border-slate-200 bg-white/60">
                    <div className="mx-auto grid max-w-[1440px] grid-cols-2 gap-px bg-slate-200 px-5 sm:grid-cols-4 sm:px-8 lg:px-12">
                        {[
                            ['01', 'Move', 'Live GPS sessions'],
                            ['02', 'Eat', 'TKPI-aware logging'],
                            ['03', 'Reflect', 'Progress over time'],
                            ['04', 'Repeat', 'A rhythm you own'],
                        ].map(([number, title, copy]) => (
                            <div key={number} className="bg-[#f4f2ed] px-4 py-6 sm:px-6">
                                <span className="text-[10px] font-black tracking-[0.2em] text-[#fc4c02]">{number}</span>
                                <span className="mt-4 block font-athletic text-2xl leading-none">{title}</span>
                                <span className="mt-1 block text-xs text-slate-500">{copy}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section id="system" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
                    <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#fc4c02]">The Calora system</span>
                            <h2 className="mt-5 max-w-md font-athletic text-5xl uppercase leading-[0.9] sm:text-7xl">Three signals. One clearer day.</h2>
                            <p className="mt-6 max-w-sm text-sm leading-7 text-slate-600">Flow yang terinspirasi dari aplikasi performa terbaik: action cepat di depan, konteks di tengah, dan refleksi yang bisa kamu gunakan besok.</p>
                        </div>
                        <div className="divide-y divide-slate-300 border-y border-slate-300">
                            {systemCards.map((card) => {
                                const Icon = card.icon;

                                return (
                                    <div key={card.index} className="group grid gap-5 py-7 sm:grid-cols-[70px_1fr_auto] sm:items-center">
                                        <span className="font-metric text-3xl text-slate-400">{card.index}</span>
                                        <div>
                                            <h3 className="font-athletic text-3xl uppercase">{card.title}</h3>
                                            <p className="mt-2 max-w-lg text-sm leading-6 text-slate-500">{card.description}</p>
                                        </div>
                                        <span className={`flex h-14 w-14 items-center justify-center rounded-full ${card.tone} transition-transform group-hover:rotate-12`}><Icon className="h-6 w-6" strokeWidth={1.8} /></span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </section>

                <section id="signals" className="bg-[#111827] py-20 text-white sm:py-28">
                    <div className="mx-auto grid max-w-[1440px] gap-10 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-20 lg:px-12">
                        <div className="relative min-h-[460px] overflow-hidden rounded-[2rem] bg-[#263244]">
                            <img src={visualAssets.food} alt="Makanan sehat warna-warni dalam mangkuk" className="absolute inset-0 h-full w-full object-cover opacity-80" />
                            <div className="absolute inset-0 bg-gradient-to-tr from-[#111827]/90 via-transparent to-[#fc4c02]/10" />
                            <div className="absolute left-5 top-5 rounded-full bg-[#c8f169] px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-[#111827]">Food signal / TKPI</div>
                            <div className="absolute bottom-5 left-5 right-5 grid grid-cols-2 gap-3 sm:bottom-7 sm:left-7 sm:right-7">
                                <div className="rounded-2xl border border-white/15 bg-[#111827]/70 p-4 backdrop-blur"><span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Detected plate</span><strong className="mt-2 block font-athletic text-3xl">Nasi + greens</strong></div>
                                <div className="rounded-2xl border border-white/15 bg-[#111827]/70 p-4 backdrop-blur"><span className="text-[9px] font-bold uppercase tracking-widest text-slate-300">Estimate</span><strong className="mt-2 block font-metric text-3xl text-[#c8f169]">488 KCAL</strong></div>
                            </div>
                        </div>
                        <div className="max-w-xl">
                            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-[#c8f169]"><ScanLine className="h-4 w-4" /> Signals, not noise</span>
                            <h2 className="mt-5 font-athletic text-6xl uppercase leading-[0.88] sm:text-8xl">Know what fuels the next session.</h2>
                            <p className="mt-7 text-sm leading-7 text-slate-300">AI Food Scanner membantu membaca komponen makanan, sementara angka final tetap berpijak pada data nutrisi server-side. Lebih relevan untuk piring Indonesia, lebih mudah untuk dipakai setiap hari.</p>
                            <div className="mt-8 grid grid-cols-2 gap-3 border-t border-white/15 pt-6">
                                <div><Sparkles className="h-5 w-5 text-[#c8f169]" /><p className="mt-3 text-sm font-bold">AI membaca visual</p><p className="mt-1 text-xs leading-5 text-slate-400">Nama dan komponen piring.</p></div>
                                <div><Utensils className="h-5 w-5 text-[#fc4c02]" /><p className="mt-3 text-sm font-bold">TKPI menghitung</p><p className="mt-1 text-xs leading-5 text-slate-400">Kalori dan makro yang dapat dilacak.</p></div>
                            </div>
                        </div>
                    </div>
                </section>

                <section id="method" className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-12 lg:py-28">
                    <div className="grid gap-12 lg:grid-cols-[1fr_0.8fr] lg:items-end">
                        <div>
                            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#fc4c02]">The method</span>
                            <h2 className="mt-5 max-w-3xl font-athletic text-6xl uppercase leading-[0.88] sm:text-8xl">Less guilt. More signal.</h2>
                        </div>
                        <p className="max-w-sm text-sm leading-7 text-slate-600">Calora tidak memaksa satu versi tubuh atau satu cara berlatih. Sistemnya hanya membantu kamu membuat keputusan berikutnya dengan konteks yang lebih baik.</p>
                    </div>
                    <div className="mt-12 grid gap-4 sm:grid-cols-3">
                        {[
                            { icon: Play, title: 'Start', copy: 'Mulai sesi tanpa friksi.' },
                            { icon: Flame, title: 'Balance', copy: 'Lihat energi masuk dan keluar.' },
                            { icon: ArrowRight, title: 'Continue', copy: 'Bangun ritme yang realistis.' },
                        ].map((item) => {
                            const Icon = item.icon;

                            return <div key={item.title} className="rounded-[1.5rem] border border-slate-300 bg-white p-6"><Icon className="h-6 w-6 text-[#fc4c02]" /><span className="mt-12 block font-athletic text-4xl uppercase">{item.title}</span><p className="mt-2 text-sm text-slate-500">{item.copy}</p></div>;
                        })}
                    </div>
                </section>

                <section className="px-5 pb-10 sm:px-8 lg:px-12">
                    <div className="relative mx-auto max-w-[1440px] overflow-hidden rounded-[2rem] bg-[#c8f169] px-6 py-12 sm:px-12 sm:py-16 lg:px-20">
                        <div className="relative z-10 max-w-2xl"><span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#111827]/60">Your next baseline starts here</span><h2 className="mt-5 font-athletic text-6xl uppercase leading-[0.85] text-[#111827] sm:text-8xl">Make the next day easier.</h2><Link href={primaryHref} className="mt-8 inline-flex items-center gap-2 rounded-full bg-[#111827] px-6 py-4 text-sm font-black text-white transition hover:bg-[#fc4c02]">Bangun sistemmu <ArrowRight className="h-4 w-4" /></Link></div>
                        <div className="absolute -right-8 -top-12 hidden h-72 w-72 rounded-full border-[40px] border-[#b0d955] lg:block" />
                        <div className="absolute bottom-0 right-16 hidden lg:block"><div className="font-athletic text-[11rem] leading-none text-[#b0d955]">C</div></div>
                    </div>
                </section>
            </main>

            <footer className="mx-auto flex max-w-[1440px] flex-col gap-3 px-5 py-8 text-[10px] font-black uppercase tracking-[0.18em] text-slate-400 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12">
                <span>Calora / Move with intent</span>
                <span>Built for everyday athletes</span>
            </footer>

            <PwaInstallPrompt />
        </div>
    );
}
