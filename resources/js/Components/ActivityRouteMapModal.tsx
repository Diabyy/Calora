import React, { useEffect, useRef } from 'react';
import { Flame, X } from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface ActivityItem {
    id: number;
    type: string;
    source: string;
    name: string;
    distance_m?: number | null;
    duration_seconds: number;
    calories_burned: number;
    polyline?: string | null;
    started_at: string;
    elevation_gain_m?: number | null;
    max_accuracy_m?: number | null;
    gps_point_count?: number | null;
}

interface Props {
    activity: ActivityItem;
    onClose: () => void;
}

function decodePolyline(encoded: string): [number, number][] {
    const coordinates: [number, number][] = [];
    let index = 0;
    const len = encoded.length;
    let lat = 0;
    let lng = 0;
    const factor = 1e5;

    while (index < len) {
        let byte: number;
        let shift = 0;
        let result = 0;
        let latitude_change: number;
        let longitude_change: number;

        do {
            byte = encoded.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        shift = 0;
        result = 0;

        do {
            byte = encoded.charCodeAt(index++) - 63;
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

export default function ActivityRouteMapModal({ activity, onClose }: Props) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);

    const formatDuration = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        if (mins >= 60) {
            const hrs = Math.floor(mins / 60);
            const remMins = mins % 60;
            return `${hrs}j ${remMins}m`;
        }
        return `${mins}m ${secs < 10 ? '0' : ''}${secs}d`;
    };

    useEffect(() => {
        if (!activity.polyline || !mapContainerRef.current) return;

        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const coords = decodePolyline(activity.polyline);
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

        // Start & Finish markers
        L.circleMarker(coords[0], { radius: 7, color: '#059669', fillColor: '#34d399', fillOpacity: 1 }).addTo(map);
        L.circleMarker(coords[coords.length - 1], { radius: 7, color: '#dc2626', fillColor: '#f87171', fillOpacity: 1 }).addTo(map);

        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [activity]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-md">
            <div className="relative w-full max-w-3xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl space-y-4 border border-slate-200">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-display font-black text-xl text-slate-900 tracking-wide uppercase">{activity.name}</h3>
                            {activity.source === 'browser_gps' && (
                                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-700 border border-emerald-200">
                                    GPS Web {activity.max_accuracy_m ? `· Akurasi ±${Math.round(activity.max_accuracy_m)}m` : ''}
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 font-medium flex flex-wrap items-center gap-2 mt-1">
                            <span>{(Number(activity.distance_m || 0) / 1000).toFixed(2)} KM</span>
                            <span>·</span>
                            <span>{formatDuration(activity.duration_seconds)}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1 font-bold text-amber-600">
                                <Flame className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                                {activity.calories_burned} KCAL
                            </span>
                            {activity.elevation_gain_m !== null && activity.elevation_gain_m !== undefined && activity.elevation_gain_m > 0 && (
                                <>
                                    <span>·</span>
                                    <span className="font-bold text-emerald-600">
                                        +{Math.round(activity.elevation_gain_m)}M CLIMB
                                    </span>
                                </>
                            )}
                            {activity.gps_point_count && (
                                <>
                                    <span>·</span>
                                    <span>{activity.gps_point_count} titik koordinat</span>
                                </>
                            )}
                        </p>
                    </div>
                    <button onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 transition-colors">
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
    );
}
