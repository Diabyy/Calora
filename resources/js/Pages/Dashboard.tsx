import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
import { 
    Flame, 
    Zap, 
    Utensils, 
    Sparkles, 
    ChevronRight, 
    Camera, 
    Activity as ActivityIcon, 
    ArrowUpRight,
    TrendingUp,
    CheckCircle2,
    Clock,
    Award,
    HeartPulse,
    X
} from 'lucide-react';

interface Props {
    profile: {
        age: number;
        gender: string;
        height_cm: number;
        weight_kg: number;
        goal: string;
        bmr: number;
        tdee: number;
        daily_calorie_target: number;
        protein_target_g: number;
        carbs_target_g: number;
        fat_target_g: number;
    };
    streak?: number;
    balance: {
        target_calories: number;
        consumed_calories: number;
        burned_calories: number;
        net_calories: number;
        remaining_calories: number;
        consumed_protein: number;
        target_protein: number;
        consumed_carbs: number;
        target_carbs: number;
        consumed_fat: number;
        target_fat: number;
    };
    activity_summary: {
        total_distance_km: number;
        total_duration_minutes: number;
        count: number;
        latest?: any;
    };
    daily_score: {
        score: number;
        nutrition_score: number;
        activity_score: number;
        top_opportunity: string;
    };
    insight: {
        badge: string;
        message: string;
    };
    recommendations: {
        context_summary: string;
        recommendations: Array<{
            title: string;
            reason: string;
            total_calories: number;
            total_protein: number;
            total_carbs: number;
            total_fat: number;
            items: string[];
        }>;
    };
    today_activities: any[];
    today_logs: any[];
}

export default function Dashboard({
    profile,
    streak = 0,
    balance,
    activity_summary,
    daily_score,
    insight,
    recommendations,
    today_activities,
    today_logs,
}: Props) {
    const [showWhatToEatModal, setShowWhatToEatModal] = useState(false);

    const goalLabels: Record<string, string> = {
        lose_weight: 'Fat Loss (Defisit Kalori)',
        maintain_weight: 'Maintain Weight (Keseimbangan Kalori)',
        gain_muscle: 'Muscle Gain (Surplus & High Protein)',
        improve_fitness: 'Kebugaran & Stamina Aerobik',
    };

    const proteinPercent = Math.min(100, Math.round((balance.consumed_protein / balance.target_protein) * 100));
    const carbsPercent = Math.min(100, Math.round((balance.consumed_carbs / balance.target_carbs) * 100));
    const fatPercent = Math.min(100, Math.round((balance.consumed_fat / balance.target_fat) * 100));

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                                Calora Dashboard
                            </h2>
                            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
                                {goalLabels[profile.goal] || 'Fitness Goal'}
                            </span>
                            {streak > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-amber-700 border border-amber-200 shadow-sm animate-pulse">
                                    🔥 {streak} Days Active
                                </span>
                            )}
                        </div>
                        <p className="text-sm text-gray-500 mt-0.5">
                            Move. Track. Eat Better.
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowWhatToEatModal(true)}
                            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-xs font-bold text-white shadow-md hover:from-amber-400 hover:to-orange-400 transition-all hover:shadow-lg transform hover:-translate-y-0.5"
                        >
                            <Sparkles className="h-4 w-4" />
                            What Should I Eat? 🍽️
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard - Calora" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
                    {/* Calora Dynamic Insight Banner */}
                    <div className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-900 via-teal-900 to-emerald-950 p-6 text-white shadow-md relative overflow-hidden">
                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-2 max-w-3xl">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300 border border-emerald-400/30">
                                    <Sparkles className="h-3.5 w-3.5" />
                                    {insight.badge}
                                </span>
                                <p className="text-sm sm:text-base font-medium text-emerald-50 leading-relaxed">
                                    {insight.message}
                                </p>
                            </div>
                            <button
                                onClick={() => setShowWhatToEatModal(true)}
                                className="whitespace-nowrap self-start md:self-center inline-flex items-center gap-1 rounded-xl bg-white px-4 py-2 text-xs font-bold text-emerald-950 hover:bg-emerald-50 transition-all shadow"
                            >
                                Rekomendasi Menu
                                <ChevronRight className="h-3.5 w-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* CALORIE BALANCE & ENERGY METRICS */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Main Energy Balance Card */}
                        <div className="lg:col-span-2 rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm space-y-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h3 className="font-bold text-gray-900 text-lg">Daily Calorie Balance</h3>
                                    <p className="text-xs text-gray-400">Hubungan energi makanan masuk vs olahraga keluar</p>
                                </div>
                                <span className="text-xs font-semibold text-gray-500 bg-gray-50 px-3 py-1 rounded-lg border">
                                    Target Dasar: {balance.target_calories} kcal
                                </span>
                            </div>

                            {/* Flow calculation equation */}
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-2xl bg-gray-50/70 border border-gray-100 text-center">
                                <div>
                                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Makanan Masuk</p>
                                    <p className="text-2xl font-extrabold text-gray-900 mt-1">{balance.consumed_calories}</p>
                                    <span className="text-[10px] text-gray-400">kcal dikonsumsi</span>
                                </div>

                                <div>
                                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Olahraga Terbakar</p>
                                    <p className="text-2xl font-extrabold text-amber-500 mt-1">-{balance.burned_calories}</p>
                                    <span className="text-[10px] text-gray-400">kcal olahraga</span>
                                </div>

                                <div>
                                    <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Net Calories</p>
                                    <p className="text-2xl font-extrabold text-teal-700 mt-1">{balance.net_calories}</p>
                                    <span className="text-[10px] text-gray-400">kcal neto</span>
                                </div>

                                <div className="rounded-xl bg-white border border-emerald-200 p-2 shadow-sm">
                                    <p className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">Sisa Budget</p>
                                    <p className="text-2xl font-extrabold text-emerald-600 mt-1">{balance.remaining_calories}</p>
                                    <span className="text-[10px] text-emerald-700 font-medium">kcal tersisa</span>
                                </div>
                            </div>

                            {/* Macro Bars */}
                            <div className="space-y-4 pt-2">
                                <h4 className="font-semibold text-sm text-gray-800">Distribusi Makronutrien Hari Ini</h4>
                                
                                <div className="space-y-3">
                                    {/* Protein */}
                                    <div>
                                        <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                                            <span>Protein (Pemulihan Otot)</span>
                                            <span><strong>{balance.consumed_protein}g</strong> / {balance.target_protein}g ({proteinPercent}%)</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${proteinPercent}%` }} />
                                        </div>
                                    </div>

                                    {/* Carbs */}
                                    <div>
                                        <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                                            <span>Karbohidrat (Bahan Bakar Latihan)</span>
                                            <span><strong>{balance.consumed_carbs}g</strong> / {balance.target_carbs}g ({carbsPercent}%)</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-sky-500 rounded-full transition-all" style={{ width: `${carbsPercent}%` }} />
                                        </div>
                                    </div>

                                    {/* Fat */}
                                    <div>
                                        <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                                            <span>Lemak Esensial</span>
                                            <span><strong>{balance.consumed_fat}g</strong> / {balance.target_fat}g ({fatPercent}%)</span>
                                        </div>
                                        <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-rose-500 rounded-full transition-all" style={{ width: `${fatPercent}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Daily Score & Opportunity Card */}
                        <div className="rounded-3xl border border-gray-100 bg-white p-6 sm:p-8 shadow-sm flex flex-col justify-between space-y-6">
                            <div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400">Daily Calora Score</span>
                                    <HeartPulse className="h-4 w-4 text-emerald-600" />
                                </div>

                                <div className="mt-6 flex items-center justify-center">
                                    <div className="relative flex h-36 w-36 items-center justify-center rounded-full border-8 border-emerald-50 bg-emerald-50/20">
                                        <div className="text-center">
                                            <span className="text-4xl font-extrabold text-emerald-700">{daily_score.score}</span>
                                            <span className="block text-xs font-semibold text-emerald-600">/ 100</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-6 grid grid-cols-2 gap-2 text-center text-xs">
                                    <div className="rounded-xl bg-gray-50 p-2 border border-gray-100">
                                        <span className="text-gray-400 block text-[10px]">AKTIVITAS</span>
                                        <span className="font-bold text-gray-800 text-sm">{daily_score.activity_score}</span>
                                    </div>
                                    <div className="rounded-xl bg-gray-50 p-2 border border-gray-100">
                                        <span className="text-gray-400 block text-[10px]">NUTRISI</span>
                                        <span className="font-bold text-gray-800 text-sm">{daily_score.nutrition_score}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl bg-amber-50/70 border border-amber-200/60 p-4">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                                    <Award className="h-4 w-4 text-amber-600" />
                                    Fokus Peluang Hari Ini:
                                </div>
                                <p className="mt-1 text-xs text-amber-900 leading-relaxed font-medium">
                                    {daily_score.top_opportunity}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* QUICK ACTION BUTTONS */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Link
                            href={route('nutrition.index')}
                            className="group flex items-center justify-between rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 p-5 text-white shadow-sm hover:shadow-md transition-all"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="rounded-xl bg-white/20 p-2.5 backdrop-blur-sm">
                                    <Camera className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">AI Food Scanner 📷</h4>
                                    <p className="text-xs text-emerald-100">Foto & hitung kalori masakan</p>
                                </div>
                            </div>
                            <ArrowUpRight className="h-5 w-5 text-emerald-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </Link>

                        <Link
                            href={route('activities.index')}
                            className="group flex items-center justify-between rounded-2xl bg-white border border-gray-200 p-5 text-gray-800 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
                                    <ActivityIcon className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">Catat Latihan 🏃</h4>
                                     <p className="text-xs text-gray-400">Manual atau live GPS</p>
                                </div>
                            </div>
                            <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                        </Link>

                        <Link
                            href={route('onboarding.show')}
                            className="group flex items-center justify-between rounded-2xl bg-white border border-gray-200 p-5 text-gray-800 shadow-sm hover:border-emerald-500 hover:shadow-md transition-all"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="rounded-xl bg-orange-50 p-2.5 text-orange-600">
                                    <Flame className="h-6 w-6" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm">Target & Biometrik 🎯</h4>
                                    <p className="text-xs text-gray-400">BMR: {profile.bmr} · TDEE: {profile.tdee}</p>
                                </div>
                            </div>
                            <ArrowUpRight className="h-5 w-5 text-gray-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                        </Link>
                    </div>

                    {/* TWO COLUMNS: RECENT WORKOUTS & TODAY'S FOOD LOGS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Activities Today */}
                        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <ActivityIcon className="h-5 w-5 text-emerald-600" />
                                    <h3 className="font-bold text-gray-900 text-base">Olahraga Hari Ini</h3>
                                </div>
                                <Link href={route('activities.index')} className="text-xs font-semibold text-emerald-600 hover:underline">
                                    Lihat Semua &rarr;
                                </Link>
                            </div>

                            {today_activities.length > 0 ? (
                                <div className="divide-y divide-gray-100 mt-2">
                                    {today_activities.map((act) => (
                                        <div key={act.id} className="py-3.5 flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-sm text-gray-900">{act.name}</p>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {act.distance_m ? `${(act.distance_m / 1000).toFixed(2)} km · ` : ''}
                                                    {Math.floor(act.duration_seconds / 60)} menit
                                                </p>
                                            </div>
                                            <span className="text-sm font-bold text-amber-600">
                                                🔥 {act.calories_burned} kcal
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-xs text-gray-400">
                                    Belum ada olahraga hari ini. Catat latihan pertamamu!
                                </div>
                            )}
                        </div>

                        {/* Meals Today */}
                        <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">
                            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                                <div className="flex items-center gap-2">
                                    <Utensils className="h-5 w-5 text-emerald-600" />
                                    <h3 className="font-bold text-gray-900 text-base">Makanan Hari Ini</h3>
                                </div>
                                <Link href={route('nutrition.index')} className="text-xs font-semibold text-emerald-600 hover:underline">
                                    Buka Nutrition &rarr;
                                </Link>
                            </div>

                            {today_logs.length > 0 ? (
                                <div className="divide-y divide-gray-100 mt-2">
                                    {today_logs.map((log) => (
                                        <div key={log.id} className="py-3.5 flex items-center justify-between">
                                            <div>
                                                <span className="capitalize font-semibold text-sm text-gray-900 block">
                                                    {log.meal_type}
                                                </span>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {log.items?.length || 0} menu · P:{log.total_protein}g · K:{log.total_carbs}g
                                                </p>
                                            </div>
                                            <span className="text-sm font-bold text-gray-800">
                                                {log.total_calories} kcal
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-8 text-center text-xs text-gray-400">
                                    Belum ada makanan dicatat hari ini. Gunakan AI Scanner untuk memotret piringmu!
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* "WHAT SHOULD I EAT?" SIGNATURE MODAL */}
            {showWhatToEatModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-2xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto">
                        <div className="flex items-center justify-between border-b pb-4">
                            <div className="flex items-center gap-2.5">
                                <div className="rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 p-2 text-white">
                                    <Sparkles className="h-5 w-5" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">What Should I Eat? 🍽️</h3>
                                    <p className="text-xs text-gray-500">Rekomendasi berbasis aktivitas & sisa budget kalori harianmu.</p>
                                </div>
                            </div>
                            <button onClick={() => setShowWhatToEatModal(false)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Rationale Callout */}
                        <div className="rounded-2xl bg-amber-50/70 border border-amber-200/80 p-4 text-xs text-amber-950 leading-relaxed font-medium">
                            {recommendations.context_summary}
                        </div>

                        {/* Recommendations cards */}
                        <div className="space-y-4">
                            {recommendations.recommendations.map((rec, idx) => (
                                <div key={idx} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm hover:border-emerald-500 transition-all space-y-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <h4 className="font-bold text-base text-gray-900">{rec.title}</h4>
                                        <div className="flex items-center gap-2">
                                            <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">
                                                {rec.total_calories} kcal
                                            </span>
                                            <span className="rounded-lg bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
                                                {rec.total_protein}g Protein
                                            </span>
                                        </div>
                                    </div>

                                    <p className="text-xs text-gray-600 leading-relaxed">
                                        {rec.reason}
                                    </p>

                                    <div className="pt-2 border-t border-gray-100">
                                        <span className="text-[11px] font-semibold text-gray-400 block mb-1">KOMPONEN MENU:</span>
                                        <ul className="text-xs text-gray-700 space-y-1">
                                            {rec.items.map((item, i) => (
                                                <li key={i} className="flex items-center gap-1.5">
                                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-2">
                            <Link
                                href={route('nutrition.index')}
                                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-500 transition-all flex items-center justify-center gap-2"
                            >
                                <Camera className="h-4 w-4" />
                                Buka Nutrition & Catat Makanan Ini
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
