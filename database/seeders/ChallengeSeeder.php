<?php

namespace Database\Seeders;

use App\Models\Challenge;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class ChallengeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $now = Carbon::now();
        $startOfMonth = $now->copy()->startOfMonth()->toDateString();
        $endOfMonth = $now->copy()->endOfMonth()->toDateString();
        $monthName = $now->translatedFormat('F');

        $challenges = [
            [
                'slug' => 'monthly_run_50k',
                'title' => "{$monthName} 50 KM Challenge 🏃",
                'description' => "Capai total akumulasi jarak lari 50 kilometer sepanjang bulan {$monthName}.",
                'goal_type' => 'distance',
                'target_value' => 50.0,
                'unit' => 'KM',
                'badge_icon' => 'Trophy',
                'points_reward' => 500,
                'starts_at' => $startOfMonth,
                'ends_at' => $endOfMonth,
            ],
            [
                'slug' => 'monthly_calorie_burn_5000',
                'title' => "{$monthName} Burn 5,000 kcal 🔥",
                'description' => 'Bakar total 5,000 kalori dari berbagai sesi aktivitas olahraga pilihanmu.',
                'goal_type' => 'calories',
                'target_value' => 5000.0,
                'unit' => 'KCAL',
                'badge_icon' => 'Flame',
                'points_reward' => 450,
                'starts_at' => $startOfMonth,
                'ends_at' => $endOfMonth,
            ],
            [
                'slug' => 'monthly_active_15_sessions',
                'title' => '15 Days Active Streak ⚡',
                'description' => 'Selesaikan minimal 15 sesi latihan olahraga dalam periode bulan ini.',
                'goal_type' => 'duration',
                'target_value' => 15.0,
                'unit' => 'SESI',
                'badge_icon' => 'Zap',
                'points_reward' => 400,
                'starts_at' => $startOfMonth,
                'ends_at' => $endOfMonth,
            ],
        ];

        foreach ($challenges as $c) {
            Challenge::updateOrCreate(['slug' => $c['slug']], $c);
        }
    }
}
