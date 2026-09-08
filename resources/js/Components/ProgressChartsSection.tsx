import React from 'react';
import {
    ResponsiveContainer,
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ReferenceLine,
} from 'recharts';

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

interface Props {
    analytics: {
        weight: {
            current: number;
            starting?: number;
            change: number;
            history: WeightHistoryPoint[];
        };
        calorie_trends: CalorieTrendPoint[];
        activity_trends: ActivityTrendPoint[];
    };
    profile: {
        daily_calorie_target: number;
        goal: string;
    };
    children?: React.ReactNode;
}

export default function ProgressChartsSection({ analytics, profile, children }: Props) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* CHART 1: WEIGHT TRAJECTORY */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-display font-black text-lg text-slate-900 uppercase tracking-wide">Weight Trajectory</h3>
                        <p className="text-xs text-slate-400 font-medium">Riwayat perkembangan timbangan berat badan</p>
                    </div>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Target: {profile.goal === 'lose_weight' ? `${analytics.weight.current - 5} kg` : 'Maintain'}
                    </span>
                </div>

                <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.weight.history} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                            <YAxis domain={['dataMin - 2', 'dataMax + 2']} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#111827', borderRadius: '14px', color: '#fff', fontSize: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                                formatter={(value: any) => [`${value} kg`, 'Berat Badan']}
                            />
                            <Area type="monotone" dataKey="weight" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#weightGrad)" dot={{ r: 4, fill: '#059669' }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* CHART 2: CALORIE IN VS OUT */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-display font-black text-lg text-slate-900 uppercase tracking-wide">Daily Energy Balance</h3>
                        <p className="text-xs text-slate-400 font-medium">Kalori Makanan Masuk vs Olahraga Terbakar (7 Hari)</p>
                    </div>
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 border border-slate-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Target: {profile.daily_calorie_target} kcal
                    </span>
                </div>

                <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.calorie_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="date" tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                            <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#111827', borderRadius: '14px', color: '#fff', fontSize: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                            />
                            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                            <ReferenceLine y={profile.daily_calorie_target} stroke="#f59e0b" strokeDasharray="3 3" label={{ value: 'Target', fill: '#f59e0b', fontSize: 10 }} />
                            <Bar dataKey="consumed" name="Makanan (kcal)" fill="#10b981" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="burned" name="Olahraga (kcal)" fill="#fc4c02" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* CHART 3: WEEKLY WORKOUT VOLUME */}
            <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-display font-black text-lg text-slate-900 uppercase tracking-wide">Weekly Activity Volume</h3>
                        <p className="text-xs text-slate-400 font-medium">Total akumulasi kilometer lari & bersepeda (4 Minggu)</p>
                    </div>
                </div>

                <div className="h-72 w-full pt-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.activity_trends} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="week" tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                            <YAxis tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} />
                            <Tooltip
                                contentStyle={{ backgroundColor: '#111827', borderRadius: '14px', color: '#fff', fontSize: '12px', border: '1px solid rgba(255,255,255,0.1)' }}
                            />
                            <Bar dataKey="distance_km" name="Jarak (km)" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* SLOT 4: ACHIEVEMENTS & BADGES */}
            {children}
        </div>
    );
}
