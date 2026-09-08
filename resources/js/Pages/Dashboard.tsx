import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link } from '@inertiajs/react';
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

function Metric({ label, value, unit, tone = 'text-slate-950' }: { label: string; value: string | number; unit: string; tone?: string }) {
    return (
        <div>
            <span className="block text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</span>
            <span className={`mt-1 block font-metric text-4xl leading-none ${tone}`}>{value}</span>
            <span className="mt-1 block text-[9px] font-bold uppercase tracking-widest text-slate-400">{unit}</span>
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
    const [showWhatToEatModal, setShowWhatToEatModal] = useState(false);
    const proteinPercent = Math.min(100, Math.round((balance.consumed_protein / balance.target_protein) * 100));
    const carbsPercent = Math.min(100, Math.round((balance.consumed_carbs / balance.target_carbs) * 100));
    const fatPercent = Math.min(100, Math.round((balance.consumed_fat / balance.target_fat) * 100));

    return (
        <AuthenticatedLayout
            header={
                <div className="flex min-w-0 items-center gap-3">
                    <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#fc4c02]">Tuesday / Field note</span>
                            {streak > 0 && <span className="rounded-full bg-[#dff58d] px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-900">{streak} day streak</span>}
                        </div>
                        <h1 className="mt-1 truncate font-athletic text-3xl leading-none text-slate-950 sm:text-4xl">GOOD MORNING, ATHLETE.</h1>
                    </div>
                </div>
            }
        >
            <Head title="Dashboard - Calora" />

            <div className="mx-auto max-w-[1440px] space-y-6 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
                <section className="relative overflow-hidden rounded-[2rem] bg-[#111827] text-white shadow-xl shadow-slate-900/10">
                    <img src={visualAssets.trail} alt="Jalur luar ruangan untuk berlari" className="absolute inset-y-0 right-0 h-full w-1/2 object-cover opacity-55" />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/95 to-[#111827]/25" />
                    <div className="noise-layer pointer-events-none absolute inset-0 opacity-15" />
                    <div className="relative grid gap-8 px-6 py-8 sm:px-8 sm:py-10 lg:grid-cols-[1fr_0.9fr] lg:items-end lg:px-12 lg:py-12">
                        <div className="max-w-xl">
                            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#c8f169]"><span className="h-1.5 w-1.5 rounded-full bg-[#c8f169]" /> Today’s operating system</div>
                            <h2 className="mt-5 font-athletic text-6xl uppercase leading-[0.84] sm:text-8xl">Make the next move count.</h2>
                            <p className="mt-6 max-w-lg text-sm leading-7 text-slate-300">{insight.message}</p>
                            <div className="mt-7 flex flex-wrap gap-3">
                                <Link href={route('activities.index')} className="inline-flex items-center gap-2 rounded-full bg-[#c8f169] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#111827] transition hover:bg-white"><Play className="h-3.5 w-3.5 fill-current" /> Start live GPS</Link>
                                <Link href={route('nutrition.index')} className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-5 py-3 text-xs font-black uppercase tracking-wider text-white backdrop-blur transition hover:bg-white hover:text-[#111827]"><Camera className="h-3.5 w-3.5" /> Scan a plate</Link>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 border-t border-white/20 pt-5 lg:border-l lg:border-t-0 lg:pl-8">
                            <Metric label="Distance" value={activity_summary.total_distance_km} unit="km this week" tone="text-white" />
                            <Metric label="Sessions" value={activity_summary.count} unit="logged" tone="text-white" />
                            <Metric label="Goal" value={goalLabels[profile.goal] || 'Fitness'} unit="current focus" tone="text-[#c8f169]" />
                        </div>
                    </div>
                </section>

                <div className="grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
                    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 sm:p-8">
                        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start">
                            <div><span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#fc4c02]">Energy ledger</span><h2 className="mt-2 font-athletic text-4xl uppercase leading-none">Daily balance</h2><p className="mt-2 text-xs text-slate-500">Satu pandangan untuk energi masuk dan energi keluar.</p></div>
                            <span className="inline-flex items-center gap-2 self-start rounded-full bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-wider text-slate-600"><Target className="h-3.5 w-3.5" /> Target {balance.target_calories} kcal</span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 py-7 sm:grid-cols-4">
                            <Metric label="In" value={balance.consumed_calories} unit="kcal" />
                            <Metric label="Out" value={`-${balance.burned_calories}`} unit="kcal" tone="text-[#fc4c02]" />
                            <Metric label="Net" value={balance.net_calories} unit="kcal" tone="text-slate-700" />
                            <div className="rounded-2xl bg-[#dff58d] p-3"><Metric label="Remaining" value={balance.remaining_calories} unit="kcal left" /></div>
                        </div>
                        <div className="space-y-4 border-t border-slate-200 pt-6">
                            <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-bold text-slate-600"><span className="h-2 w-2 rounded-full bg-violet-500" /> Protein</span><span className="font-metric text-xl text-slate-900">{balance.consumed_protein} / {balance.target_protein}g</span></div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-violet-500" style={{ width: `${proteinPercent}%` }} /></div>
                            <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-bold text-slate-600"><span className="h-2 w-2 rounded-full bg-amber-500" /> Carbs</span><span className="font-metric text-xl text-slate-900">{balance.consumed_carbs} / {balance.target_carbs}g</span></div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-500" style={{ width: `${carbsPercent}%` }} /></div>
                            <div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-bold text-slate-600"><span className="h-2 w-2 rounded-full bg-rose-500" /> Fat</span><span className="font-metric text-xl text-slate-900">{balance.consumed_fat} / {balance.target_fat}g</span></div>
                            <div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-rose-500" style={{ width: `${fatPercent}%` }} /></div>
                        </div>
                    </section>

                    <section className="relative overflow-hidden rounded-[1.75rem] bg-[#dff58d] p-6 sm:p-8">
                        <div className="flex items-center justify-between"><span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-700">Daily readiness</span><HeartPulse className="h-5 w-5 text-slate-900" /></div>
                        <div className="mt-10 flex items-end gap-3"><span className="font-metric text-8xl leading-none text-slate-950">{daily_score.score}</span><span className="pb-2 text-xs font-black uppercase tracking-widest text-slate-600">/ 100</span></div>
                        <div className="mt-8 grid grid-cols-2 gap-2 border-t border-slate-900/15 pt-4"><div><span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Activity</span><strong className="mt-1 block font-metric text-3xl">{daily_score.activity_score}</strong></div><div><span className="text-[9px] font-black uppercase tracking-widest text-slate-600">Nutrition</span><strong className="mt-1 block font-metric text-3xl">{daily_score.nutrition_score}</strong></div></div>
                        <div className="mt-8 rounded-2xl bg-white/50 p-4"><span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest"><CircleGauge className="h-4 w-4" /> Next best action</span><p className="mt-2 text-xs font-semibold leading-5 text-slate-700">{daily_score.top_opportunity}</p></div>
                    </section>
                </div>

                <section className="grid gap-3 sm:grid-cols-3">
                    <Link href={route('activities.index')} className="group flex items-center justify-between rounded-[1.5rem] bg-[#111827] p-5 text-white transition hover:bg-[#fc4c02]"><span className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10"><Activity className="h-5 w-5 text-[#c8f169]" /></span><span><strong className="block font-athletic text-2xl">MOVE</strong><small className="text-xs text-slate-300">Log a new session</small></span></span><ArrowRight className="h-5 w-5 transition group-hover:translate-x-1" /></Link>
                    <Link href={route('nutrition.index')} className="group flex items-center justify-between rounded-[1.5rem] bg-white p-5 text-slate-900 ring-1 ring-slate-200 transition hover:ring-slate-900"><span className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#f7d9cc]"><Utensils className="h-5 w-5 text-[#fc4c02]" /></span><span><strong className="block font-athletic text-2xl">EAT</strong><small className="text-xs text-slate-500">Scan or log a meal</small></span></span><ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1" /></Link>
                    <button type="button" onClick={() => setShowWhatToEatModal(true)} className="group flex items-center justify-between rounded-[1.5rem] bg-white p-5 text-left text-slate-900 ring-1 ring-slate-200 transition hover:ring-slate-900"><span className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#d8e5f0]"><Sparkles className="h-5 w-5 text-slate-700" /></span><span><strong className="block font-athletic text-2xl">NEXT</strong><small className="text-xs text-slate-500">Get a menu suggestion</small></span></span><ArrowRight className="h-5 w-5 text-slate-400 transition group-hover:translate-x-1" /></button>
                </section>

                <div className="grid gap-6 lg:grid-cols-2">
                    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 sm:p-8">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4"><div><span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#fc4c02]">Movement log</span><h2 className="mt-2 font-athletic text-3xl uppercase">Today’s sessions</h2></div><Link href={route('activities.index')} className="text-xs font-black text-slate-500 transition hover:text-[#fc4c02]">View all <ChevronRight className="inline h-3.5 w-3.5" /></Link></div>
                        {today_activities.length > 0 ? <div className="divide-y divide-slate-100">{today_activities.map((act) => <div key={act.id} className="flex items-center justify-between gap-4 py-4"><div><strong className="block text-sm font-bold text-slate-900">{act.name}</strong><span className="mt-1 block text-xs text-slate-500">{act.distance_m ? `${(act.distance_m / 1000).toFixed(2)} km · ` : ''}{Math.floor(act.duration_seconds / 60)} min</span></div><span className="flex items-center gap-1 font-metric text-xl text-[#fc4c02]"><Flame className="h-4 w-4" />{act.calories_burned}<small className="font-sans text-[9px] font-bold text-slate-400">KCAL</small></span></div>)}</div> : <div className="py-12 text-center"><Activity className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-600">No movement logged yet.</p><p className="mt-1 text-xs text-slate-400">Your next session belongs here.</p></div>}
                    </section>
                    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 sm:p-8">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-4"><div><span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#fc4c02]">Nutrition log</span><h2 className="mt-2 font-athletic text-3xl uppercase">Today’s plate</h2></div><Link href={route('nutrition.index')} className="text-xs font-black text-slate-500 transition hover:text-[#fc4c02]">View all <ChevronRight className="inline h-3.5 w-3.5" /></Link></div>
                        {today_logs.length > 0 ? <div className="divide-y divide-slate-100">{today_logs.map((log) => <div key={log.id} className="flex items-center justify-between gap-4 py-4"><div><strong className="block text-sm font-bold capitalize text-slate-900">{log.meal_type}</strong><span className="mt-1 block text-xs text-slate-500">{log.items?.length || 0} items · P {log.total_protein}g · C {log.total_carbs}g</span></div><span className="font-metric text-xl text-slate-900">{log.total_calories}<small className="ms-1 font-sans text-[9px] font-bold text-slate-400">KCAL</small></span></div>)}</div> : <div className="py-12 text-center"><Utensils className="mx-auto h-8 w-8 text-slate-300" /><p className="mt-3 text-sm font-bold text-slate-600">No plate logged yet.</p><p className="mt-1 text-xs text-slate-400">Use the scanner to add your first meal.</p></div>}
                    </section>
                </div>
            </div>

            {showWhatToEatModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#111827]/70 p-4 backdrop-blur-md">
                    <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-[1.75rem] bg-[#f4f2ed] p-6 shadow-2xl sm:p-8">
                        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-5"><div><span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#fc4c02]">Next best meal</span><h2 className="mt-2 font-athletic text-4xl uppercase">Eat with context.</h2><p className="mt-2 text-xs text-slate-500">Rekomendasi berdasarkan aktivitas dan sisa budget kalori.</p></div><button type="button" onClick={() => setShowWhatToEatModal(false)} className="rounded-full p-2 text-slate-400 transition hover:bg-white hover:text-slate-900"><X className="h-5 w-5" /></button></div>
                        <div className="mt-5 rounded-2xl bg-[#dff58d] p-4 text-sm font-semibold leading-6 text-slate-800">{recommendations.context_summary}</div>
                        <div className="mt-5 space-y-3">{recommendations.recommendations.map((rec, index) => <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start"><h3 className="font-athletic text-3xl uppercase">{rec.title}</h3><div className="flex gap-2"><span className="rounded-full bg-[#dff58d] px-3 py-1 text-xs font-black text-slate-900">{rec.total_calories} kcal</span><span className="rounded-full bg-[#d8e5f0] px-3 py-1 text-xs font-black text-slate-900">{rec.total_protein}g protein</span></div></div><p className="mt-3 text-sm leading-6 text-slate-600">{rec.reason}</p><div className="mt-4 flex flex-wrap gap-2 border-t border-slate-100 pt-3">{rec.items.map((item) => <span key={item} className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600"><CheckCircle2 className="h-3.5 w-3.5 text-[#fc4c02]" />{item}</span>)}</div></div>)}</div>
                        <Link href={route('nutrition.index')} className="mt-5 flex items-center justify-center gap-2 rounded-full bg-[#111827] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#fc4c02]"><Camera className="h-4 w-4" /> Open nutrition log <ArrowRight className="h-4 w-4" /></Link>
                    </div>
                </div>
            )}
        </AuthenticatedLayout>
    );
}
