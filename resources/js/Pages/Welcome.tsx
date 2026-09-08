import { PageProps } from '@/types';
import { Head, Link } from '@inertiajs/react';
import { 
    Activity, 
    Camera, 
    Flame, 
    Sparkles, 
    MapPin, 
    Utensils, 
    ArrowRight, 
    ShieldCheck, 
    HeartPulse,
    Award
} from 'lucide-react';

export default function Welcome({ auth }: PageProps) {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-emerald-500 selection:text-white">
            <Head title="Calora - Move. Track. Eat Better." />

            {/* Top Navigation */}
            <nav className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-50">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 font-black text-slate-950 text-xl shadow-lg shadow-emerald-500/20">
                            C
                        </span>
                        <span className="font-extrabold text-2xl tracking-tight text-white">
                            CALORA
                        </span>
                    </div>

                    <div className="flex items-center gap-3">
                        {auth.user ? (
                            <Link
                                href={route('dashboard')}
                                className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-all shadow-md"
                            >
                                Buka Dashboard &rarr;
                            </Link>
                        ) : (
                            <>
                                <Link
                                    href={route('login')}
                                    className="rounded-xl px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
                                >
                                    Masuk
                                </Link>
                                <Link
                                    href={route('register')}
                                    className="rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-all shadow-md"
                                >
                                    Daftar Gratis
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <main>
                <section className="relative overflow-hidden pt-20 pb-28">
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-emerald-900/30 via-slate-950 to-slate-950 pointer-events-none" />
                    
                    <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
                        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 text-xs font-semibold text-emerald-400">
                            <Sparkles className="h-3.5 w-3.5" />
                            Activity Tracking + Indonesian Nutrition + AI Vision
                        </div>

                        <h1 className="mx-auto max-w-4xl text-4xl sm:text-6xl font-black tracking-tight text-white leading-tight">
                            Move. Track. <br />
                            <span className="bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 bg-clip-text text-transparent">
                                Eat Better.
                            </span>
                        </h1>

                        <p className="mx-auto max-w-2xl text-base sm:text-lg text-slate-400 leading-relaxed">
                            Calora menghubungkan aktivitas olahragamu dengan makanan yang kamu konsumsi. 
                            Dilengkapi <strong>AI Food Scanner masakan Indonesia</strong>, kalkulasi energi real-time, dan rekomendasi cerdas <em>"What Should I Eat?"</em>.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                            <Link
                                href={auth.user ? route('dashboard') : route('register')}
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-8 py-3.5 text-sm font-bold text-slate-950 shadow-lg shadow-emerald-500/25 hover:bg-emerald-400 transition-all transform hover:-translate-y-0.5"
                            >
                                Mulai Sekarang
                                <ArrowRight className="h-4 w-4" />
                            </Link>

                            <a
                                href="#features"
                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-800 bg-slate-900 px-7 py-3.5 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition-all"
                            >
                                Lihat Cara Kerja
                            </a>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section id="features" className="py-20 border-t border-slate-900 bg-slate-950/50">
                    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-12">
                        <div className="text-center space-y-3">
                            <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                                4 Pilar Utama Calora
                            </h2>
                            <p className="text-sm text-slate-400 max-w-lg mx-auto">
                                Bukan sekadar tracker biasa, Calora memberi arah nyata untuk kebugaran tubuhmu.
                            </p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Feature 1 */}
                            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-4 hover:border-emerald-500/50 transition-colors">
                                <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-400 w-fit">
                                    <Camera className="h-6 w-6" />
                                </div>
                                <h3 className="font-bold text-lg text-white">AI Food Scanner 📷</h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Cukup foto piring makananmu. AI mendeteksi komponen lauk khas Indonesia dan memberikan takaran kalori serta makronutrien yang bisa kamu koreksi.
                                </p>
                            </div>

                            {/* Feature 2 */}
                            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-4 hover:border-amber-500/50 transition-colors">
                                <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-400 w-fit">
                                    <Flame className="h-6 w-6" />
                                </div>
                                <h3 className="font-bold text-lg text-white">Dynamic Calorie Balance</h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Saat kamu membakar 420 kcal dari lari, Calora secara otomatis memperbarui budget energi harianmu. Tidak ada lagi tebak-tebakan.
                                </p>
                            </div>

                            {/* Feature 3 */}
                            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-4 hover:border-sky-500/50 transition-colors">
                                <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-400 w-fit">
                                    <MapPin className="h-6 w-6" />
                                </div>
                                 <h3 className="font-bold text-lg text-white">Live GPS Tracking 🏃</h3>
                                 <p className="text-xs text-slate-400 leading-relaxed">
                                     Lacak sesi lari, bersepeda, atau jalan langsung dari browser dengan visualisasi rute Leaflet OpenStreetMap.
                                </p>
                            </div>

                            {/* Feature 4 */}
                            <div className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 space-y-4 hover:border-orange-500/50 transition-colors">
                                <div className="rounded-2xl bg-orange-500/10 p-3 text-orange-400 w-fit">
                                    <Utensils className="h-6 w-6" />
                                </div>
                                <h3 className="font-bold text-lg text-white">"What Should I Eat?" 🍽️</h3>
                                <p className="text-xs text-slate-400 leading-relaxed">
                                    Habis olahraga dan bingung makan apa? Calora merekomendasikan menu lokal yang pas dengan sisa kalori dan target pemulihan proteinmu.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-slate-900 py-10 text-center text-xs text-slate-500">
                <p>&copy; {new Date().getFullYear()} CALORA. Data nutrisi didukung oleh TKPI (Kemenkes RI) & browser GPS tracking.</p>
            </footer>
        </div>
    );
}
