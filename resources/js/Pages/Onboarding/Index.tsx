import React, { useState, useMemo } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm } from '@inertiajs/react';
import { Activity, Flame, Heart, Target, TrendingUp, Sparkles, CheckCircle2 } from 'lucide-react';

interface ProfileData {
    age?: number;
    gender?: 'male' | 'female';
    height_cm?: number;
    weight_kg?: number;
    activity_level?: string;
    goal?: string;
    bmr?: number;
    tdee?: number;
    daily_calorie_target?: number;
    protein_target_g?: number;
    carbs_target_g?: number;
    fat_target_g?: number;
}

interface Props {
    profile?: ProfileData | null;
}

export default function Onboarding({ profile }: Props) {
    const { data, setData, post, processing, errors } = useForm({
        age: profile?.age || 24,
        gender: profile?.gender || 'male',
        height_cm: profile?.height_cm || 170,
        weight_kg: profile?.weight_kg || 65,
        activity_level: profile?.activity_level || 'moderately_active',
        goal: profile?.goal || 'maintain_weight',
    });

    // Real-time client-side preview calculation
    const preview = useMemo(() => {
        const weight = Number(data.weight_kg) || 60;
        const height = Number(data.height_cm) || 170;
        const age = Number(data.age) || 25;

        // BMR Mifflin-St Jeor
        let bmr = 10 * weight + 6.25 * height - 5 * age;
        bmr = data.gender === 'female' ? bmr - 161 : bmr + 5;
        bmr = Math.round(bmr);

        const multipliers: Record<string, number> = {
            sedentary: 1.2,
            lightly_active: 1.375,
            moderately_active: 1.55,
            very_active: 1.725,
            extra_active: 1.9,
        };
        const mult = multipliers[data.activity_level] || 1.2;
        const tdee = Math.round(bmr * mult);

        let target = tdee;
        if (data.goal === 'lose_weight') target = Math.max(1200, tdee - 500);
        else if (data.goal === 'gain_muscle') target = tdee + 300;

        const proteinGrams = Math.round(weight * (data.goal === 'gain_muscle' ? 2.0 : data.goal === 'lose_weight' ? 1.8 : 1.6));
        const fatGrams = Math.round((target * 0.25) / 9);
        const carbsGrams = Math.max(0, Math.round((target - (proteinGrams * 4 + fatGrams * 9)) / 4));

        return { bmr, tdee, target, proteinGrams, carbsGrams, fatGrams };
    }, [data]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('onboarding.store'));
    };

    return (
        <AuthenticatedLayout
            header={
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                            Profil Tubuh & Target Energi
                        </h2>
                        <p className="text-sm text-gray-500">
                            Sesuaikan data biometrik agar rekomendasi nutrisi Calora presisi.
                        </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                        <Sparkles className="h-3.5 w-3.5" />
                        Smart Mifflin-St Jeor
                    </span>
                </div>
            }
        >
            <Head title="Profil & Target Nutrisi - Calora" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                        {/* Form Inputs */}
                        <div className="lg:col-span-2">
                            <form
                                onSubmit={handleSubmit}
                                className="space-y-6 rounded-2xl bg-white p-6 shadow-sm border border-gray-100 sm:p-8"
                            >
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">Data Fisik</h3>
                                    <p className="text-sm text-gray-500">Informasi dasar untuk menghitung laju metabolisme basal (BMR).</p>
                                </div>

                                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Jenis Kelamin</label>
                                        <div className="mt-2 grid grid-cols-2 gap-3">
                                            <button
                                                type="button"
                                                onClick={() => setData('gender', 'male')}
                                                className={`flex items-center justify-center rounded-xl border py-2.5 px-3 text-sm font-medium transition-all ${
                                                    data.gender === 'male'
                                                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/20'
                                                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                Pria 👨
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setData('gender', 'female')}
                                                className={`flex items-center justify-center rounded-xl border py-2.5 px-3 text-sm font-medium transition-all ${
                                                    data.gender === 'female'
                                                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-600/20'
                                                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                                                }`}
                                            >
                                                Wanita 👩
                                            </button>
                                        </div>
                                        {errors.gender && <p className="mt-1 text-xs text-red-600">{errors.gender}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Usia (Tahun)</label>
                                        <input
                                            type="number"
                                            value={data.age}
                                            onChange={(e) => setData('age', Number(e.target.value))}
                                            className="mt-2 block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                                            placeholder="Contoh: 24"
                                            min="12"
                                            max="100"
                                            required
                                        />
                                        {errors.age && <p className="mt-1 text-xs text-red-600">{errors.age}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Tinggi Badan (cm)</label>
                                        <input
                                            type="number"
                                            step="0.5"
                                            value={data.height_cm}
                                            onChange={(e) => setData('height_cm', Number(e.target.value))}
                                            className="mt-2 block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                                            placeholder="Contoh: 172"
                                            required
                                        />
                                        {errors.height_cm && <p className="mt-1 text-xs text-red-600">{errors.height_cm}</p>}
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Berat Badan (kg)</label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            value={data.weight_kg}
                                            onChange={(e) => setData('weight_kg', Number(e.target.value))}
                                            className="mt-2 block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500 focus:ring-emerald-500"
                                            placeholder="Contoh: 68.5"
                                            required
                                        />
                                        {errors.weight_kg && <p className="mt-1 text-xs text-red-600">{errors.weight_kg}</p>}
                                    </div>
                                </div>

                                <hr className="border-gray-100" />

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Tingkat Aktivitas Harian</label>
                                    <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                        {[
                                            { id: 'sedentary', label: 'Jarang Beraktivitas', desc: 'Pekerjaan meja, sedikit/tanpa olahraga rutin' },
                                            { id: 'lightly_active', label: 'Ringan (1-3 hari/mgg)', desc: 'Olahraga ringan atau jalan santai teratur' },
                                            { id: 'moderately_active', label: 'Moderat (3-5 hari/mgg)', desc: 'Lari, gym, atau bersepeda intensitas sedang' },
                                            { id: 'very_active', label: 'Sangat Aktif (6-7 hari/mgg)', desc: 'Latihan intensif hampir setiap hari' },
                                        ].map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => setData('activity_level', item.id)}
                                                className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                                                    data.activity_level === item.id
                                                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <p className="font-semibold text-sm text-gray-900">{item.label}</p>
                                                    {data.activity_level === item.id && (
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                    )}
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500">{item.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {errors.activity_level && <p className="mt-1 text-xs text-red-600">{errors.activity_level}</p>}
                                </div>

                                <hr className="border-gray-100" />

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Target Utama (Goal)</label>
                                    <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                                        {[
                                            { id: 'lose_weight', label: 'Turunkan Berat (Fat Loss)', desc: 'Defisit sehat -500 kcal per hari' },
                                            { id: 'maintain_weight', label: 'Pertahankan Berat Badan', desc: 'Seimbang kalori keluar & masuk' },
                                            { id: 'gain_muscle', label: 'Massa Otot (Hypertrophy)', desc: 'Surplus +300 kcal & protein tinggi' },
                                            { id: 'improve_fitness', label: 'Meningkatkan Kebugaran', desc: 'Fokus performa aerobik & stamina' },
                                        ].map((item) => (
                                            <div
                                                key={item.id}
                                                onClick={() => setData('goal', item.id)}
                                                className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                                                    data.goal === item.id
                                                        ? 'border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-600/20'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <p className="font-semibold text-sm text-gray-900">{item.label}</p>
                                                    {data.goal === item.id && (
                                                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                                    )}
                                                </div>
                                                <p className="mt-1 text-xs text-gray-500">{item.desc}</p>
                                            </div>
                                        ))}
                                    </div>
                                    {errors.goal && <p className="mt-1 text-xs text-red-600">{errors.goal}</p>}
                                </div>

                                <div className="pt-4">
                                    <button
                                        type="submit"
                                        disabled={processing}
                                        className="w-full rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-600 transition-all disabled:opacity-50"
                                    >
                                        {processing ? 'Menyimpan...' : 'Simpan & Aktifkan Calora Engine'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {/* Summary & Live Calculation Preview Card */}
                        <div className="space-y-6">
                            <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-500 to-teal-700 p-6 text-white shadow-lg">
                                <div className="flex items-center gap-2 text-emerald-100 text-xs font-semibold uppercase tracking-wider">
                                    <Target className="h-4 w-4" />
                                    Target Harian Calora
                                </div>
                                <div className="mt-4 flex items-baseline gap-2">
                                    <span className="text-4xl font-extrabold tracking-tight">{preview.target}</span>
                                    <span className="text-emerald-100 font-medium">kcal / hari</span>
                                </div>
                                <p className="mt-2 text-xs text-emerald-100/90 leading-relaxed">
                                    Berdasarkan BMR {preview.bmr} kcal dan estimasi pengeluaran energi harian (TDEE) {preview.tdee} kcal.
                                </p>

                                <div className="mt-6 pt-5 border-t border-emerald-400/40 grid grid-cols-3 gap-2 text-center">
                                    <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-sm">
                                        <p className="text-[11px] font-medium text-emerald-100">Protein</p>
                                        <p className="text-lg font-bold">{preview.proteinGrams}g</p>
                                    </div>
                                    <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-sm">
                                        <p className="text-[11px] font-medium text-emerald-100">Karbo</p>
                                        <p className="text-lg font-bold">{preview.carbsGrams}g</p>
                                    </div>
                                    <div className="rounded-xl bg-white/10 p-2.5 backdrop-blur-sm">
                                        <p className="text-[11px] font-medium text-emerald-100">Lemak</p>
                                        <p className="text-lg font-bold">{preview.fatGrams}g</p>
                                    </div>
                                </div>
                            </div>

                            <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-4">
                                <h4 className="font-semibold text-sm text-gray-900 flex items-center gap-2">
                                    <Flame className="h-4 w-4 text-amber-500" />
                                    Bagaimana Calora Menghitung?
                                </h4>
                                <ul className="text-xs text-gray-600 space-y-2.5 leading-relaxed">
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-500 font-bold">•</span>
                                        <span><strong>BMR:</strong> Energi minimum yang dibakar organ tubuh saat istirahat total.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-500 font-bold">•</span>
                                        <span><strong>TDEE:</strong> Total kalori yang Anda bakar setelah ditambah aktivitas harian.</span>
                                    </li>
                                    <li className="flex items-start gap-2">
                                        <span className="text-emerald-500 font-bold">•</span>
                                        <span><strong>Dynamic Balance:</strong> Saat Anda mencatat lari/olahraga, budget kalori Anda bertambah secara proporsional.</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
