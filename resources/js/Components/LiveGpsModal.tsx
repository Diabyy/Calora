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
    VolumeX,
    Navigation,
    Compass,
    Mountain
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
    const [latestPosition, setLatestPosition] = useState<[number, number] | null>(null);
    const [gpsStatus, setGpsStatus] = useState<'searching' | 'ready' | 'weak' | 'error'>('searching');

    const mapContainerRef = useRef<HTMLDivElement | null>(null);
    const mapInstanceRef = useRef<L.Map | null>(null);
    const polylineRef = useRef<L.Polyline | null>(null);
    const currentMarkerRef = useRef<L.CircleMarker | null>(null);
    const accuracyCircleRef = useRef<L.Circle | null>(null);
    const watchIdRef = useRef<number | null>(null);
    const previewWatchIdRef = useRef<number | null>(null);
    const wakeLockRef = useRef<any>(null);
    const lastPointRef = useRef<GpsPoint | null>(null);
    const lastAltitudeRef = useRef<number | null>(null);
    const lastAnnouncedKmRef = useRef<number>(0);
    const sessionStartedAtRef = useRef<number | null>(null);
    const pausedStartedAtRef = useRef<number | null>(null);
    const pausedSecondsRef = useRef(0);
    const hasInitialAutoZoomedRef = useRef<boolean>(false);

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

    // Helper: update or place Strava pulsing beacon marker on map
    const updateBeaconMarker = (lat: number, lng: number, accuracy: number) => {
        const map = mapInstanceRef.current;
        if (!map) return;

        // Strava Beacon: solid high-contrast dot with white ring
        if (!currentMarkerRef.current) {
            currentMarkerRef.current = L.circleMarker([lat, lng], {
                radius: 9,
                color: '#ffffff',
                weight: 3,
                fillColor: '#fc4c02',
                fillOpacity: 1,
            }).addTo(map);
        } else {
            currentMarkerRef.current.setLatLng([lat, lng]);
        }

        // Accuracy aura ring
        const auraRadius = Math.max(accuracy, 12);
        if (!accuracyCircleRef.current) {
            accuracyCircleRef.current = L.circle([lat, lng], {
                radius: auraRadius,
                color: '#fc4c02',
                fillColor: '#fc4c02',
                fillOpacity: 0.15,
                weight: 1.5,
                dashArray: '3, 4',
            }).addTo(map);
        } else {
            accuracyCircleRef.current.setLatLng([lat, lng]);
            accuracyCircleRef.current.setRadius(auraRadius);
        }
    };

    // Initialize map and pre-fetch location immediately with auto-zoom on discovery
    useEffect(() => {
        if (!isOpen || !mapContainerRef.current) return;

        hasInitialAutoZoomedRef.current = false;

        // Default initial view: Indonesia center overview before GPS resolves
        const map = L.map(mapContainerRef.current, { 
            preferCanvas: true,
            zoomControl: false,
        }).setView([-2.5489, 118.0149], 5);
        mapInstanceRef.current = map;

        // CartoDB Voyager Tile Layer: modern, clean vector-style running map
        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
            maxZoom: 20,
            subdomains: 'abcd',
        }).addTo(map);

        // Strava signature high-visibility orange polyline
        polylineRef.current = L.polyline([], { 
            color: '#fc4c02', 
            weight: 6, 
            opacity: 1,
            lineJoin: 'round',
            lineCap: 'round',
        }).addTo(map);

        window.setTimeout(() => map.invalidateSize(), 100);

        // PRE-FETCH GPS IMMEDIATELY: Auto-detect location & Auto-Zoom smoothly to street level!
        if ('geolocation' in navigator) {
            setGpsStatus('searching');

            previewWatchIdRef.current = navigator.geolocation.watchPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    const acc = Math.round(pos.coords.accuracy);

                    setCurrentAccuracy(acc);
                    setLatestPosition([lat, lng]);
                    setGpsStatus(acc <= 30 ? 'ready' : 'weak');
                    setGpsError(null);

                    if (mapInstanceRef.current) {
                        updateBeaconMarker(lat, lng, acc);

                        // AUTO ZOOM-IN ONCE DISCOVERED!
                        if (!hasInitialAutoZoomedRef.current) {
                            hasInitialAutoZoomedRef.current = true;
                            mapInstanceRef.current.flyTo([lat, lng], 17, {
                                animate: true,
                                duration: 1.2,
                            });
                        }
                    }
                },
                (err) => {
                    setGpsStatus('error');
                    setGpsError(gpsErrorMessage(err));
                },
                {
                    enableHighAccuracy: true,
                    maximumAge: 0,
                    timeout: 12000,
                }
            );
        } else {
            setGpsStatus('error');
            setGpsError('Geolocation tidak didukung pada browser ini.');
        }

        return () => {
            if (previewWatchIdRef.current !== null && 'geolocation' in navigator) {
                navigator.geolocation.clearWatch(previewWatchIdRef.current);
                previewWatchIdRef.current = null;
            }
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

    // Save session draft
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

    // Restore saved session draft if available
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

    // Update polyline as points accumulate
    useEffect(() => {
        if (!polylineRef.current || !mapInstanceRef.current || coords.length === 0) return;

        const latLngs = coords.map((point) => [point.lat, point.lng] as [number, number]);
        polylineRef.current.setLatLngs(latLngs);
        const lastPoint = latLngs[latLngs.length - 1];
        const map = mapInstanceRef.current;

        updateBeaconMarker(lastPoint[0], lastPoint[1], currentAccuracy || 10);

        if (!map.getBounds().pad(-0.15).contains(lastPoint)) {
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
            return 'GPS sedang mencari sinyal. Pindahlah ke area terbuka dan coba lagi.';
        }

        return 'Lokasi tidak dapat diperoleh dari perangkat.';
    };

    // Floating Recenter / Locate Me Handler
    const handleRecenter = () => {
        const map = mapInstanceRef.current;
        if (!map) return;

        if (latestPosition) {
            map.flyTo(latestPosition, 17, {
                animate: true,
                duration: 0.6,
            });
            return;
        }

        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    setLatestPosition([lat, lng]);
                    map.flyTo([lat, lng], 17, {
                        animate: true,
                        duration: 0.6,
                    });
                },
                (err) => setGpsError(gpsErrorMessage(err)),
                { enableHighAccuracy: true, timeout: 8000 }
            );
        }
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

        // Clean up preview watch if any
        if (previewWatchIdRef.current !== null) {
            navigator.geolocation.clearWatch(previewWatchIdRef.current);
            previewWatchIdRef.current = null;
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
                setLatestPosition([pos.coords.latitude, pos.coords.longitude]);
                setGpsStatus(accuracyMeters <= 30 ? 'ready' : 'weak');

                const newPoint: GpsPoint = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    timestamp: pos.timestamp,
                    altitude,
                };

                if (newPoint.accuracy > MAX_GPS_ACCURACY_METERS) {
                    setGpsError(`Akurasi GPS masih rendah (±${Math.round(newPoint.accuracy)}m). Menunggu sinyal lebih stabil.`);
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
                        setGpsError('Perpindahan titik terlalu ekstrem. Menunggu sinyal berikutnya.');
                        return;
                    }

                    lastPointRef.current = newPoint;
                    if (segmentDistance <= 1.2) {
                        return;
                    }

                    setDistanceMeters((distance) => distance + segmentDistance);

                    // Calculate elevation climb
                    if (altitude !== null) {
                        if (lastAltitudeRef.current !== null) {
                            const altDiff = altitude - lastAltitudeRef.current;
                            if (altDiff > 1.2 && altDiff < 80) {
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
                setGpsStatus('error');
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
            setGpsError('Belum ada lintasan GPS yang terekam untuk disimpan.');
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
            walking: 'Sesi Jalan Santai',
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

    const getGpsSignalBadge = () => {
        if (gpsStatus === 'searching' || currentAccuracy === null) {
            return (
                <div className="flex items-center gap-1.5 rounded-full bg-slate-900/85 px-3 py-1 text-[10px] font-bold text-slate-300 border border-slate-700 backdrop-blur shadow-md">
                    <span className="h-2 w-2 rounded-full bg-amber-400 animate-ping" />
                    <span>Mencari GPS...</span>
                </div>
            );
        }
        if (currentAccuracy <= 15) {
            return (
                <div className="flex items-center gap-1.5 rounded-full bg-[#111827]/90 px-3 py-1 text-[10px] font-black text-emerald-400 border border-emerald-500/40 backdrop-blur shadow-md">
                    <span className="h-2 w-2 rounded-full bg-emerald-400" />
                    <span>GPS Siap (±{currentAccuracy}m)</span>
                </div>
            );
        }
        if (currentAccuracy <= 35) {
            return (
                <div className="flex items-center gap-1.5 rounded-full bg-[#111827]/90 px-3 py-1 text-[10px] font-black text-lime-400 border border-lime-500/40 backdrop-blur shadow-md">
                    <span className="h-2 w-2 rounded-full bg-lime-400" />
                    <span>Sinyal GPS (±{currentAccuracy}m)</span>
                </div>
            );
        }
        return (
            <div className="flex items-center gap-1.5 rounded-full bg-rose-950/90 px-3 py-1 text-[10px] font-black text-rose-400 border border-rose-500/40 backdrop-blur shadow-md">
                <span className="h-2 w-2 rounded-full bg-rose-400 animate-pulse" />
                <span>Sinyal Lemah (±{currentAccuracy}m)</span>
            </div>
        );
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-4 backdrop-blur-md">
            <div className="relative w-full max-w-lg rounded-3xl bg-[#111827] border border-white/10 text-white shadow-2xl overflow-hidden flex flex-col max-h-[96vh]">
                
                {/* Strava Running Top Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#111827]">
                    {/* Left: Close Button */}
                    <button
                        type="button"
                        onClick={() => {
                            if (status === 'running') {
                                handlePause();
                            }
                            onClose();
                        }}
                        className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white transition active:scale-95"
                        aria-label="Tutup GPS Tracker"
                    >
                        <X className="h-5 w-5" />
                    </button>

                    {/* Center: Strava Sport Switcher Tabs */}
                    <div className="flex items-center gap-1 rounded-full bg-white/5 p-1 border border-white/10">
                        {(['running', 'cycling', 'walking'] as const).map((type) => (
                            <button
                                key={type}
                                type="button"
                                disabled={status !== 'idle'}
                                onClick={() => setSportType(type)}
                                className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider transition-all ${
                                    sportType === type
                                        ? 'bg-[#fc4c02] text-white shadow-md'
                                        : 'text-slate-400 hover:text-white disabled:opacity-50'
                                }`}
                            >
                                {type === 'running' ? 'Lari' : type === 'cycling' ? 'Sepeda' : 'Jalan'}
                            </button>
                        ))}
                    </div>

                    {/* Right: Audio Voice Pacing Toggle */}
                    <button
                        type="button"
                        onClick={() => setVoiceEnabled((prev) => !prev)}
                        className={`flex h-9 w-9 items-center justify-center rounded-xl transition active:scale-95 ${
                            voiceEnabled
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-white/5 text-slate-400 border border-white/10'
                        }`}
                        title={voiceEnabled ? 'Panduan Suara Aktif Tiap 1 KM' : 'Panduan Suara Dinonaktifkan'}
                    >
                        {voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                    </button>
                </div>

                {/* Leaflet Live Map Canvas */}
                <div className="relative h-60 sm:h-72 w-full bg-slate-950 overflow-hidden">
                    <div ref={mapContainerRef} className="h-full w-full z-0" />

                    {/* GPS Signal Status Badge */}
                    <div className="absolute top-3 left-3 z-20">
                        {getGpsSignalBadge()}
                    </div>

                    {/* Floating Strava Recenter / Locate Me Button */}
                    <button
                        type="button"
                        onClick={handleRecenter}
                        className="absolute bottom-3 right-3 z-20 flex h-10 w-10 items-center justify-center rounded-2xl bg-[#111827]/90 text-white border border-white/20 shadow-xl backdrop-blur-md hover:bg-slate-800 active:scale-95 transition-all"
                        title="Pusatkan ke Posisi Saya Sekarang"
                        aria-label="Pusatkan Lokasi GPS"
                    >
                        <Navigation className="h-4 w-4 text-[#fc4c02] fill-[#fc4c02]" />
                    </button>

                    {/* GPS Error Toast Notification */}
                    {gpsError && (
                        <div className="absolute bottom-3 left-3 right-16 z-20 rounded-xl bg-amber-500/95 px-3 py-2 text-xs font-bold text-slate-950 shadow-lg backdrop-blur flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span className="truncate">{gpsError}</span>
                        </div>
                    )}
                </div>

                {/* Strava Telemetry HUD & Controls */}
                <div 
                    className="p-5 sm:p-6 bg-[#0f172a] space-y-5 border-t border-white/10"
                    style={{ paddingBottom: 'calc(1.25rem + env(safe-area-inset-bottom, 0px))' }}
                >
                    {/* Primary Hero Metric: DISTANCE (KM) */}
                    <div className="text-center">
                        <span className="text-[11px] font-black uppercase tracking-[0.25em] text-[#fc4c02]">
                            JARAK TEMPUH
                        </span>
                        <div className="flex items-baseline justify-center gap-1.5 mt-0.5">
                            <span className="font-athletic text-6xl sm:text-7xl font-black text-white leading-none tracking-tight">
                                {(distanceMeters / 1000).toFixed(2)}
                            </span>
                            <span className="font-athletic text-2xl font-black text-slate-400">
                                KM
                            </span>
                        </div>
                    </div>

                    {/* Secondary Telemetry Grid (Time, Pace, Calories) */}
                    <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/10 text-center">
                        <div>
                            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                WAKTU
                            </span>
                            <p className="font-athletic text-2xl sm:text-3xl font-black text-white mt-0.5">
                                {formatTimer(seconds)}
                            </p>
                        </div>

                        <div>
                            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                PACE RATA2
                            </span>
                            <p className="font-athletic text-2xl sm:text-3xl font-black text-[#c8f169] mt-0.5">
                                {currentPace()}
                            </p>
                            <span className="text-[9px] font-black text-slate-500 block">/KM</span>
                        </div>

                        <div>
                            <span className="block text-[10px] font-black uppercase tracking-wider text-slate-400">
                                KALORI
                            </span>
                            <p className="font-athletic text-2xl sm:text-3xl font-black text-amber-400 mt-0.5">
                                {estimatedCalories()}
                            </p>
                            <span className="text-[9px] font-black text-slate-500 block">KCAL</span>
                        </div>
                    </div>

                    {/* Elevation Telemetry Strip */}
                    {elevationGainMeters > 0 && (
                        <div className="flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-white/5 border border-white/5 text-xs">
                            <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-slate-400">
                                <Mountain className="h-3.5 w-3.5 text-emerald-400" />
                                Elevasi Mendaki (Climb)
                            </span>
                            <span className="font-metric text-sm font-bold text-emerald-400">
                                +{Math.round(elevationGainMeters)} m
                            </span>
                        </div>
                    )}

                    {/* Strava Circular Action Buttons */}
                    <div className="pt-1">
                        {status === 'idle' && (
                            <button
                                type="button"
                                onClick={handleStart}
                                className="group relative flex w-full items-center justify-center gap-3 rounded-full bg-[#fc4c02] py-4 text-base sm:text-lg font-black uppercase tracking-wider text-white shadow-2xl shadow-[#fc4c02]/40 hover:bg-[#e03a00] active:scale-98 transition-all"
                            >
                                <Play className="h-6 w-6 fill-current" />
                                <span>START ({sportType.toUpperCase()})</span>
                            </button>
                        )}

                        {status === 'running' && (
                            <div className="flex flex-col items-center justify-center">
                                <button
                                    type="button"
                                    onClick={handlePause}
                                    className="flex h-20 w-20 items-center justify-center rounded-full bg-[#fc4c02] text-white shadow-2xl shadow-[#fc4c02]/40 hover:scale-105 active:scale-95 transition-transform"
                                    title="Jeda Lari (Pause)"
                                    aria-label="Jeda Lari"
                                >
                                    <Pause className="h-8 w-8 fill-current" />
                                </button>
                                <span className="mt-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    TEKAN UNTUK JEDA
                                </span>
                            </div>
                        )}

                        {status === 'paused' && (
                            <div className="flex items-center justify-center gap-10">
                                {/* Resume Button (Green Circular) */}
                                <div className="flex flex-col items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleResume}
                                        className="flex h-16 w-16 sm:h-18 sm:w-18 items-center justify-center rounded-full bg-[#c8f169] text-[#111827] shadow-xl shadow-lime-900/30 hover:scale-105 active:scale-95 transition-transform"
                                        title="Lanjutkan Lari"
                                        aria-label="Lanjutkan Sesi Lari"
                                    >
                                        <Play className="h-7 w-7 fill-current ml-0.5" />
                                    </button>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-[#c8f169]">
                                        LANJUTKAN
                                    </span>
                                </div>

                                {/* Finish Button (Rose Circular) */}
                                <div className="flex flex-col items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={handleFinish}
                                        className="flex h-16 w-16 sm:h-18 sm:w-18 items-center justify-center rounded-full bg-rose-600 text-white shadow-xl shadow-rose-900/40 hover:scale-105 active:scale-95 transition-transform"
                                        title="Selesai & Simpan"
                                        aria-label="Selesai & Simpan"
                                    >
                                        <Square className="h-6 w-6 fill-current" />
                                    </button>
                                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-400">
                                        SELESAI
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    <p className="text-[10px] text-slate-500 text-center font-medium">
                        Layar akan tetap menyala otomatis selama aktivitas lari berlangsung.
                    </p>
                </div>
            </div>
        </div>
    );
}
