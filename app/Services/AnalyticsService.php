<?php

namespace App\Services;

use App\Models\Activity;
use App\Models\FoodLog;
use App\Models\User;
use App\Models\WeightLog;
use Carbon\Carbon;

class AnalyticsService
{
    /**
     * Get complete analytical metrics for the user.
     *
     * @return array{
     *     weight: array{
     *         current: float,
     *         starting: float,
     *         change: float,
     *         history: array<int, array{date: string, weight: float}>
     *     },
     *     calorie_trends: array<int, array{
     *         date: string,
     *         consumed: int,
     *         burned: int,
     *         target: int,
     *         net: int
     *     }>,
     *     macro_averages: array{
     *         protein: float,
     *         carbs: float,
     *         fat: float
     *     },
     *     activity_trends: array<int, array{
     *         week: string,
     *         distance_km: float,
     *         duration_hours: float,
     *         calories: int
     *     }>,
     *     comparative_analysis: array{
     *         distance_change_percent: float,
     *         pace_diff_seconds: int,
     *         insight: string
     *     }
     * }
     */
    public function getProgressAnalytics(User $user): array
    {
        $profile = $user->profile;
        $targetCalories = $profile?->daily_calorie_target ?? 2000;
        $initialWeight = (float) ($profile?->weight_kg ?? 65.0);

        // 1. Weight History
        $weightLogs = WeightLog::where('user_id', $user->id)
            ->orderBy('recorded_at', 'asc')
            ->get();

        if ($weightLogs->isEmpty()) {
            // Seed starting point from profile
            $weightHistory = [
                ['date' => Carbon::now()->subDays(14)->format('Y-m-d'), 'weight' => $initialWeight],
                ['date' => Carbon::now()->format('Y-m-d'), 'weight' => $initialWeight],
            ];
            $currentWeight = $initialWeight;
            $startingWeight = $initialWeight;
            $weightChange = 0.0;
        } else {
            $weightHistory = $weightLogs->map(fn ($log) => [
                'date' => $log->recorded_at->format('Y-m-d'),
                'weight' => (float) $log->weight_kg,
            ])->values()->all();

            $startingWeight = (float) $weightLogs->first()->weight_kg;
            $currentWeight = (float) $weightLogs->last()->weight_kg;
            $weightChange = round($currentWeight - $startingWeight, 2);
        }

        // 2. Calorie Trends (Last 7 Days)
        $calorieTrends = [];
        $totalProtein = 0;
        $totalCarbs = 0;
        $totalFat = 0;
        $daysWithFood = 0;

        for ($i = 6; $i >= 0; $i--) {
            $date = Carbon::today()->subDays($i)->format('Y-m-d');

            $dayLogs = FoodLog::where('user_id', $user->id)
                ->whereDate('date', $date)
                ->get();

            $dayActs = Activity::where('user_id', $user->id)
                ->whereDate('started_at', $date)
                ->get();

            $consumed = (int) $dayLogs->sum('total_calories');
            $burned = (int) $dayActs->sum('calories_burned');

            if ($dayLogs->isNotEmpty()) {
                $totalProtein += $dayLogs->sum('total_protein');
                $totalCarbs += $dayLogs->sum('total_carbs');
                $totalFat += $dayLogs->sum('total_fat');
                $daysWithFood++;
            }

            $calorieTrends[] = [
                'date' => Carbon::parse($date)->format('d M'),
                'consumed' => $consumed,
                'burned' => $burned,
                'target' => $targetCalories,
                'net' => $consumed - $burned,
            ];
        }

        $divisor = max(1, $daysWithFood);
        $macroAverages = [
            'protein' => round($totalProtein / $divisor, 1),
            'carbs' => round($totalCarbs / $divisor, 1),
            'fat' => round($totalFat / $divisor, 1),
        ];

        // 3. Weekly Activity Trends (Last 4 Weeks)
        $activityTrends = [];
        for ($w = 3; $w >= 0; $w--) {
            $startOfWeek = Carbon::now()->subWeeks($w)->startOfWeek();
            $endOfWeek = Carbon::now()->subWeeks($w)->endOfWeek();

            $weekActs = Activity::where('user_id', $user->id)
                ->whereBetween('started_at', [$startOfWeek, $endOfWeek])
                ->get();

            $distanceKm = round($weekActs->sum('distance_m') / 1000, 2);
            $hours = round($weekActs->sum('duration_seconds') / 3600, 1);
            $calories = (int) $weekActs->sum('calories_burned');

            $activityTrends[] = [
                'week' => 'W'.(4 - $w).' ('.$startOfWeek->format('d M').')',
                'distance_km' => $distanceKm,
                'duration_hours' => $hours,
                'calories' => $calories,
            ];
        }

        // 4. Comparative Analysis (Poin #4 Draft)
        $thisWeekActs = Activity::where('user_id', $user->id)
            ->whereBetween('started_at', [Carbon::now()->startOfWeek(), Carbon::now()])
            ->get();

        $lastWeekActs = Activity::where('user_id', $user->id)
            ->whereBetween('started_at', [Carbon::now()->subWeek()->startOfWeek(), Carbon::now()->subWeek()->endOfWeek()])
            ->get();

        $thisDist = (float) $thisWeekActs->sum('distance_m');
        $lastDist = (float) $lastWeekActs->sum('distance_m');

        if ($lastDist > 0) {
            $distPercent = round((($thisDist - $lastDist) / $lastDist) * 100, 1);
        } else {
            $distPercent = $thisDist > 0 ? 100.0 : 0.0;
        }

        $thisAvgPace = (int) ($thisWeekActs->whereNotNull('avg_pace_seconds_per_km')->avg('avg_pace_seconds_per_km') ?? 0);
        $lastAvgPace = (int) ($lastWeekActs->whereNotNull('avg_pace_seconds_per_km')->avg('avg_pace_seconds_per_km') ?? 0);
        $paceDiff = $lastAvgPace > 0 && $thisAvgPace > 0 ? ($lastAvgPace - $thisAvgPace) : 0;

        if ($distPercent > 0) {
            $insight = "Jarak latihan kamu minggu ini meningkat {$distPercent}% dibanding minggu lalu.";
        } elseif ($distPercent < 0) {
            $insight = 'Volume lari minggu ini lebih rileks ('.abs($distPercent).'% di bawah minggu lalu), bagus untuk pemulihan.';
        } else {
            $insight = 'Konsistensi latihan kamu stabil dibanding minggu sebelumnya.';
        }

        return [
            'weight' => [
                'current' => $currentWeight,
                'starting' => $startingWeight,
                'change' => $weightChange,
                'history' => $weightHistory,
            ],
            'calorie_trends' => $calorieTrends,
            'macro_averages' => $macroAverages,
            'activity_trends' => $activityTrends,
            'comparative_analysis' => [
                'distance_change_percent' => $distPercent,
                'pace_diff_seconds' => $paceDiff,
                'insight' => $insight,
            ],
        ];
    }
}
