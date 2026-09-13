import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, usePage } from '@inertiajs/react';
import {
    Activity,
    ArrowRight,
    Camera,
    CheckCircle2,
    ChevronRight,
    CircleGauge,
    Flame,
    HeartPulse,
    Play,
    Sparkles,
    Target,
    Utensils,
    X,
} from 'lucide-react';
import { useState } from 'react';
import { visualAssets } from '@/data/visualAssets';

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
    insight: { badge: string; message: string };
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

const goalLabels: Record<string, string> = {
    lose_weight: 'Fat loss',
    maintain_weight: 'Maintain',
    gain_muscle: 'Build muscle',
    improve_fitness: 'Build fitness',
};

function Metric({
    label,
    value,
    unit,
    tone = 'text-slate-950',
}: {
    label: string;
    value: string | number;
    unit: string;
    tone?: string;
}) {
    return (
        <div>
            <span className="block text-[11px] font-black uppercase tracking-wider text-slate-400">{label}</span>
            <span className={`mt-0.5 block font-metric text-3xl sm:text-4xl leading-none ${tone}`}>{value}</span>
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">{unit}</span>
        </div>
    );
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
    const { auth } = usePage<any>().props;
    const user = auth?.user;
    const firstName = user?.name ? user.name.trim().split(' ')[0].toUpperCase() : 'ATHLETE';

    const [showWhatToEatModal, setShowWhatToEatModal] = useState(false);
    const proteinPercent = Math.min(100, Math.round((balance.consumed_protein / balance.target_protein) * 100));
    const carbsPercent = Math.min(100, Math.round((balance.consumed_carbs / balance.target_carbs) * 100));
    const fatPercent = Math.min(100, Math.round((balance.consumed_fat / balance.target_fat) * 100));

    const getDynamicGreeting = () => {
        const hour = new Date().getHours();
        if (hour >= 4 && hour < 11) {
            return `SELAMAT PAGI, ${firstName}.`;
        }
        if (hour >= 11 && hour < 15) {
            return `SELAMAT SIANG, ${firstName}.`;
        }
        if (hour >= 15 && hour < 18.5) {
            return `SELAMAT SORE, ${firstName}.`;
        }
        return `SELAMAT MALAM, ${firstName}.`;
    };

    const getFormattedToday = () => {
        return new Date().toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
        });
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex min-w-0 items-center justify-between gap-3 w-full">
                    <div className="min-w-0 flex items-center gap-2 truncate">
                        <h1 className="truncate font-athletic text-xl sm:text-3xl leading-none text-slate-950 uppercase">
                            {getDynamicGreeting()}
                        </h1>
                        {streak > 0 && (
                            <span className="inline-flex rounded-full bg-[#dff58d] px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-slate-900 shadow-sm shrink-0">
                                🔥 {streak}D
                            </span>
                        )}
                    </div>
                    <div className="hidden sm:block text-[11px] font-black uppercase tracking-wider text-[#fc4c02] shrink-0">
                        {getFormattedToday()} · Field Note
                    </div>
                </div>
            }
        >
            <Head title="Dashboard - Calora" />

            <div className="mx-auto max-w-[1440px] space-y-5 px-4 py-5 sm:px-6 sm:py-6 lg:px-10 lg:py-8">
                {/* 1. Primary Tracking Grid: Energy Ledger + Readiness Overview */}
                <div className="grid gap-5 lg:grid-cols-12">
                    {/* Energy & Macro Ledger (7 cols on Desktop) */}
                    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm lg:col-span-7">
                        <div className="flex flex-col justify-between gap-3 border-b border-slate-100 pb-4 sm:flex-row sm:items-center">
                            <div>
                                <span className="text-[11px] font-black uppercase tracking-wider text-[#fc4c02]">
                                    Energy Ledger
                                </span>
                                <h2 className="mt-1 font-athletic text-3xl uppercase leading-none">
                                    Daily Balance
                                </h2>
                            </div>
                            <span className="inline-flex items-center gap-1.5 self-start rounded-full bg-slate-100 px-3.5 py-1.5 text-[11px] font-black uppercase tracking-wider text-slate-700">
                                <Target className="h-3.5 w-3.5 text-slate-500" />
                                Target {balance.target_calories.toLocaleString()} kcal
                            </span>
                        </div>

                        {/* 4 Metric Boxes */}
                        <div className="grid grid-cols-2 gap-3 py-5 sm:grid-cols-4">
                            <div className="rounded-xl bg-slate-50 p-3">
                                <Metric label="In" value={balance.consumed_calories} unit="kcal eaten" />
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3">
                                <Metric label="Out" value={`-${balance.burned_calories}`} unit="kcal burned" tone="text-[#fc4c02]" />
                            </div>
                            <div className="rounded-xl bg-slate-50 p-3">
                                <Metric label="Net" value={balance.net_calories} unit="net kcal" tone="text-slate-700" />
                            </div>
                            <div className="rounded-xl bg-[#dff58d] p-3 shadow-sm shadow-lime-900/10">
                                <Metric label="Remaining" value={balance.remaining_calories} unit="kcal left" tone="text-slate-950 font-black" />
                            </div>
                        </div>

                        {/* Macro Bars */}
                        <div className="space-y-3.5 border-t border-slate-100 pt-4">
                            <div>
                                <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-700">
                                    <span className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full bg-violet-500" />
                                        Protein
                                    </span>
                                    <span className="font-metric text-lg text-slate-900">
                                        {balance.consumed_protein} <span className="font-sans text-xs text-slate-400">/ {balance.target_protein}g</span>
                                        <span className="ms-2 rounded-full bg-violet-50 px-2 py-0.5 text-[10px] font-black text-violet-600">{proteinPercent}%</span>
                                    </span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full rounded-full bg-violet-500 transition-all duration-500" style={{ width: `${proteinPercent}%` }} />
                                </div>
                            </div>

                            <div>
                                <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-700">
                                    <span className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                                        Carbs
                                    </span>
                                    <span className="font-metric text-lg text-slate-900">
                                        {balance.consumed_carbs} <span className="font-sans text-xs text-slate-400">/ {balance.target_carbs}g</span>
                                        <span className="ms-2 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-black text-amber-600">{carbsPercent}%</span>
                                    </span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full rounded-full bg-amber-500 transition-all duration-500" style={{ width: `${carbsPercent}%` }} />
                                </div>
                            </div>

                            <div>
                                <div className="mb-1 flex items-center justify-between text-xs font-bold text-slate-700">
                                    <span className="flex items-center gap-2">
                                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
                                        Fat
                                    </span>
                                    <span className="font-metric text-lg text-slate-900">
                                        {balance.consumed_fat} <span className="font-sans text-xs text-slate-400">/ {balance.target_fat}g</span>
                                        <span className="ms-2 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-black text-rose-600">{fatPercent}%</span>
                                    </span>
                                </div>
                                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full rounded-full bg-rose-500 transition-all duration-500" style={{ width: `${fatPercent}%` }} />
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* Daily Readiness & Overview (5 cols on Desktop) */}
                    <section className="flex flex-col justify-between rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm lg:col-span-5">
                        <div>
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                                    Daily Readiness
                                </span>
                                <HeartPulse className="h-4 w-4 text-[#fc4c02]" />
                            </div>

                            <div className="mt-4 flex items-center justify-between gap-4">
                                <div>
                                    <span className="font-metric text-7xl leading-none text-slate-950 sm:text-8xl">
                                        {daily_score.score}
                                    </span>
                                    <span className="ms-1 text-xs font-black uppercase tracking-widest text-slate-400">/ 100</span>
                                </div>
                                <div className="space-y-2 text-right">
                                    <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
                                        <Activity className="h-3.5 w-3.5 text-[#fc4c02]" />
                                        Activity: <span className="font-metric text-base text-slate-900">{daily_score.activity_score}</span>
                                    </div>
                                    <br />
                                    <div className="inline-flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700">
                                        <Utensils className="h-3.5 w-3.5 text-emerald-600" />
                                        Nutrition: <span className="font-metric text-base text-slate-900">{daily_score.nutrition_score}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="mt-5 space-y-3">
                            <div className="rounded-xl border border-slate-100 bg-slate-50 p-3.5">
                                <span className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-slate-700">
                                    <CircleGauge className="h-3.5 w-3.5 text-[#fc4c02]" />
                                    Next Best Action
                                </span>
                                <p className="mt-1 text-xs font-semibold leading-relaxed text-slate-600">
                                    {daily_score.top_opportunity}
                                </p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-center">
                                <div className="rounded-xl bg-slate-50 p-2.5">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Jarak Minggu Ini</span>
                                    <span className="block font-metric text-2xl text-slate-900">{activity_summary.total_distance_km} km</span>
                                </div>
                                <div className="rounded-xl bg-slate-50 p-2.5">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Fokus Target</span>
                                    <span className="block font-metric text-2xl text-[#fc4c02]">{goalLabels[profile.goal] || 'Fitness'}</span>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                {/* 2. Ergonomic Quick Action Buttons (Thumb zone friendly on Mobile) */}
                <section className="grid grid-cols-3 gap-3">
                    <Link
                        href={route('nutrition.index')}
                        className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm transition hover:border-slate-900 active:scale-[0.98] sm:flex-row sm:justify-start sm:p-4"
                    >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f7d9cc] transition-transform group-hover:scale-105">
                            <Camera className="h-5 w-5 text-[#fc4c02]" />
                        </span>
                        <div className="min-w-0 text-center sm:text-left">
                            <strong className="block font-athletic text-xl leading-none sm:text-2xl">EAT</strong>
                            <span className="hidden text-xs text-slate-500 sm:block truncate">Scan / log meal</span>
                        </div>
                    </Link>

                    <Link
                        href={route('activities.index')}
                        className="group flex flex-col items-center justify-center gap-2 rounded-2xl bg-[#111827] p-3.5 text-white shadow-sm transition hover:bg-[#fc4c02] active:scale-[0.98] sm:flex-row sm:justify-start sm:p-4"
                    >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10 transition-transform group-hover:scale-105">
                            <Play className="h-4 w-4 fill-[#c8f169] text-[#c8f169]" />
                        </span>
                        <div className="min-w-0 text-center sm:text-left">
                            <strong className="block font-athletic text-xl leading-none sm:text-2xl">MOVE</strong>
                            <span className="hidden text-xs text-slate-300 sm:block truncate">Record GPS run</span>
                        </div>
                    </Link>

                    <button
                        type="button"
                        onClick={() => setShowWhatToEatModal(true)}
                        className="group flex flex-col items-center justify-center gap-2 rounded-2xl border border-slate-200/90 bg-white p-3.5 shadow-sm transition hover:border-slate-900 active:scale-[0.98] sm:flex-row sm:justify-start sm:p-4"
                    >
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#d8e5f0] transition-transform group-hover:scale-105">
                            <Sparkles className="h-5 w-5 text-slate-700" />
                        </span>
                        <div className="min-w-0 text-center sm:text-left">
                            <strong className="block font-athletic text-xl leading-none sm:text-2xl">MENU</strong>
                            <span className="hidden text-xs text-slate-500 sm:block truncate">AI Suggestion</span>
                        </div>
                    </button>
                </section>

                {/* 3. Compact Athletic Motivation Banner */}
                <section className="relative overflow-hidden rounded-2xl bg-[#111827] text-white shadow-md">
                    <img
                        src={visualAssets.trail}
                        alt="Outdoor trail texture"
                        className="absolute inset-y-0 right-0 h-full w-1/2 object-cover opacity-30"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/90 to-[#111827]/30" />
                    <div className="noise-layer pointer-events-none absolute inset-0 opacity-15" />
                    <div className="relative flex flex-col justify-between gap-4 p-5 sm:p-6 lg:flex-row lg:items-center">
                        <div className="max-w-xl">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#c8f169]">
                                <span className="h-1.5 w-1.5 rounded-full bg-[#c8f169]" />
                                Operating System
                            </div>
                            <h2 className="mt-2 font-athletic text-3xl uppercase leading-none sm:text-4xl">
                                Make the next move count.
                            </h2>
                            <p className="mt-2 text-xs leading-relaxed text-slate-300 sm:text-sm">
                                {insight.message}
                            </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-3">
                            <div className="rounded-xl bg-white/10 px-3.5 py-2 backdrop-blur-sm">
                                <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Sesi</span>
                                <span className="block font-metric text-2xl font-bold text-white">{activity_summary.count} sesi</span>
                            </div>
                            <Link
                                href={route('activities.index')}
                                className="inline-flex items-center gap-2 rounded-xl bg-[#c8f169] px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#111827] transition hover:bg-white active:scale-95"
                            >
                                <Play className="h-3 w-3 fill-current" />
                                Start GPS
                            </Link>
                        </div>
                    </div>
                </section>

                {/* 4. Feeds: Today's Movement & Nutrition Logs */}
                <div className="grid gap-5 lg:grid-cols-2">
                    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <span className="text-[11px] font-black uppercase tracking-wider text-[#fc4c02]">Movement log</span>
                                <h2 className="mt-1 font-athletic text-2xl uppercase sm:text-3xl">Today’s sessions</h2>
                            </div>
                            <Link href={route('activities.index')} className="text-xs font-black text-slate-500 transition hover:text-[#fc4c02]">
                                View all <ChevronRight className="inline h-3.5 w-3.5" />
                            </Link>
                        </div>
                        {today_activities.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {today_activities.map((act) => (
                                    <div key={act.id} className="flex items-center justify-between gap-4 py-3.5">
                                        <div>
                                            <strong className="block text-sm font-bold text-slate-900">{act.name}</strong>
                                            <span className="mt-0.5 block text-xs text-slate-500">
                                                {act.distance_m ? `${(act.distance_m / 1000).toFixed(2)} km · ` : ''}
                                                {Math.floor(act.duration_seconds / 60)} min
                                            </span>
                                        </div>
                                        <span className="flex items-center gap-1 font-metric text-xl text-[#fc4c02]">
                                            <Flame className="h-4 w-4" />
                                            {act.calories_burned}
                                            <small className="font-sans text-[10px] font-bold text-slate-400">KCAL</small>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-10 text-center">
                                <Activity className="mx-auto h-7 w-7 text-slate-300" />
                                <p className="mt-2.5 text-sm font-bold text-slate-600">No movement logged yet.</p>
                                <p className="mt-0.5 text-xs text-slate-400">Your next session belongs here.</p>
                            </div>
                        )}
                    </section>

                    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-6 shadow-sm">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <span className="text-[11px] font-black uppercase tracking-wider text-[#fc4c02]">Nutrition log</span>
                                <h2 className="mt-1 font-athletic text-2xl uppercase sm:text-3xl">Today’s plate</h2>
                            </div>
                            <Link href={route('nutrition.index')} className="text-xs font-black text-slate-500 transition hover:text-[#fc4c02]">
                                View all <ChevronRight className="inline h-3.5 w-3.5" />
                            </Link>
                        </div>
                        {today_logs.length > 0 ? (
                            <div className="divide-y divide-slate-100">
                                {today_logs.map((log) => (
                                    <div key={log.id} className="flex items-center justify-between gap-4 py-3.5">
                                        <div>
                                            <strong className="block text-sm font-bold capitalize text-slate-900">{log.meal_type}</strong>
                                            <span className="mt-0.5 block text-xs text-slate-500">
                                                {log.items?.length || 0} items · P {log.total_protein}g · C {log.total_carbs}g
                                            </span>
                                        </div>
                                        <span className="font-metric text-xl text-slate-900">
                                            {log.total_calories}
                                            <small className="ms-1 font-sans text-[10px] font-bold text-slate-400">KCAL</small>
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-10 text-center">
                                <Utensils className="mx-auto h-7 w-7 text-slate-300" />
                                <p className="mt-2.5 text-sm font-bold text-slate-600">No plate logged yet.</p>
                                <p className="mt-0.5 text-xs text-slate-400">Use the scanner to add your first meal.</p>
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {showWhatToEatModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/70 p-4 backdrop-blur-md">
                    <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-[#f4f2ed] p-5 shadow-2xl sm:p-7">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
                            <div>
                                <span className="text-[11px] font-black uppercase tracking-wider text-[#fc4c02]">Next best meal</span>
                                <h2 className="mt-1 font-athletic text-3xl uppercase sm:text-4xl">Eat with context.</h2>
                                <p className="mt-1 text-xs text-slate-500">Rekomendasi berdasarkan aktivitas dan sisa budget kalori.</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowWhatToEatModal(false)}
                                className="rounded-full p-2 text-slate-400 transition hover:bg-white hover:text-slate-900"
                                aria-label="Tutup rekomendasi"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="mt-4 rounded-2xl bg-[#dff58d] p-4 text-xs sm:text-sm font-semibold leading-6 text-slate-800">
                            {recommendations.context_summary}
                        </div>
                        <div className="mt-4 space-y-3">
                            {recommendations.recommendations.map((rec, index) => (
                                <div key={index} className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                                    <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                                        <h3 className="font-athletic text-2xl sm:text-3xl uppercase">{rec.title}</h3>
                                        <div className="flex gap-2">
                                            <span className="rounded-full bg-[#dff58d] px-2.5 py-1 text-xs font-black text-slate-900">
                                                {rec.total_calories} kcal
                                            </span>
                                            <span className="rounded-full bg-[#d8e5f0] px-2.5 py-1 text-xs font-black text-slate-900">
                                                {rec.total_protein}g protein
                                            </span>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-xs sm:text-sm leading-relaxed text-slate-600">{rec.reason}</p>
                                    <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3">
                                        {rec.items.map((item) => (
                                            <span key={item} className="inline-flex items-center gap-1 text-xs font-bold text-slate-600">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-[#fc4c02]" />
                                                {item}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <Link
                            href={route('nutrition.index')}
                            className="mt-5 flex items-center justify-center gap-2 rounded-full bg-[#111827] px-5 py-3.5 text-xs sm:text-sm font-black uppercase tracking-wider text-white transition hover:bg-[#fc4c02]"
                        >
                            <Camera className="h-4 w-4" /> Open nutrition log <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
