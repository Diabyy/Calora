<?php

namespace App\Services;

use App\Models\Achievement;
use App\Models\Activity;
use App\Models\FoodLog;
use App\Models\User;
use App\Models\UserAchievement;
use Carbon\Carbon;

class GamificationService
{
    /**
     * Calculate consecutive active days streak for the user.
     */
    public function calculateStreak(User $user): int
    {
        $streak = 0;
        $checkDate = Carbon::today();

        // Check if user was active today or yesterday (grace period for today)
        $hasActivityToday = $this->wasActiveOnDate($user, $checkDate);
        if (! $hasActivityToday) {
            $checkDate = Carbon::yesterday();
            if (! $this->wasActiveOnDate($user, $checkDate)) {
                return 0; // Streak broken
            }
        }

        // Count back consecutive active days
        while ($this->wasActiveOnDate($user, $checkDate)) {
            $streak++;
            $checkDate = $checkDate->copy()->subDay();
        }

        return $streak;
    }

    /**
     * Evaluate and unlock achievements.
     *
     * @return array<int, string> Newly unlocked achievement titles
     */
    public function evaluateAchievements(User $user): array
    {
        $newlyUnlocked = [];

        $totalActivities = Activity::where('user_id', $user->id)->count();
        $totalBurnedCalories = (int) Activity::where('user_id', $user->id)->sum('calories_burned');
        $totalDistanceM = (float) Activity::where('user_id', $user->id)->sum('distance_m');
        $longestRun = (float) (Activity::where('user_id', $user->id)->where('type', 'running')->max('distance_m') ?? 0);
        $totalFoodLogs = FoodLog::where('user_id', $user->id)->count();
        $streak = $this->calculateStreak($user);

        // 1. First 5K
        if ($longestRun >= 5000) {
            if ($this->unlock($user, 'first_5k')) {
                $newlyUnlocked[] = 'First 5K 🏃';
            }
        }

        // 2. Burn 1,000 Calories
        if ($totalBurnedCalories >= 1000) {
            if ($this->unlock($user, 'burn_1000')) {
                $newlyUnlocked[] = 'Burn 1,000 Calories 🔥';
            }
        }

        // 3. 10 Activities
        if ($totalActivities >= 10) {
            if ($this->unlock($user, 'activities_10')) {
                $newlyUnlocked[] = '10 Activities Milestone ⚡';
            }
        }

        // 4. 50 KM Run
        if ($totalDistanceM >= 50000) {
            if ($this->unlock($user, 'run_50k')) {
                $newlyUnlocked[] = '50 KM Explorer 🏅';
            }
        }

        // 5. 7 Day Active Streak
        if ($streak >= 7) {
            if ($this->unlock($user, 'streak_7')) {
                $newlyUnlocked[] = '7 Day Active Streak 🔥';
            }
        }

        // 6. Nutri Master
        if ($totalFoodLogs >= 10) {
            if ($this->unlock($user, 'nutri_master')) {
                $newlyUnlocked[] = 'Nutri Master 🥗';
            }
        }

        return $newlyUnlocked;
    }

    /**
     * Check if user had any food log or activity on a specific date.
     */
    protected function wasActiveOnDate(User $user, Carbon $date): bool
    {
        $hasFood = FoodLog::where('user_id', $user->id)
            ->whereDate('date', $date->toDateString())
            ->exists();

        if ($hasFood) {
            return true;
        }

        return Activity::where('user_id', $user->id)
            ->whereDate('started_at', $date->toDateString())
            ->exists();
    }

    /**
     * Unlock an achievement for the user if not already unlocked.
     */
    protected function unlock(User $user, string $slug): bool
    {
        $achievement = Achievement::where('slug', $slug)->first();
        if (! $achievement) {
            return false;
        }

        $exists = UserAchievement::where('user_id', $user->id)
            ->where('achievement_id', $achievement->id)
            ->exists();

        if (! $exists) {
            UserAchievement::create([
                'user_id' => $user->id,
                'achievement_id' => $achievement->id,
                'unlocked_at' => now(),
            ]);

            return true;
        }

        return false;
    }
}
