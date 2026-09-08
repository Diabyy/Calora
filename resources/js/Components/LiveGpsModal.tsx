import React, { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import { 
    Play, 
    Pause, 
    Square, 
    X, 
    MapPin, 
    Zap, 
    Flame, 
    Timer, 
    Gauge,
    AlertCircle,
    CheckCircle2,
    Volume2,
    VolumeX
} from 'lucide-react';
import L from 'leaflet';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    userWeightKg?: number;
}

// Haversine formula to compute distance in meters between two lat/lng pairs
function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
        Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
        Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
}

interface GpsPoint {
    [key: string]: number | null | undefined;
    lat: number;
    lng: number;
    accuracy: number;
    timestamp: number;
    altitude?: number | null;
}

const GPS_DRAFT_KEY = 'calora:browser-gps-session';
const MAX_GPS_ACCURACY_METERS = 100;
const MAX_GPS_JUMP_METERS = 250;

export default function LiveGpsModal({ isOpen, onClose, userWeightKg = 65 }: Props) {
    const [sportType, setSportType] = useState<'running' | 'cycling' | 'walking'>('running');
    const [status, setStatus] = useState<'idle' | 'running' | 'paused' | 'finished'>('idle');
    const [seconds, setSeconds] = useState(0);
    const [distanceMeters, setDistanceMeters] = useState(0);
    const [elevationGainMeters, setElevationGainMeters] = useState(0);
    const [voiceEnabled, setVoiceEnabled] = useState(true);
    const [currentAccuracy, setCurrentAccuracy] = useState<number | null>(null);
    const [coords, setCoords] = useState<GpsPoint[]>([]);
    const [gpsError, setGpsError] = useState<string | null>(null);

    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const polylineRef = useRef<L.Polyline | null>(null);
    const currentMarkerRef = useRef<L.CircleMarker | null>(null);
    const accuracyCircleRef = useRef<L.Circle | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const wakeLockRef = useRef<any>(null);
    const lastPointRef = useRef<GpsPoint | null>(null);
    const lastAltitudeRef = useRef<number | null>(null);
    const lastAnnouncedKmRef = useRef<number>(0);
    const sessionStartedAtRef = useRef<number | null>(null);
    const pausedStartedAtRef = useRef<number | null>(null);
    const pausedSecondsRef = useRef(0);

    // Stopwatch timer
    useEffect(() => {
        let interval: any = null;
        if (status === 'running') {
            interval = setInterval(() => {
                setSeconds((prev) => prev + 1);
            }, 1000);
        } else {
            clearInterval(interval);
        }
        return () => clearInterval(interval);
    }, [status]);

    // Initialize and fully dispose the map with the modal lifecycle.
    useEffect(() => {
        if (!isOpen || !mapContainerRef.current) return;

        const map = L.map(mapContainerRef.current, { preferCanvas: true }).setView([0, 0], 2);
        mapInstanceRef.current = map;

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        polylineRef.current = L.polyline([], { color: '#10b981', weight: 6, opacity: 0.9 }).addTo(map);
        window.setTimeout(() => map.invalidateSize(), 0);

        return () => {
            if (watchIdRef.current !== null && 'geolocation' in navigator) {
                navigator.geolocation.clearWatch(watchIdRef.current);
                watchIdRef.current = null;
            }
            releaseWakeLock();
            currentMarkerRef.current = null;
            if (accuracyCircleRef.current) {
                accuracyCircleRef.current.remove();
                accuracyCircleRef.current = null;
            }
            polylineRef.current = null;
            map.remove();
            mapInstanceRef.current = null;
        };
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || !['running', 'paused'].includes(status) || typeof window === 'undefined') return;

        window.localStorage.setItem(
            GPS_DRAFT_KEY,
            JSON.stringify({
                sportType,
                status,
                seconds,
                distanceMeters,
                coords,
                sessionStartedAt: sessionStartedAtRef.current,
                pausedSeconds: pausedSecondsRef.current,
                pausedStartedAt: pausedStartedAtRef.current,
            }),
        );
    }, [coords, distanceMeters, isOpen, seconds, sportType, status]);

    useEffect(() => {
        if (!isOpen || status !== 'idle' || typeof window === 'undefined') return;

        const savedDraft = window.localStorage.getItem(GPS_DRAFT_KEY);
        if (!savedDraft) return;

        try {
            const draft = JSON.parse(savedDraft);
            if (!Array.isArray(draft.coords) || draft.coords.length === 0) return;

            setSportType(draft.sportType ?? 'running');
            setStatus('paused');
            setSeconds(Number(draft.seconds) || 0);
            setDistanceMeters(Number(draft.distanceMeters) || 0);
            setCoords(draft.coords);
            sessionStartedAtRef.current = Number(draft.sessionStartedAt) || Date.now();
            pausedSecondsRef.current = Number(draft.pausedSeconds) || 0;
            pausedStartedAtRef.current = Number(draft.pausedStartedAt) || Date.now();
            lastPointRef.current = draft.coords[draft.coords.length - 1];
            setGpsError('Sesi GPS sebelumnya dipulihkan. Tekan Lanjutkan untuk meneruskan.');
        } catch {
            window.localStorage.removeItem(GPS_DRAFT_KEY);
        }
    }, [isOpen, status]);

    useEffect(() => {
        if (!polylineRef.current || !mapInstanceRef.current || coords.length === 0) return;

        const latLngs = coords.map((point) => [point.lat, point.lng] as [number, number]);
        polylineRef.current.setLatLngs(latLngs);
        const lastPoint = latLngs[latLngs.length - 1];
        const map = mapInstanceRef.current;

        if (!currentMarkerRef.current) {
            currentMarkerRef.current = L.circleMarker(lastPoint, {
                radius: 8,
                color: '#059669',
                fillColor: '#10b981',
                fillOpacity: 1,
            }).addTo(map);
        } else {
            currentMarkerRef.current.setLatLng(lastPoint);
        }

        // Real-time GPS Accuracy visualization circle
        if (currentAccuracy !== null && currentAccuracy > 0) {
            if (!accuracyCircleRef.current) {
                accuracyCircleRef.current = L.circle(lastPoint, {
                    radius: currentAccuracy,
                    color: '#10b981',
                    fillColor: '#10b981',
                    fillOpacity: 0.12,
                    weight: 1.5,
                    dashArray: '4, 4',
                }).addTo(map);
            } else {
                accuracyCircleRef.current.setLatLng(lastPoint);
                accuracyCircleRef.current.setRadius(currentAccuracy);
            }
        }

        if (!map.getBounds().pad(-0.2).contains(lastPoint)) {
            map.panTo(lastPoint, { animate: true, duration: 0.25 });
        }
    }, [coords, currentAccuracy]);

    // Request Screen Wake Lock when running
    const requestWakeLock = async () => {
        try {
            if ('wakeLock' in navigator) {
                wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
            }
        } catch (err) {
            console.log('Wake lock rejected or unsupported', err);
        }
    };

    const releaseWakeLock = () => {
        if (wakeLockRef.current) {
            wakeLockRef.current.release().catch(() => undefined).finally(() => {
                wakeLockRef.current = null;
            });
        }
    };

    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible' && status === 'running') {
                requestWakeLock();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [status]);

    const stopTracking = () => {
        if (watchIdRef.current !== null && 'geolocation' in navigator) {
            navigator.geolocation.clearWatch(watchIdRef.current);
            watchIdRef.current = null;
        }
        releaseWakeLock();
    };

    const gpsErrorMessage = (error: GeolocationPositionError): string => {
        if (error.code === error.PERMISSION_DENIED) {
            return 'Izin lokasi ditolak. Aktifkan izin lokasi browser untuk memakai Live GPS.';
        }
        if (error.code === error.POSITION_UNAVAILABLE) {
            return 'Lokasi tidak tersedia. Pastikan GPS perangkat aktif dan coba lagi.';
        }
        if (error.code === error.TIMEOUT) {
            return 'GPS belum mendapatkan lokasi tepat waktu. Tetap di area terbuka lalu coba lagi.';
        }

        return 'Lokasi tidak dapat diperoleh dari perangkat.';
    };

    // Audio pacing announcement via Web Speech API every completed 1 KM
    useEffect(() => {
        if (!voiceEnabled || status !== 'running' || typeof window === 'undefined' || !('speechSynthesis' in window)) {
            return;
        }

        const currentKm = Math.floor(distanceMeters / 1000);
        if (currentKm > lastAnnouncedKmRef.current && currentKm >= 1) {
            lastAnnouncedKmRef.current = currentKm;

            const distKm = distanceMeters / 1000;
            const paceSecs = Math.round(seconds / distKm);
            const pMins = Math.floor(paceSecs / 60);
            const pSecs = paceSecs % 60;

            const speechText = `Kilometer ${currentKm} selesai. Waktu ${Math.floor(seconds / 60)} menit. Pace rata-rata ${pMins} menit ${pSecs} detik per kilometer.`;

            try {
                window.speechSynthesis.cancel();
                const utterance = new SpeechSynthesisUtterance(speechText);
                utterance.lang = 'id-ID';
                utterance.rate = 1.0;
                window.speechSynthesis.speak(utterance);
            } catch (err) {
                console.warn('Web Speech API notification error:', err);
            }
        }
    }, [distanceMeters, seconds, status, voiceEnabled]);

    // START ACTIVITY
    const handleStart = () => {
        if (!('geolocation' in navigator)) {
            setGpsError('Geolocation tidak didukung pada browser ini.');
            return;
        }
        if (!window.isSecureContext && !['localhost', '127.0.0.1'].includes(window.location.hostname)) {
            setGpsError('Live GPS membutuhkan koneksi HTTPS pada perangkat ini.');
            return;
        }

        if (sessionStartedAtRef.current === null) {
            sessionStartedAtRef.current = Date.now();
            lastAnnouncedKmRef.current = Math.floor(distanceMeters / 1000);
        }
        if (pausedStartedAtRef.current !== null) {
            pausedSecondsRef.current += Math.max(0, Math.round((Date.now() - pausedStartedAtRef.current) / 1000));
            pausedStartedAtRef.current = null;
        }

        setGpsError(null);
        setStatus('running');
        stopTracking();
        requestWakeLock();

        const id = navigator.geolocation.watchPosition(
            (pos) => {
                const rawAlt = pos.coords.altitude;
                const altitude = typeof rawAlt === 'number' && !isNaN(rawAlt)
                    ? Math.round(rawAlt * 10) / 10
                    : null;

                const accuracyMeters = Math.round(pos.coords.accuracy);
                setCurrentAccuracy(accuracyMeters);

                const newPoint: GpsPoint = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    timestamp: pos.timestamp,
                    altitude,
                };

                if (newPoint.accuracy > MAX_GPS_ACCURACY_METERS) {
                    setGpsError(`Akurasi GPS masih rendah (${Math.round(newPoint.accuracy)}m). Menunggu sinyal lebih baik.`);
                    return;
                }

                const lastPoint = lastPointRef.current;
                if (lastPoint !== null) {
                    if (newPoint.timestamp <= lastPoint.timestamp) {
                        return;
                    }

                    const segmentDistance = haversineDistance(
                        lastPoint.lat,
                        lastPoint.lng,
                        newPoint.lat,
                        newPoint.lng,
                    );
                    if (segmentDistance > MAX_GPS_JUMP_METERS) {
                        setGpsError('Perpindahan GPS tidak wajar diabaikan. Menunggu titik berikutnya.');
                        return;
                    }

                    lastPointRef.current = newPoint;
                    if (segmentDistance <= 1) {
                        return;
                    }

                    setDistanceMeters((distance) => distance + segmentDistance);

                    // Calculate elevation gain
                    if (altitude !== null) {
                        if (lastAltitudeRef.current !== null) {
                            const altDiff = altitude - lastAltitudeRef.current;
                            if (altDiff > 1.2 && altDiff < 100) {
                                setElevationGainMeters((prev) => Math.round((prev + altDiff) * 10) / 10);
                            }
                        }
                        lastAltitudeRef.current = altitude;
                    }
                } else {
                    lastPointRef.current = newPoint;
                    if (altitude !== null) {
                        lastAltitudeRef.current = altitude;
                    }
                }

                setGpsError(null);
                setCoords((previous) => [...previous, newPoint]);
            },
            (err) => {
                setGpsError(gpsErrorMessage(err));
            },
            {
                enableHighAccuracy: true,
                maximumAge: 0,
                timeout: 15000,
            },
        );

        watchIdRef.current = id;
    };

    // PAUSE ACTIVITY
    const handlePause = () => {
        if (status === 'running') {
            pausedStartedAtRef.current = Date.now();
        }
        setStatus('paused');
        stopTracking();
    };

    // RESUME ACTIVITY
    const handleResume = () => {
        handleStart();
    };

    // FINISH & SAVE ACTIVITY
    const handleFinish = () => {
        if (coords.length === 0 || sessionStartedAtRef.current === null) {
            setGpsError('Belum ada titik GPS yang valid untuk disimpan.');
            return;
        }

        const endedAt = Date.now();
        let pausedSeconds = pausedSecondsRef.current;
        if (status === 'paused' && pausedStartedAtRef.current !== null) {
            pausedSeconds += Math.max(0, Math.round((endedAt - pausedStartedAtRef.current) / 1000));
        }

        stopTracking();
        setStatus('finished');

        const sportTitles = {
            running: 'Sesi Lari Outdoor',
            cycling: 'Sesi Bersepeda',
            walking: 'Sesi Jalan Kaki',
        };

        router.post(
            route('activities.store'),
            {
                type: sportType,
                name: sportTitles[sportType],
                duration_minutes: Math.max(1, Math.round(seconds / 60)),
                source: 'browser_gps',
                started_at: new Date(sessionStartedAtRef.current).toISOString(),
                ended_at: new Date(endedAt).toISOString(),
                paused_seconds: pausedSeconds,
                route_points: coords,
            },
            {
                onSuccess: () => {
                    if (typeof window !== 'undefined') {
                        window.localStorage.removeItem(GPS_DRAFT_KEY);
                    }
                    onClose();
                },
                onError: () => setStatus('paused'),
            }
        );
    };

    const formatTimer = (totalSeconds: number) => {
        const hrs = Math.floor(totalSeconds / 3600);
        const mins = Math.floor((totalSeconds % 3600) / 60);
        const secs = totalSeconds % 60;
        if (hrs > 0) {
            return `${hrs}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }
        return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
    };

    const currentPace = () => {
        if (distanceMeters <= 50 || seconds === 0) return '--:--';
        const distKm = distanceMeters / 1000;
        const paceSecs = Math.round(seconds / distKm);
        const pMins = Math.floor(paceSecs / 60);
        const pSecs = paceSecs % 60;
        return `${pMins}:${pSecs < 10 ? '0' : ''}${pSecs}`;
    };

    const estimatedCalories = () => {
        const metMap = { running: 9.8, cycling: 7.5, walking: 3.8 };
        const met = metMap[sportType] || 8.0;
        return Math.round(met * userWeightKg * (seconds / 3600));
    };

    const getAccuracyInfo = () => {
        if (currentAccuracy === null) {
            return {
                label: 'Mencari GPS...',
                badgeClass: 'bg-slate-900/90 border-slate-700 text-slate-300',
                dotClass: 'bg-slate-400 animate-ping',
            };
        }
        if (currentAccuracy <= 8) {
            return {
                label: `Sangat Akurat (±${currentAccuracy}m)`,
                badgeClass: 'bg-emerald-950/90 border-emerald-500/50 text-emerald-400',
                dotClass: 'bg-emerald-400',
            };
        }
        if (currentAccuracy <= 20) {
            return {
                label: `Akurat (±${currentAccuracy}m)`,
                badgeClass: 'bg-lime-950/90 border-lime-500/50 text-lime-400',
                dotClass: 'bg-lime-400',
            };
        }
        if (currentAccuracy <= 40) {
            return {
                label: `Akurasi Cukup (±${currentAccuracy}m)`,
                badgeClass: 'bg-amber-950/90 border-amber-500/50 text-amber-400',
                dotClass: 'bg-amber-400',
            };
        }
        return {
            label: `Sinyal Lemah (±${currentAccuracy}m)`,
            badgeClass: 'bg-rose-950/90 border-rose-500/50 text-rose-400',
            dotClass: 'bg-rose-400 animate-pulse',
        };
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
            <div className="relative w-full max-w-2xl rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-800">
                    <div className="flex items-center gap-2.5">
                        <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                        <h3 className="font-bold text-base">Live Web GPS Tracker</h3>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Audio Pacing Voice Toggle */}
                        <button
                            type="button"
                            onClick={() => setVoiceEnabled((prev) => !prev)}
                            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition ${
                                voiceEnabled
                                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                            }`}
                            title={voiceEnabled ? 'Pemberitahuan suara aktif tiap 1 KM' : 'Pemberitahuan suara dimatikan'}
                        >
                            {voiceEnabled ? (
                                <>
                                    <Volume2 className="h-3.5 w-3.5 text-emerald-400" />
                                    <span>Voice On</span>
                                </>
                            ) : (
                                <>
                                    <VolumeX className="h-3.5 w-3.5 text-slate-400" />
                                    <span>Mute</span>
                                </>
                            )}
                        </button>

                        <button
                            onClick={() => {
                                if (status === 'running') {
                                    handlePause();
                                }
                                onClose();
                            }}
                            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Leaflet Map Canvas */}
                <div className="relative h-64 sm:h-80 w-full bg-slate-950">
                    <div ref={mapContainerRef} className="h-full w-full z-0" />

                    {/* Real-time GPS Accuracy Signal Badge */}
                    <div className="absolute top-3 right-3 z-10">
                        <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-[11px] font-bold backdrop-blur-md border shadow-lg transition-all ${getAccuracyInfo().badgeClass}`}>
                            <span className={`h-2 w-2 rounded-full ${getAccuracyInfo().dotClass}`} />
                            <span>{getAccuracyInfo().label}</span>
                        </div>
                    </div>

                    {gpsError && (
                        <div className="absolute top-3 left-3 max-w-[60%] z-10 rounded-xl bg-amber-500/95 p-2.5 text-xs text-slate-950 font-semibold backdrop-blur flex items-center gap-2 shadow-lg">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span className="truncate">{gpsError}</span>
                        </div>
                    )}
                </div>

                {/* Nike NRC Style HUD Live Metrics */}
                <div
                    className="p-4 sm:p-6 space-y-4 sm:space-y-6 bg-slate-950 border-t border-slate-800 pb-safe"
                    style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
                >
                    <div className="grid grid-cols-4 gap-1.5 sm:gap-2 text-center">
                        <div className="rounded-2xl bg-slate-900/90 p-2 sm:p-3.5 border border-slate-800 min-w-0">
                            <span className="text-[9px] sm:text-[10px] uppercase font-black text-slate-400 tracking-wider sm:tracking-widest block truncate">WAKTU</span>
                            <p className="font-athletic text-2xl sm:text-4xl text-white mt-0.5 sm:mt-1 truncate">{formatTimer(seconds)}</p>
                        </div>

                        <div className="rounded-2xl bg-slate-900/90 p-2 sm:p-3.5 border border-slate-800 min-w-0">
                            <span className="text-[9px] sm:text-[10px] uppercase font-black text-slate-400 tracking-wider sm:tracking-widest block truncate">JARAK</span>
                            <p className="font-athletic text-2xl sm:text-4xl text-emerald-400 mt-0.5 sm:mt-1 truncate">
                                {(distanceMeters / 1000).toFixed(2)}
                            </p>
                            <span className="text-[8px] sm:text-[9px] font-black text-slate-500 block tracking-wider sm:tracking-widest">KM</span>
                        </div>

                        <div className="rounded-2xl bg-slate-900/90 p-2 sm:p-3.5 border border-slate-800 min-w-0">
                            <span className="text-[9px] sm:text-[10px] uppercase font-black text-slate-400 tracking-wider sm:tracking-widest block truncate">PACE</span>
                            <p className="font-athletic text-2xl sm:text-4xl text-sky-400 mt-0.5 sm:mt-1 truncate">{currentPace()}</p>
                            <span className="text-[8px] sm:text-[9px] font-black text-slate-500 block tracking-wider sm:tracking-widest">/KM</span>
                        </div>

                        <div className="rounded-2xl bg-slate-900/90 p-2 sm:p-3.5 border border-slate-800 min-w-0">
                            <span className="text-[9px] sm:text-[10px] uppercase font-black text-slate-400 tracking-wider sm:tracking-widest block truncate">KALORI</span>
                            <p className="font-athletic text-2xl sm:text-4xl text-amber-400 mt-0.5 sm:mt-1 truncate">{estimatedCalories()}</p>
                            <span className="text-[8px] sm:text-[9px] font-black text-slate-500 block tracking-wider sm:tracking-widest">KCAL</span>
                        </div>
                    </div>

                    {/* Elevation Telemetry Strip */}
                    {elevationGainMeters > 0 && (
                        <div className="flex items-center justify-between rounded-xl bg-slate-900/60 px-4 py-2 border border-slate-800/80 text-xs">
                            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                                Total Elevasi Mendaki (Climb)
                            </span>
                            <div className="flex items-baseline gap-1">
                                <span className="font-metric text-lg text-emerald-400 font-bold">+{Math.round(elevationGainMeters)}</span>
                                <span className="text-[10px] font-bold text-slate-400">M</span>
                            </div>
                        </div>
                    )}

                    {/* Sport Type Selector when idle */}
                    {status === 'idle' && (
                        <div className="grid grid-cols-3 gap-2.5">
                            {(['running', 'cycling', 'walking'] as const).map((type) => (
                                <button
                                    key={type}
                                    type="button"
                                    onClick={() => setSportType(type)}
                                    className={`py-3 px-3 rounded-2xl border text-xs font-athletic text-base tracking-wider transition-all ${
                                        sportType === type
                                            ? 'border-emerald-500 bg-emerald-500/20 text-emerald-300 shadow-lg shadow-emerald-500/10'
                                            : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:bg-slate-850'
                                    }`}
                                >
                                    {type === 'running' ? 'LARI OUTDOOR' : type === 'cycling' ? 'BERSEPEDA' : 'JALAN SANTAI'}
                                </button>
                            ))}
                        </div>
                    )}

                    {/* Controls Actions */}
                    <div className="flex items-center gap-3">
                        {status === 'idle' && (
                            <button
                                onClick={handleStart}
                                className="w-full rounded-2xl bg-emerald-500 py-4 font-athletic text-xl tracking-wider text-slate-950 shadow-xl shadow-emerald-500/20 hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 transform active:scale-98"
                            >
                                <Play className="h-5 w-5 fill-slate-950" />
                                MULAI AKTIVITAS SEKARANG
                            </button>
                        )}

                        {status === 'running' && (
                            <>
                                <button
                                    onClick={handlePause}
                                    className="flex-1 rounded-2xl bg-amber-500 py-4 font-athletic text-lg tracking-wider text-slate-950 hover:bg-amber-400 transition-all flex items-center justify-center gap-2 shadow-md"
                                >
                                    <Pause className="h-5 w-5 fill-slate-950" />
                                    JEDA (PAUSE)
                                </button>
                                <button
                                    onClick={handleFinish}
                                    className="flex-1 rounded-2xl bg-rose-600 py-4 font-athletic text-lg tracking-wider text-white hover:bg-rose-500 transition-all flex items-center justify-center gap-2 shadow-md"
                                >
                                    <Square className="h-5 w-5 fill-white" />
                                    SELESAI & SIMPAN
                                </button>
                            </>
                        )}

                        {status === 'paused' && (
                            <>
                                <button
                                    onClick={handleResume}
                                    className="flex-1 rounded-2xl bg-emerald-500 py-4 font-athletic text-lg tracking-wider text-slate-950 hover:bg-emerald-400 transition-all flex items-center justify-center gap-2 shadow-md"
                                >
                                    <Play className="h-5 w-5 fill-slate-950" />
                                    LANJUTKAN
                                </button>
                                <button
                                    onClick={handleFinish}
                                    className="flex-1 rounded-2xl bg-rose-600 py-4 font-athletic text-lg tracking-wider text-white hover:bg-rose-500 transition-all flex items-center justify-center gap-2 shadow-md"
                                >
                                    <Square className="h-5 w-5 fill-white" />
                                    SELESAI
                                </button>
                            </>
                        )}
                    </div>

                    <p className="text-[11px] text-slate-500 text-center font-medium">
                        Screen Wake Lock otomatis aktif agar layar HP tetap menyala selama aktivitas berjalan.
                    </p>
                </div>
            </div>
        </div>
    );
}
