<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Services\CalorieBurnService;
use App\Services\GpsRouteService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ActivityController extends Controller
{
    public function __construct(
        protected CalorieBurnService $calorieService,
        protected GpsRouteService $gpsRouteService,
    ) {}

    /**
     * Display all activities and tracking dashboard.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $activities = Activity::where('user_id', $user->id)
            ->orderBy('started_at', 'desc')
            ->get();

        $stats = [
            'total_distance_km' => round($activities->sum('distance_m') / 1000, 2),
            'total_duration_minutes' => (int) round($activities->sum('duration_seconds') / 60),
            'total_calories' => (int) $activities->sum('calories_burned'),
            'activities_count' => $activities->count(),
        ];

        return Inertia::render('Activities/Index', [
            'activities' => $activities,
            'stats' => $stats,
        ]);
    }

    /**
     * Store manual activity.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'type' => ['required', 'in:running,walking,cycling,basketball,workout,other'],
            'name' => ['required', 'string', 'max:150'],
            'duration_minutes' => ['required', 'integer', 'min:1', 'max:1440'],
            'distance_km' => ['nullable', 'numeric', 'min:0'],
            'elevation_gain_m' => ['nullable', 'numeric', 'min:0'],
            'started_at' => ['required', 'date'],
            'ended_at' => ['nullable', 'date', 'after_or_equal:started_at'],
            'paused_seconds' => ['nullable', 'integer', 'min:0', 'max:86400'],
            'source' => ['nullable', 'in:manual,browser_gps'],
            'route_points' => ['nullable', 'array', 'max:2000'],
            'route_points.*.lat' => ['required', 'numeric', 'between:-90,90'],
            'route_points.*.lng' => ['required', 'numeric', 'between:-180,180'],
            'route_points.*.accuracy' => ['required', 'numeric', 'min:0', 'max:100'],
            'route_points.*.timestamp' => ['required', 'integer', 'min:1'],
            'route_points.*.altitude' => ['nullable', 'numeric'],
        ]);

        $user = $request->user();
        $weight = (float) ($user->profile?->weight_kg ?? 65.0);
        $isBrowserGps = ($validated['source'] ?? 'manual') === 'browser_gps';
        $startedAt = Carbon::parse($validated['started_at']);
        $endedAt = isset($validated['ended_at']) ? Carbon::parse($validated['ended_at']) : null;
        $routeMetrics = [
            'polyline' => null,
            'distance_m' => null,
            'elevation_gain_m' => null,
            'point_count' => null,
            'max_accuracy_m' => null,
        ];

        if ($isBrowserGps) {
            if ($endedAt === null || empty($validated['route_points'])) {
                throw ValidationException::withMessages([
                    'route_points' => 'Sesi GPS harus memiliki waktu selesai dan titik rute.',
                ]);
            }

            $routeMetrics = $this->gpsRouteService->process($validated['route_points']);
            if ($routeMetrics['point_count'] === 0) {
                throw ValidationException::withMessages([
                    'route_points' => 'Tidak ada titik GPS dengan akurasi yang cukup.',
                ]);
            }
        }

        $durationSeconds = $isBrowserGps
            ? max(1, (int) $startedAt->diffInSeconds($endedAt) - (int) ($validated['paused_seconds'] ?? 0))
            : $validated['duration_minutes'] * 60;
        $durationMinutes = max(1, (int) ceil($durationSeconds / 60));
        $distanceMeters = $isBrowserGps
            ? $routeMetrics['distance_m']
            : (! empty($validated['distance_km']) ? $validated['distance_km'] * 1000 : null);

        $calories = $this->calorieService->calculateBurnedCalories(
            $validated['type'],
            $durationMinutes,
            $weight
        );

        $paceSeconds = $distanceMeters ? $this->calorieService->calculatePaceSeconds($distanceMeters, $durationSeconds) : null;
        $speedKmh = $distanceMeters ? $this->calorieService->calculateSpeedKmh($distanceMeters, $durationSeconds) : null;

        Activity::create([
            'user_id' => $user->id,
            'type' => $validated['type'],
            'source' => $isBrowserGps ? 'browser_gps' : 'manual',
            'name' => $validated['name'],
            'distance_m' => $distanceMeters,
            'duration_seconds' => $durationSeconds,
            'calories_burned' => $calories,
            'avg_pace_seconds_per_km' => $paceSeconds,
            'avg_speed_kmh' => $speedKmh,
            'elevation_gain_m' => $isBrowserGps ? $routeMetrics['elevation_gain_m'] : ($validated['elevation_gain_m'] ?? null),
            'polyline' => $routeMetrics['polyline'],
            'gps_point_count' => $routeMetrics['point_count'],
            'max_accuracy_m' => $routeMetrics['max_accuracy_m'],
            'started_at' => $startedAt,
            'ended_at' => $endedAt,
        ]);

        Cache::forget("calora:user:{$user->id}:streak:".Carbon::today()->toDateString());

        return redirect()->back()->with('success', 'Aktivitas berhasil dicatat!');
    }

    /**
     * Delete an activity.
     */
    public function destroy(Request $request, Activity $activity): RedirectResponse
    {
        if ($activity->user_id !== $request->user()->id) {
            abort(403);
        }

        $userId = $activity->user_id;
        $activity->delete();

        Cache::forget("calora:user:{$userId}:streak:".Carbon::today()->toDateString());

        return redirect()->back()->with('success', 'Aktivitas berhasil dihapus.');
    }
}
