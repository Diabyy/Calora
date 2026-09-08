import React, { useState, useEffect, useRef } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, useForm, router } from '@inertiajs/react';
import { 
    Activity as ActivityIcon, 
    Plus, 
    Play,
    MapPin, 
    Flame, 
    Clock, 
    Gauge, 
    TrendingUp, 
    Trash2, 
    X, 
    Award,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import LiveGpsModal from '@/Components/LiveGpsModal';
import { visualAssets } from '@/data/visualAssets';

interface ActivityItem {
    id: number;
    type: 'running' | 'walking' | 'cycling' | 'basketball' | 'workout' | 'other';
    source: 'manual' | 'browser_gps' | 'legacy_import';
    name: string;
    distance_m?: number | null;
    duration_seconds: number;
    calories_burned: number;
    avg_pace_seconds_per_km?: number | null;
    avg_speed_kmh?: number | null;
    elevation_gain_m?: number | null;
    polyline?: string | null;
    started_at: string;
}

interface Props {
    activities: ActivityItem[];
    stats: {
        total_distance_km: number;
        total_duration_minutes: number;
        total_calories: number;
        activities_count: number;
    };
}

// Simple Polyline decoder (Google Encoded Polyline Algorithm Format)
function decodePolyline(str: string, precision = 5): [number, number][] {
    let index = 0,
        lat = 0,
        lng = 0,
        coordinates: [number, number][] = [],
        shift = 0,
        result = 0,
        byte = null,
        latitude_change,
        longitude_change,
        factor = Math.pow(10, precision);

    while (index < str.length) {
        byte = null;
        shift = 0;
        result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        shift = 0;
        result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        lat += latitude_change;
        lng += longitude_change;

        coordinates.push([lat / factor, lng / factor]);
    }

    return coordinates;
}

export default function ActivitiesIndex({ activities, stats }: Props) {
    const [showLogModal, setShowLogModal] = useState(false);
    const [showLiveGpsModal, setShowLiveGpsModal] = useState(false);
    const [selectedMapActivity, setSelectedMapActivity] = useState<ActivityItem | null>(null);
    const [filterSport, setFilterSport] = useState<string>('all');
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    const filteredActivities = filterSport === 'all'
        ? activities
        : activities.filter((act) => act.type === filterSport);

    const { data, setData, post, processing, reset, errors } = useForm({
        type: 'running',
        name: 'Lari Pagi',
        duration_minutes: 30,
        distance_km: 5.0,
        elevation_gain_m: 0,
        started_at: new Date().toISOString().slice(0, 16),
    });

    const formatPace = (secondsPerKm?: number | null) => {
        if (!secondsPerKm) return '-';
        const mins = Math.floor(secondsPerKm / 60);
        const secs = secondsPerKm % 60;
        return `${mins}:${secs < 10 ? '0' : ''}${secs}/km`;
    };

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}m ${secs}s`;
    };

    const handleSubmitManual = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('activities.store'), {
            onSuccess: () => {
                setShowLogModal(false);
                reset();
            },
        });
    };

    const handleDelete = (id: number) => {
        if (confirm('Hapus aktivitas ini?')) {
            router.delete(route('activities.destroy', { activity: id }));
        }
    };

    // Render Leaflet Map when polyline modal opens
    useEffect(() => {
        if (!selectedMapActivity || !selectedMapActivity.polyline || !mapContainerRef.current) return;

        // Cleanup previous map instance if any
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const coords = decodePolyline(selectedMapActivity.polyline);
        if (coords.length === 0) return;

        const map = L.map(mapContainerRef.current).setView(coords[0], 14);
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        const polylineLayer = L.polyline(coords, {
            color: '#10b981',
            weight: 5,
            opacity: 0.9,
            lineJoin: 'round',
        }).addTo(map);

        map.fitBounds(polylineLayer.getBounds(), { padding: [30, 30] });

        // Add start & finish markers
        L.circleMarker(coords[0], { radius: 7, color: '#059669', fillColor: '#34d399', fillOpacity: 1 }).addTo(map);
        L.circleMarker(coords[coords.length - 1], { radius: 7, color: '#dc2626', fillColor: '#f87171', fillOpacity: 1 }).addTo(map);

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [selectedMapActivity]);

    return (
        <AuthenticatedLayout
            header={
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="font-display font-black text-3xl tracking-tight text-slate-900">
                            ACTIVITIES & LIVE GPS
                        </h2>
                        <p className="text-xs font-semibold text-slate-400 mt-0.5 uppercase tracking-wider">
                            Your movement log, without the noise
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setShowLiveGpsModal(true)}
                            className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-500 transition-all hover:shadow-md"
                        >
                            <Play className="h-3.5 w-3.5 fill-white" />
                            Live GPS Tracker
                        </button>

                        <button
                            onClick={() => setShowLogModal(true)}
                            className="inline-flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-all"
                        >
                            <Plus className="h-3.5 w-3.5 text-slate-400" />
                            Catat Manual
                        </button>
                    </div>
                </div>
            }
        >
            <Head title="Activity Tracking & GPS - Calora" />

            <div className="py-8">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
                    <section className="relative overflow-hidden rounded-[1.75rem] bg-[#111827] text-white shadow-xl shadow-slate-900/10">
                        <img src={visualAssets.trail} alt="Jalur pegunungan untuk sesi outdoor" className="absolute inset-y-0 right-0 h-full w-2/5 object-cover opacity-45" />
                        <div className="absolute inset-0 bg-gradient-to-r from-[#111827] via-[#111827]/95 to-transparent" />
                        <div className="relative max-w-xl px-6 py-8 sm:px-8 sm:py-10">
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#c8f169]">Field log / movement</span>
                            <h2 className="mt-4 font-athletic text-5xl uppercase leading-[0.88] sm:text-6xl">Every route tells you something.</h2>
                            <p className="mt-4 max-w-md text-sm leading-6 text-slate-300">Rekam sesi baru dengan GPS browser atau tambahkan latihan manual. Data yang konsisten membuat progres lebih mudah dibaca.</p>
                        </div>
                    </section>

                    {/* Overall Stats Cards */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Jarak</span>
                            <div className="mt-2 flex items-baseline gap-1.5">
                                <span className="font-display font-black text-3xl sm:text-4xl text-slate-900">{stats.total_distance_km}</span>
                                <span className="font-display font-bold text-xs text-slate-400 tracking-wider">KM</span>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Durasi</span>
                            <div className="mt-2 flex items-baseline gap-1.5">
                                <span className="font-display font-black text-3xl sm:text-4xl text-slate-900">{stats.total_duration_minutes}</span>
                                <span className="font-display font-bold text-xs text-slate-400 tracking-wider">MENIT</span>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Kalori Terbakar</span>
                            <div className="mt-2 flex items-baseline gap-1.5">
                                <span className="font-display font-black text-3xl sm:text-4xl text-amber-600">{stats.total_calories}</span>
                                <span className="font-display font-bold text-xs text-amber-600/80 tracking-wider">KCAL</span>
                            </div>
                        </div>

                        <div className="rounded-3xl border border-slate-200/90 bg-white p-5 shadow-sm">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Latihan</span>
                            <div className="mt-2 flex items-baseline gap-1.5">
                                <span className="font-display font-black text-3xl sm:text-4xl text-emerald-700">{stats.activities_count}</span>
                                <span className="font-display font-bold text-xs text-emerald-600 tracking-wider">SESI</span>
                            </div>
                        </div>
                    </div>

                    {/* Activity List */}
                    <div className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm">
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                            <div>
                                <h3 className="font-display font-black text-xl tracking-wide uppercase text-slate-900">Riwayat Olahraga</h3>
                                <p className="text-xs text-slate-400 font-medium mt-0.5">Daftar sesi latihan yang otomatis dihitung dan menambah budget kalori harianmu.</p>
                            </div>
                            <span className="text-xs font-bold text-slate-400 tracking-wider uppercase hidden sm:block">
                                RUTE TERSIMPAN POLYLINE
                            </span>
                        </div>

                        {/* Strava-Style Sport Category Filter Tabs */}
                        <div className="flex items-center gap-2 py-3 border-b border-slate-100 overflow-x-auto">
                            {[
                                { id: 'all', label: 'SEMUA OLAHRAGA' },
                                { id: 'running', label: 'LARI' },
                                { id: 'cycling', label: 'SEPEDA' },
                                { id: 'walking', label: 'JALAN' },
                                { id: 'workout', label: 'WORKOUT' },
                            ].map((tab) => (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setFilterSport(tab.id)}
                                    className={`rounded-full px-4 py-1.5 font-display font-black text-xs uppercase tracking-wider transition-all whitespace-nowrap ${
                                        filterSport === tab.id
                                            ? 'bg-slate-950 text-white shadow-sm'
                                            : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {filteredActivities.length > 0 ? (
                            <div className="mt-4 divide-y divide-slate-100">
                                {filteredActivities.map((act) => (
                                    <div key={act.id} className="py-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                                        <div className="flex items-start gap-3.5">
                                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 shadow-sm mt-0.5">
                                                <ActivityIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <h4 className="font-display font-black text-lg text-slate-900">{act.name}</h4>
                                                    {act.source === 'browser_gps' && (
                                                        <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                                            GPS Web
                                                        </span>
                                                    )}
                                                    {act.source === 'legacy_import' && (
                                                        <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-bold text-slate-500 border border-slate-200">
                                                            Import
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-xs text-slate-400 font-medium mt-1">
                                                    {new Date(act.started_at).toLocaleDateString('id-ID', {
                                                        weekday: 'long',
                                                        day: 'numeric',
                                                        month: 'short',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Signature 4-column metric readout */}
                                        <div className="flex flex-wrap items-center gap-5 sm:gap-8 bg-slate-50/70 p-3 sm:p-4 rounded-2xl border border-slate-200/70">
                                            {act.distance_m ? (
                                                <div>
                                                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">JARAK</span>
                                                    <span className="font-display font-black text-xl text-slate-900">
                                                        {(act.distance_m / 1000).toFixed(2)} <span className="text-xs font-bold text-slate-400">KM</span>
                                                    </span>
                                                </div>
                                            ) : null}

                                            <div>
                                                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">DURASI</span>
                                                <span className="font-display font-black text-xl text-slate-900">
                                                    {formatDuration(act.duration_seconds)}
                                                </span>
                                            </div>

                                            {act.avg_pace_seconds_per_km ? (
                                                <div>
                                                    <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">PACE</span>
                                                    <span className="font-display font-black text-xl text-slate-900">
                                                        {formatPace(act.avg_pace_seconds_per_km)}
                                                    </span>
                                                </div>
                                            ) : null}

                                            <div>
                                                <span className="text-slate-400 block text-[10px] font-bold uppercase tracking-wider">KALORI</span>
                                                <span className="font-display font-black text-xl text-amber-600 flex items-center gap-1">
                                                    <Flame className="h-4 w-4 text-amber-500 fill-amber-500" />
                                                    {act.calories_burned} <span className="text-xs font-bold text-slate-400">KCAL</span>
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 self-end lg:self-center">
                                            {act.polyline && (
                                                <button
                                                    onClick={() => setSelectedMapActivity(act)}
                                                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                                                >
                                                    <MapPin className="h-3.5 w-3.5 text-emerald-600" />
                                                    Rute Peta
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleDelete(act.id)}
                                                className="text-slate-300 hover:text-rose-600 p-2 transition-colors rounded-xl hover:bg-rose-50"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="mt-8 rounded-xl border border-dashed border-gray-200 py-10 text-center">
                                <ActivityIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm font-semibold text-gray-700">Belum ada aktivitas tercatat</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    Mulai dengan mencatat latihan manual atau aktifkan Live GPS Tracker.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* MANUAL WORKOUT LOG MODAL */}
            {showLogModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
                    <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl space-y-6">
                        <div className="flex items-center justify-between border-b pb-4">
                            <h3 className="text-lg font-bold text-gray-900">Catat Aktivitas Manual</h3>
                            <button onClick={() => setShowLogModal(false)} className="rounded-full p-1 text-gray-400 hover:bg-gray-100">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmitManual} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Jenis Olahraga</label>
                                <select
                                    value={data.type}
                                    onChange={(e) => setData('type', e.target.value)}
                                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500"
                                >
                                    <option value="running">Lari (Running)</option>
                                    <option value="walking">Jalan Santai (Walking)</option>
                                    <option value="cycling">Bersepeda (Cycling)</option>
                                    <option value="workout">Gym / Workout / Beban</option>
                                    <option value="basketball">Bola Basket / Futsal</option>
                                    <option value="other">Olahraga Lainnya</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Nama Latihan</label>
                                <input
                                    type="text"
                                    value={data.name}
                                    onChange={(e) => setData('name', e.target.value)}
                                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Durasi (Menit)</label>
                                    <input
                                        type="number"
                                        value={data.duration_minutes}
                                        onChange={(e) => setData('duration_minutes', Number(e.target.value))}
                                        className="mt-1 block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500"
                                        min="1"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Jarak (km, opsional)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={data.distance_km}
                                        onChange={(e) => setData('distance_km', Number(e.target.value))}
                                        className="mt-1 block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700">Waktu Mulai</label>
                                <input
                                    type="datetime-local"
                                    value={data.started_at}
                                    onChange={(e) => setData('started_at', e.target.value)}
                                    className="mt-1 block w-full rounded-xl border border-gray-200 px-3.5 py-2.5 text-sm focus:border-emerald-500"
                                    required
                                />
                            </div>

                            <div className="pt-2">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow hover:bg-emerald-500 transition-all"
                                >
                                    {processing ? 'Menyimpan...' : 'Simpan Sesi Latihan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* LEAFLET GPS ROUTE MODAL */}
            {selectedMapActivity && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
                    <div className="relative w-full max-w-3xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-4 border border-slate-200">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                            <div>
                                <h3 className="font-display font-black text-xl text-slate-900 tracking-wide uppercase">{selectedMapActivity.name}</h3>
                                <p className="text-xs text-slate-400 font-medium flex items-center gap-2 mt-0.5">
                                    <span>{(Number(selectedMapActivity.distance_m) / 1000).toFixed(2)} KM</span>
                                    <span>·</span>
                                    <span>{formatDuration(selectedMapActivity.duration_seconds)}</span>
                                    <span>·</span>
                                    <span className="flex items-center gap-1 font-bold text-amber-600">
                                        <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                                        {selectedMapActivity.calories_burned} KCAL
                                    </span>
                                </p>
                            </div>
                            <button onClick={() => setSelectedMapActivity(null)} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Map Canvas */}
                        <div ref={mapContainerRef} className="h-96 w-full rounded-2xl overflow-hidden border border-slate-200 z-0 shadow-inner" />

                        <div className="flex items-center justify-between text-xs text-slate-400 pt-1 font-medium">
                            <span>Titik Hijau: Mulai | Titik Merah: Selesai</span>
                            <span className="uppercase text-[10px] tracking-wider font-bold">LEAFLET & OPENSTREETMAP</span>
                        </div>
                    </div>
                </div>
            )}

            {/* LIVE WEB GPS TRACKER MODAL */}
            <LiveGpsModal
                isOpen={showLiveGpsModal}
                onClose={() => setShowLiveGpsModal(false)}
            />
        </AuthenticatedLayout>
    );
}
