<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\FoodLog;
use App\Services\GamificationService;
use App\Services\MealRecommendationService;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __construct(
        protected MealRecommendationService $mealService,
        protected GamificationService $gamificationService
    ) {}

    /**
     * Display the main Calora Health & Nutrition dashboard.
     */
    public function index(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        $profile = $user->profile;

        // If user hasn't set up profile, prompt onboarding
        if (! $profile || ! $profile->onboarding_completed) {
            return redirect()->route('onboarding.show');
        }

        $today = Carbon::today()->toDateString();

        // 1. Food logs for today
        $todayLogs = FoodLog::where('user_id', $user->id)
            ->whereDate('date', $today)
            ->with(['items.indonesianFood'])
            ->get();

        $consumedCalories = (int) $todayLogs->sum('total_calories');
        $consumedProtein = (float) round($todayLogs->sum('total_protein'), 1);
        $consumedCarbs = (float) round($todayLogs->sum('total_carbs'), 1);
        $consumedFat = (float) round($todayLogs->sum('total_fat'), 1);

        // 2. Activities for today
        $todayActivities = Activity::where('user_id', $user->id)
            ->whereDate('started_at', $today)
            ->orderBy('started_at', 'desc')
            ->get();

        $burnedCalories = (int) $todayActivities->sum('calories_burned');
        $totalDistanceM = (float) $todayActivities->sum('distance_m');
        $totalDurationSec = (int) $todayActivities->sum('duration_seconds');

        // 3. Calorie Balance calculations
        $targetCalories = $profile->daily_calorie_target;
        $netCalories = $consumedCalories - $burnedCalories;
        $remainingCalories = ($targetCalories + $burnedCalories) - $consumedCalories;

        // 4. Protein Deficit
        $proteinDeficit = max(0, $profile->protein_target_g - $consumedProtein);

        // 5. Daily Health Score calculation (0 - 100)
        $nutritionScore = min(100, max(20, (int) round(($consumedProtein / max(1, $profile->protein_target_g)) * 80 + ($consumedCalories <= $targetCalories ? 20 : 0))));
        $activityScore = $burnedCalories > 0 ? min(100, (int) round(($burnedCalories / 400) * 100)) : 40;
        $dailyScore = (int) round(($nutritionScore * 0.5) + ($activityScore * 0.5));

        // 6. Signature Feature: "What Should I Eat?" recommendation
        $recommendations = $this->mealService->getRecommendations(
            $user,
            $remainingCalories,
            $proteinDeficit,
            $burnedCalories
        );

        // 7. Dynamic Calora Insight text
        $insight = $this->generateInsight(
            $burnedCalories,
            $consumedCalories,
            $targetCalories,
            $proteinDeficit,
            $todayActivities->first()
        );

        // Evaluate achievements & calculate streak
        $this->gamificationService->evaluateAchievements($user);
        $streak = $this->gamificationService->calculateStreak($user);

        return Inertia::render('Dashboard', [
            'profile' => $profile,
            'streak' => $streak,
            'balance' => [
                'target_calories' => $targetCalories,
                'consumed_calories' => $consumedCalories,
                'burned_calories' => $burnedCalories,
                'net_calories' => $netCalories,
                'remaining_calories' => $remainingCalories,
                'consumed_protein' => $consumedProtein,
                'target_protein' => $profile->protein_target_g,
                'consumed_carbs' => $consumedCarbs,
                'target_carbs' => $profile->carbs_target_g,
                'consumed_fat' => $consumedFat,
                'target_fat' => $profile->fat_target_g,
            ],
            'activity_summary' => [
                'total_distance_km' => round($totalDistanceM / 1000, 2),
                'total_duration_minutes' => (int) round($totalDurationSec / 60),
                'count' => $todayActivities->count(),
                'latest' => $todayActivities->first(),
            ],
            'daily_score' => [
                'score' => $dailyScore,
                'nutrition_score' => $nutritionScore,
                'activity_score' => $activityScore,
                'top_opportunity' => $proteinDeficit > 20 ? 'Tingkatkan asupan protein untuk recovery' : ($burnedCalories < 200 ? 'Tambah aktivitas fisik harian' : 'Pertahankan konsistensi seimbang'),
            ],
            'insight' => $insight,
            'recommendations' => $recommendations,
            'today_activities' => $todayActivities,
            'today_logs' => $todayLogs,
        ]);
    }

    /**
     * Generate contextual smart insight string.
     */
    protected function generateInsight(
        int $burned,
        int $consumed,
        int $target,
        float $proteinDeficit,
        ?Activity $latestActivity
    ): array {
        if ($burned > 300) {
            $badge = 'High Energy Output 🔥';
            $message = "Kamu sudah membakar {$burned} kcal hari ini".($latestActivity ? " dari {$latestActivity->name}" : '').'. ';
            if ($proteinDeficit > 20) {
                $message .= 'Namun asupan proteinmu masih sekitar '.round($proteinDeficit).'g di bawah target harian. Segera isi bahan bakar pemulihan otot!';
            } else {
                $message .= 'Pemenuhan proteinmu sejauh ini sangat baik untuk mendukung pemulihan!';
            }
        } elseif ($consumed > $target) {
            $badge = 'Calorie Overflow ⚠️';
            $message = 'Asupan kalori hari ini sudah melebihi target dasar sebesar '.($consumed - $target).' kcal. Luangkan waktu 20-30 menit jalan santai atau lari ringan untuk menyeimbangkannya.';
        } else {
            $badge = 'Steady Progress ✨';
            $message = 'Kamu berada di jalur yang baik. Masih tersedia ruang kalori untuk makan malam berprotein tinggi.';
        }

        return [
            'badge' => $badge,
            'message' => $message,
        ];
    }
}
