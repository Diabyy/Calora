<?php

namespace Database\Seeders;

use App\Models\Achievement;
use Illuminate\Database\Seeder;

class AchievementSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $achievements = [
            [
                'slug' => 'first_5k',
                'title' => 'First 5K 🏃',
                'description' => 'Selesaikan sesi lari sejauh minimal 5 kilometer.',
                'icon' => 'Award',
                'category' => 'activity',
                'points' => 150,
            ],
            [
                'slug' => 'burn_1000',
                'title' => 'Burn 1,000 Calories 🔥',
                'description' => 'Bakar akumulasi total 1,000 kcal dari aktivitas olahraga.',
                'icon' => 'Flame',
                'category' => 'calorie',
                'points' => 200,
            ],
            [
                'slug' => 'activities_10',
                'title' => '10 Activities Milestone ⚡',
                'description' => 'Selesaikan 10 sesi olahraga yang tercatat di Calora.',
                'icon' => 'Zap',
                'category' => 'activity',
                'points' => 250,
            ],
            [
                'slug' => 'run_50k',
                'title' => '50 KM Explorer 🏅',
                'description' => 'Capai total jarak lari 50 kilometer secara kumulatif.',
                'icon' => 'Trophy',
                'category' => 'activity',
                'points' => 500,
            ],
            [
                'slug' => 'streak_7',
                'title' => '7 Day Active Streak 🔥',
                'description' => 'Catat aktivitas olahraga atau makanan 7 hari berturut-turut.',
                'icon' => 'Sparkles',
                'category' => 'streak',
                'points' => 300,
            ],
            [
                'slug' => 'nutri_master',
                'title' => 'Nutri Master 🥗',
                'description' => 'Catat makananmu sebanyak 10 kali menggunakan pencarian atau AI Food Scanner.',
                'icon' => 'Utensils',
                'category' => 'nutrition',
                'points' => 200,
            ],
        ];

        foreach ($achievements as $ach) {
            Achievement::updateOrCreate(['slug' => $ach['slug']], $ach);
        }
    }
}
