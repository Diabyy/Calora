import React, { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router, useForm } from '@inertiajs/react';
import { 
    Users, 
    Flame, 
    Heart, 
    MessageCircle, 
    Send, 
    Trophy, 
    Activity as ActivityIcon, 
    Medal, 
    Clock, 
    Sparkles 
} from 'lucide-react';

interface ActivityCommentItem {
    id: number;
    comment: string;
    user_name: string;
    created_at: string;
}

interface FeedActivity {
    id: number;
    type: string;
    name: string;
    source: string;
    distance_m: number;
    duration_seconds: number;
    calories_burned: number;
    avg_pace_seconds_per_km?: number | null;
    started_at: string;
    user: {
        id: number;
        name: string;
    };
    likes_count: number;
    has_liked: boolean;
    comments: ActivityCommentItem[];
}

interface LeaderboardUser {
    id: number;
    name: string;
    distance_km: number;
    calories: number;
    sessions: number;
}

interface Props {
    activities: FeedActivity[];
    leaderboard: LeaderboardUser[];
}

export default function CommunityIndex({ activities, leaderboard }: Props) {
    const [openCommentId, setOpenCommentId] = useState<number | null>(null);
    const [commentText, setCommentText] = useState('');

    const handleToggleLike = (activityId: number) => {
        router.post(route('community.like', { activity: activityId }), {}, { preserveScroll: true });
    };

    const handleSendComment = (activityId: number) => {
        if (!commentText.trim()) return;
        router.post(
            route('community.comment', { activity: activityId }),
            { comment: commentText },
            {
                preserveScroll: true,
                onSuccess: () => {
                    setCommentText('');
                },
            }
        );
    };

    const formatPace = (secondsPerKm?: number | null) => {
        if (!secondsPerKm) return '-';
        const mins = Math.floor(secondsPerKm / 60);
        const secs = secondsPerKm % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}/km`;
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        return `${mins}m`;
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                            <Users className="h-6 w-6 text-emerald-600" />
                            Calora Community & Feed
                        </h2>
                        <p className="text-sm text-gray-500">
                            Bagikan pencapaian olahragamu, beri semangat teman, dan bersaing di Leaderboard mingguan.
                        </p>
                    </div>
                </div>
            }
        >
            <Head title="Community Feed & Leaderboard - Calora" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Feed Column (2 cols) */}
                        <div className="lg:col-span-2 space-y-6">
                            <h3 className="font-bold text-lg text-gray-900">Aktivitas Terbaru Teman</h3>

                            {activities.length > 0 ? (
                                activities.map((act) => (
                                    <div key={act.id} className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-4">
                                        {/* User & Time */}
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 font-bold text-white text-sm shadow-sm">
                                                    {act.user.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-sm text-gray-900">{act.user.name}</h4>
                                                    <p className="text-xs text-gray-400">{act.started_at}</p>
                                                </div>
                                            </div>

                                            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700 capitalize border border-emerald-100">
                                                {act.type}
                                            </span>
                                        </div>

                                        {/* Activity Title & Metrics */}
                                        <div className="rounded-2xl bg-gray-50/70 border border-gray-100 p-4 space-y-3">
                                            <h5 className="font-bold text-base text-gray-900">{act.name}</h5>
                                            <div className="grid grid-cols-3 gap-2 text-center">
                                                <div>
                                                    <span className="text-[10px] font-semibold text-gray-400 uppercase">JARAK</span>
                                                    <p className="font-extrabold text-sm text-gray-900">
                                                        {act.distance_m > 0 ? `${(act.distance_m / 1000).toFixed(2)} km` : '-'}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-semibold text-gray-400 uppercase">WAKTU</span>
                                                    <p className="font-extrabold text-sm text-gray-900">{formatDuration(act.duration_seconds)}</p>
                                                </div>
                                                <div>
                                                    <span className="text-[10px] font-semibold text-gray-400 uppercase">KALORI</span>
                                                    <p className="font-extrabold text-sm text-amber-600">🔥 {act.calories_burned} kcal</p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions: Kudos / Like & Comments Button */}
                                        <div className="flex items-center gap-4 pt-1 text-xs">
                                            <button
                                                onClick={() => handleToggleLike(act.id)}
                                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all ${
                                                    act.has_liked
                                                        ? 'border-rose-200 bg-rose-50 text-rose-600 font-bold'
                                                        : 'border-gray-200 hover:border-rose-300 text-gray-600'
                                                }`}
                                            >
                                                <Heart className={`h-4 w-4 ${act.has_liked ? 'fill-rose-500 text-rose-500' : ''}`} />
                                                <span>{act.likes_count} Kudos</span>
                                            </button>

                                            <button
                                                onClick={() => setOpenCommentId(openCommentId === act.id ? null : act.id)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 transition-colors"
                                            >
                                                <MessageCircle className="h-4 w-4 text-gray-400" />
                                                <span>{act.comments.length} Komentar</span>
                                            </button>
                                        </div>

                                        {/* Comments Drawer / Section */}
                                        {openCommentId === act.id && (
                                            <div className="pt-3 border-t border-gray-100 space-y-3">
                                                {act.comments.map((c) => (
                                                    <div key={c.id} className="rounded-xl bg-gray-50 p-2.5 text-xs space-y-1">
                                                        <div className="flex items-center justify-between text-gray-400 text-[10px]">
                                                            <strong className="text-gray-900">{c.user_name}</strong>
                                                            <span>{c.created_at}</span>
                                                        </div>
                                                        <p className="text-gray-700">{c.comment}</p>
                                                    </div>
                                                ))}

                                                {/* Comment input form */}
                                                <div className="flex items-center gap-2 pt-1">
                                                    <input
                                                        type="text"
                                                        value={commentText}
                                                        onChange={(e) => setCommentText(e.target.value)}
                                                        placeholder="Tulis pesan semangat..."
                                                        className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-xs focus:border-emerald-500 focus:ring-emerald-500"
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleSendComment(act.id);
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => handleSendComment(act.id)}
                                                        className="rounded-xl bg-emerald-600 p-2 text-white hover:bg-emerald-500 transition-colors"
                                                    >
                                                        <Send className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))
                            ) : (
                                <div className="rounded-3xl border border-dashed border-gray-200 py-12 text-center bg-white">
                                    <Users className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                    <p className="text-sm font-semibold text-gray-700">Belum ada aktivitas komunitas</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Mulai berolahraga hari ini untuk membagikan pencapaian pertamamu!
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* Leaderboard Column (1 col) */}
                        <div className="space-y-6">
                            <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-sm space-y-5 sticky top-20">
                                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <Trophy className="h-5 w-5 text-amber-500" />
                                        <h3 className="font-bold text-base text-gray-900">Leaderboard Minggu Ini</h3>
                                    </div>
                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                                        Top Runners
                                    </span>
                                </div>

                                <div className="space-y-3">
                                    {leaderboard.map((user, idx) => (
                                        <div
                                            key={user.id}
                                            className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                                                idx === 0
                                                    ? 'border-amber-200 bg-amber-50/60 shadow-sm'
                                                    : idx === 1
                                                    ? 'border-slate-200 bg-slate-50'
                                                    : idx === 2
                                                    ? 'border-orange-200 bg-orange-50/40'
                                                    : 'border-gray-100 bg-white'
                                            }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black">
                                                    {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                                                </span>
                                                <div>
                                                    <p className="font-bold text-xs text-gray-900">{user.name}</p>
                                                    <p className="text-[10px] text-gray-400">{user.sessions} sesi latihan</p>
                                                </div>
                                            </div>

                                            <div className="text-right">
                                                <span className="font-extrabold text-sm text-emerald-600 block">
                                                    {user.distance_km} km
                                                </span>
                                                <span className="text-[10px] text-amber-600 font-semibold">
                                                    🔥 {user.calories} kcal
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
