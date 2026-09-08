import React from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';
import { 
    Trophy, 
    Flame, 
    Zap, 
    Calendar, 
    CheckCircle2, 
    ArrowRight, 
    Sparkles, 
    Award,
    Clock
} from 'lucide-react';

interface ChallengeItem {
    id: number;
    slug: string;
    title: string;
    description: string;
    goal_type: string;
    target_value: number;
    unit: string;
    badge_icon: string;
    points_reward: number;
    starts_at: string;
    ends_at: string;
    is_joined: boolean;
    current_progress: number;
    percentage: number;
    is_completed: boolean;
}

interface Props {
    challenges: ChallengeItem[];
}

export default function ChallengesIndex({ challenges }: Props) {
    const handleJoin = (id: number) => {
        router.post(route('challenges.join', { challenge: id }));
    };

    const handleLeave = (id: number) => {
        if (confirm('Yakin ingin keluar dari tantangan ini?')) {
            router.delete(route('challenges.leave', { challenge: id }));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                            <Trophy className="h-6 w-6 text-amber-500" />
                            Calora Challenges 🏆
                        </h2>
                        <p className="text-sm text-gray-500">
                            Ikuti tantangan bulanan, dorong batas kemampuanmu, dan raih lencana eksklusif.
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Monthly Challenges - Calora" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
                    {/* Banner */}
                    <div className="rounded-3xl border border-amber-200/80 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
                        <div className="relative z-10 max-w-2xl space-y-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
                                <Sparkles className="h-3.5 w-3.5" />
                                Season Milestone
                            </span>
                            <h3 className="text-2xl sm:text-3xl font-black">Capai Target Bulananmu Bersama Calora</h3>
                            <p className="text-xs sm:text-sm text-amber-100/90 leading-relaxed">
                                Setiap aktivitas olahraga yang kamu catat di Calora (Live GPS, manual, maupun sync) otomatis diakumulasikan ke tantangan yang kamu ikuti.
                            </p>
                        </div>
                    </div>

                    {/* Challenges Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {challenges.map((c) => (
                            <div
                                key={c.id}
                                className={`rounded-3xl border p-6 flex flex-col justify-between transition-all bg-white shadow-sm hover:shadow-md ${
                                    c.is_completed
                                        ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                                        : c.is_joined
                                        ? 'border-amber-300'
                                        : 'border-gray-200'
                                }`}
                            >
                                <div className="space-y-4">
                                    <div className="flex items-start justify-between">
                                        <div className="rounded-2xl bg-amber-50 p-3 text-amber-600 border border-amber-100">
                                            {c.badge_icon === 'Flame' ? (
                                                <Flame className="h-6 w-6" />
                                            ) : c.badge_icon === 'Zap' ? (
                                                <Zap className="h-6 w-6" />
                                            ) : (
                                                <Trophy className="h-6 w-6" />
                                            )}
                                        </div>

                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[11px] font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
                                                +{c.points_reward} XP
                                            </span>
                                            {c.is_completed && (
                                                <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                                    Selesai!
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div>
                                        <h4 className="font-bold text-base text-gray-900">{c.title}</h4>
                                        <p className="text-xs text-gray-500 mt-1 leading-relaxed">{c.description}</p>
                                    </div>

                                    <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                        <Calendar className="h-3.5 w-3.5" />
                                        <span>{c.starts_at} — {c.ends_at}</span>
                                    </div>

                                    {/* Progress bar if joined */}
                                    {c.is_joined && (
                                        <div className="space-y-2 pt-2 border-t border-gray-100">
                                            <div className="flex justify-between text-xs font-semibold">
                                                <span className="text-gray-600">Progress</span>
                                                <span className="text-gray-900">
                                                    {c.current_progress} / {c.target_value} {c.unit} ({c.percentage}%)
                                                </span>
                                            </div>
                                            <div className="h-2.5 w-full bg-gray-100 rounded-full overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full transition-all ${
                                                        c.is_completed ? 'bg-emerald-500' : 'bg-amber-500'
                                                    }`}
                                                    style={{ width: `${c.percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Action Buttons */}
                                <div className="pt-6">
                                    {!c.is_joined ? (
                                        <button
                                            onClick={() => handleJoin(c.id)}
                                            className="w-full rounded-2xl bg-emerald-600 py-3 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-all flex items-center justify-center gap-1.5"
                                        >
                                            Ikuti Tantangan
                                            <ArrowRight className="h-4 w-4" />
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <span className="flex-1 text-center text-xs font-semibold text-emerald-700 bg-emerald-50 py-2.5 rounded-xl border border-emerald-100">
                                                {c.is_completed ? 'Tantangan Selesai 🎉' : 'Sedang Berjalan 🏃'}
                                            </span>
                                            {!c.is_completed && (
                                                <button
                                                    onClick={() => handleLeave(c.id)}
                                                    className="rounded-xl border border-gray-200 px-3 py-2.5 text-xs text-gray-400 hover:text-rose-600 hover:border-rose-200 transition-colors"
                                                >
                                                    Keluar
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
