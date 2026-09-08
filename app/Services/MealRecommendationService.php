<?php

namespace App\Services;

use App\Models\User;

class MealRecommendationService
{
    /**
     * Generate smart meal recommendations based on current calorie balance and macro deficit.
     *
     * @return array{
     *     context_summary: string,
     *     recommendations: array<int, array{
     *         title: string,
     *         reason: string,
     *         total_calories: int,
     *         total_protein: float,
     *         total_carbs: float,
     *         total_fat: float,
     *         items: array<int, string>
     *     }>
     * }
     */
    public function getRecommendations(
        User $user,
        int $remainingCalories,
        float $proteinDeficit,
        int $caloriesBurnedToday
    ): array {
        $goal = $user->profile?->goal ?? 'maintain_weight';

        // Context summary message
        if ($caloriesBurnedToday > 300 && $proteinDeficit > 25) {
            $summary = "Kamu membakar {$caloriesBurnedToday} kcal hari ini dan kebutuhan proteinmu masih kurang ".round($proteinDeficit).'g. Rekomendasi di bawah mengutamakan pemulihan glikogen otot dan protein tinggi rendah lemak.';
        } elseif ($remainingCalories < 400) {
            $summary = "Sisa budget kalorimu tinggal {$remainingCalories} kcal. Pilihan terbaik adalah lauk protein padat dan sayuran kaya serat yang mengenyangkan tanpa melebihi target.";
        } else {
            $summary = "Sisa budget kalorimu {$remainingCalories} kcal dengan kekurangan protein ".round(max(0, $proteinDeficit)).'g. Berikut kombinasi hidangan nusantara yang seimbang.';
        }

        $options = [];

        // Option 1: High Protein Lean Meal (Ideal for recovery / muscle / fat loss)
        $options[] = [
            'title' => 'Dada Ayam Bakar Madu + Nasi Merah + Sayur Asem',
            'reason' => 'Tinggi protein murni (31g) untuk perbaikan serat otot dengan karbohidrat kompleks indeks glikemik rendah dan kuah segar asam tanpa santan.',
            'total_calories' => 410,
            'total_protein' => 32.5,
            'total_carbs' => 48.2,
            'total_fat' => 8.5,
            'items' => [
                'Dada Ayam Rebus/Bakar (100g) — 31g protein',
                'Nasi Merah (150g) — 34g karbohidrat kompleks',
                'Sayur Asem (1 mangkok) — kaya serat & mikronutrien',
            ],
        ];

        // Option 2: Traditional Comfort & Balanced
        $options[] = [
            'title' => 'Soto Ayam Lamongan Bening + Telur Rebus',
            'reason' => 'Kuah kaldu kunyit alami menghangatkan dan merehidrasi tubuh setelah berolahraga, dipadukan dengan asam amino esensial telur utuh.',
            'total_calories' => 388,
            'total_protein' => 27.3,
            'total_carbs' => 26.5,
            'total_fat' => 14.8,
            'items' => [
                'Soto Ayam Bening (1 mangkok) — 18g protein',
                '1 Butir Telur Ayam Rebus — 6.3g protein',
                'Nasi Putih Porsi Sedang (100g) — 130 kcal',
            ],
        ];

        // Option 3: Quick Protein Booster / Snack or Light Dinner
        $options[] = [
            'title' => 'Sate Ayam (Daging Saja) + Tempe Bacem + Air Kelapa',
            'reason' => 'Cepat, praktis, dan kaya kalium alami dari kelapa murni untuk mencegah kram otot setelah aktivitas fisik.',
            'total_calories' => 355,
            'total_protein' => 31.1,
            'total_carbs' => 20.9,
            'total_fat' => 12.5,
            'items' => [
                'Sate Ayam Tanpa Kulit (5 tusuk/100g) — 23.8g protein',
                'Tempe Bacem (1 potong) — 6.8g protein nabati',
                'Air Kelapa Muda Murni (1 gelas) — elektrolit rehidrasi',
            ],
        ];

        return [
            'context_summary' => $summary,
            'recommendations' => $options,
        ];
    }
}
