import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { 
    TrendingUp, 
    TrendingDown, 
    Scale, 
    Flame, 
    Award, 
    Plus, 
    X, 
    Zap, 
    Calendar,
    Target,
    Activity as ActivityIcon,
    Sparkles,
    Trophy,
    CheckCircle
} from 'lucide-react';
import { visualAssets } from '@/data/visualAssets';

const ProgressChartsSection = React.lazy(() => import('@/Components/ProgressChartsSection'));

interface WeightHistoryPoint {
    date: string;
    weight: number;
}

interface CalorieTrendPoint {
    date: string;
    consumed: number;
    burned: number;
    target: number;
    net: number;
}

interface ActivityTrendPoint {
    week: string;
    distance_km: number;
    duration_hours: number;
    calories: number;
}

interface AchievementItem {
    id: number;
    slug: string;
    title: string;
    description: string;
    icon: string;
    category: string;
    points: number;
    is_unlocked: boolean;
    unlocked_at?: string | null;
}

interface Props {
    profile: {
        weight_kg: number;
        goal: string;
        daily_calorie_target: number;
    };
    analytics: {
        weight: {
            current: number;
            starting: number;
            change: number;
            history: WeightHistoryPoint[];
        };
        calorie_trends: CalorieTrendPoint[];
        macro_averages: {
            protein: number;
            carbs: number;
            fat: number;
        };
        activity_trends: ActivityTrendPoint[];
        comparative_analysis: {
            distance_change_percent: number;
            pace_diff_seconds: number;
            insight: string;
        };
    };
    achievements: AchievementItem[];
}

export default function ProgressIndex({ profile, analytics, achievements }: Props) {
    const [showWeightModal, setShowWeightModal] = useState(false);

    const { data, setData, post, processing, reset, errors } = useForm({
        weight_kg: analytics.weight.current || 65,
        recorded_at: new Date().toISOString().slice(0, 10),
        notes: '',
    });

    const handleSaveWeight = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('progress.weight.store'), {
            onSuccess: () => {
                setShowWeightModal(false);
                reset();
            },
        });
    };

    const unlockedCount = achievements.filter((a) => a.is_unlocked).length;
    const totalPoints = achievements.filter((a) => a.is_unlocked).reduce((sum, a) => sum + a.points, 0);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="font-display font-black text-3xl tracking-tight text-slate-900">
                            PROGRESS & PERFORMANCE
                        </h2>
                        <p className="text-xs font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
                            Read the trend, not just the number
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowWeightModal(true)}
                            className="inline-flex items-center gap-1.5 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-all"
                        >
                            <Scale className="h-4 w-4" />
                            Catat Timbangan
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Progress Tracking & Analytics - Calora" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
                    <section className="relative overflow-hidden rounded-[1.75rem] bg-[#111827] text-white shadow-xl shadow-slate-900/10">
                        <img src={visualAssets.runner} alt="Atlet berlari untuk mengukur progres" className="absolute inset-y-0 right-0 h-full w-2/5 object-cover opacity-40" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/95 to-transparent" />
                        <div className="relative max-w-2xl px-6 py-8 sm:px-8 sm:py-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c8f169]">Performance review / weekly</span>
                            <h2 className="mt-4 font-athletic text-5xl uppercase leading-[0.88] sm:text-6xl">Progress is a pattern.</h2>
                            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">Gunakan data mingguan untuk melihat arah, bukan untuk menghakimi satu hari yang tidak sempurna.</p>
                        </div>
                    </section>

                    {/* Top Overview Cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Weight Metric */}
                        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Berat Saat Ini</span>
                                <Scale className="h-4 w-4 text-emerald-600" />
                            </div>
                            <div className="mt-2 flex items-baseline gap-1.5">
                                <span className="font-display font-black text-3xl sm:text-4xl text-slate-900">{analytics.weight.current}</span>
                                <span className="font-display font-bold text-xs text-slate-400 tracking-wider">KG</span>
                            </div>
                            <div className="mt-2 flex items-center gap-1.5 text-xs font-medium">
                                {analytics.weight.change < 0 ? (
                                    <span className="inline-flex items-center font-bold text-emerald-600">
                                        <TrendingDown className="h-3.5 w-3.5 mr-0.5" />
                                        {analytics.weight.change} kg
                                    </span>
                                ) : analytics.weight.change > 0 ? (
                                    <span className="inline-flex items-center font-bold text-amber-600">
                                        <TrendingUp className="h-3.5 w-3.5 mr-0.5" />
                                        +{analytics.weight.change} kg
                                    </span>
                                ) : (
                                    <span className="text-slate-400">Stabil (0 kg)</span>
                                )}
                                <span className="text-slate-400">sejak awal profil</span>
                            </div>
                        </div>

                        {/* Comparative Analysis Insight */}
                        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Performa Minggu Ini</span>
                                <ActivityIcon className="h-4 w-4 text-sky-600" />
                            </div>
                            <div className="mt-2 flex items-baseline gap-1">
                                <span className="font-display font-black text-3xl sm:text-4xl text-slate-900">
                                    {analytics.comparative_analysis.distance_change_percent > 0 ? '+' : ''}
                                    {analytics.comparative_analysis.distance_change_percent}%
                                </span>
                            </div>
                            <p className="mt-1 text-xs text-slate-400 font-medium line-clamp-2">
                                {analytics.comparative_analysis.insight}
                            </p>
                        </div>

                        {/* Macro Compliance */}
                        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Rata-rata Protein</span>
                                <Flame className="h-4 w-4 text-violet-500 fill-violet-500" />
                            </div>
                            <div className="mt-2 flex items-baseline gap-1.5">
                                <span className="font-display font-black text-3xl sm:text-4xl text-violet-700">{analytics.macro_averages.protein}</span>
                                <span className="font-display font-bold text-xs text-slate-400 tracking-wider">G / HARI</span>
                            </div>
                            <p className="mt-1 text-xs text-slate-400 font-medium">
                                K: {analytics.macro_averages.carbs}g · L: {analytics.macro_averages.fat}g
                            </p>
                        </div>

                        {/* Badges / Gamification */}
                        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Pencapaian & Lencana</span>
                                <Trophy className="h-4 w-4 text-amber-500" />
                            </div>
                            <div className="mt-2 flex items-baseline gap-1.5">
                                <span className="font-display font-black text-3xl sm:text-4xl text-slate-900">{unlockedCount}</span>
                                <span className="font-display font-bold text-xs text-slate-400 tracking-wider">/ {achievements.length} TERBUKA</span>
                            </div>
                            <div className="mt-1 flex items-center gap-1.5 text-xs text-emerald-700 font-bold">
                                <Sparkles className="h-3 w-3" />
                                {totalPoints} XP Akumulasi
                            </div>
                        </div>
                    </div>

                    {/* SECTION: 2 COLUMNS CHARTS & ACHIEVEMENTS (Lazy-loaded code split) */}
                    <React.Suspense fallback={
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-pulse">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="h-80 rounded-3xl bg-slate-200/60 p-6 border border-slate-200" />
                            ))}
                        </div>
                    }>
                        <ProgressChartsSection analytics={analytics} profile={profile}>
                            {/* SECTION: ACHIEVEMENTS & BADGES GRID */}
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm space-y-4 flex flex-col justify-between">
                                <div>
                                    <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <Award className="h-5 w-5 text-amber-500" />
                                            <h3 className="font-bold text-gray-900 text-base">Lencana Pencapaian (Badges)</h3>
                                        </div>
                                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                                            {unlockedCount} diraih
                                        </span>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mt-4">
                                        {achievements.map((ach) => (
                                            <div
                                                key={ach.id}
                                                className={`p-3.5 rounded-2xl border transition-all ${
                                                    ach.is_unlocked
                                                        ? 'border-amber-200 bg-amber-50/50 shadow-sm'
                                                        : 'border-gray-100 bg-gray-50/60 opacity-60'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <h4 className="font-bold text-xs text-gray-900">{ach.title}</h4>
                                                    {ach.is_unlocked && (
                                                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                                                            +{ach.points} XP
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-gray-500 mt-1 leading-relaxed">
                                                    {ach.description}
                                                </p>
                                                {ach.is_unlocked && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-bold mt-2">
                                                        <CheckCircle className="h-3 w-3 text-emerald-600" /> Terbuka: {ach.unlocked_at}
                                                    </span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <p className="text-[11px] text-gray-400 text-center pt-2">
                                    Konsisten catat olahraga & nutrisi harian untuk membuka lencana berikutnya!
                                </p>
                            </div>
                        </ProgressChartsSection>
                    </React.Suspense>
                </div>
            </div>

            {/* WEIGHT LOG MODAL */}
            {showWeightModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl space-y-6">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div className="flex items-center gap-2">
                                <Scale className="h-5 w-5 text-emerald-600" />
                                <h3 className="text-lg font-bold text-gray-900">Catat Timbangan Hari Ini</h3>
                            </div>
                            <button onClick={() => setShowWeightModal(false)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveWeight} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Berat Badan (kg)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    value={data.weight_kg}
                                    onChange={(e) => setData('weight_kg', Number(e.target.value))}
                                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500"
                                    placeholder="Contoh: 67.5"
                                    required
                                    autoFocus
                                />
                                {errors.weight_kg && <p className="text-xs text-red-600 mt-1">{errors.weight_kg}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Tanggal Timbang</label>
                                <input
                                    type="date"
                                    value={data.recorded_at}
                                    onChange={(e) => setData('recorded_at', e.target.value)}
                                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Catatan Kondisi (Opsional)</label>
                                <input
                                    type="text"
                                    value={data.notes}
                                    onChange={(e) => setData('notes', e.target.value)}
                                    placeholder="Cth: Pagi hari setelah bangun tidur, perut kosong"
                                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500"
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-500 transition-all"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Timbangan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
