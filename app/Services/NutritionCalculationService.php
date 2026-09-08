<?php

namespace App\Services;

class NutritionCalculationService
{
    /**
     * Activity multipliers based on standard physical activity levels.
     */
    protected const ACTIVITY_MULTIPLIERS = [
        'sedentary' => 1.2,
        'lightly_active' => 1.375,
        'moderately_active' => 1.55,
        'very_active' => 1.725,
        'extra_active' => 1.9,
    ];

    /**
     * Calculate BMR, TDEE, Calorie Target, and Macro distribution.
     *
     * @return array{
     *     bmr: int,
     *     tdee: int,
     *     daily_calorie_target: int,
     *     protein_target_g: int,
     *     carbs_target_g: int,
     *     fat_target_g: int
     * }
     */
    public function calculateGoals(
        string $gender,
        int $age,
        float $heightCm,
        float $weightKg,
        string $activityLevel,
        string $goal
    ): array {
        // 1. Calculate BMR using Mifflin-St Jeor Equation
        if ($gender === 'female') {
            $bmr = (10 * $weightKg) + (6.25 * $heightCm) - (5 * $age) - 161;
        } else {
            $bmr = (10 * $weightKg) + (6.25 * $heightCm) - (5 * $age) + 5;
        }

        $bmr = (int) round($bmr);

        // 2. Calculate TDEE
        $multiplier = self::ACTIVITY_MULTIPLIERS[$activityLevel] ?? 1.2;
        $tdee = (int) round($bmr * $multiplier);

        // 3. Adjust Target Calories based on Goal
        $calorieTarget = match ($goal) {
            'lose_weight' => max(1200, $tdee - 500),
            'gain_muscle' => $tdee + 300,
            'maintain_weight', 'improve_fitness' => $tdee,
            default => $tdee,
        };

        // 4. Calculate Macronutrient Targets
        // Protein: 1.6g to 2.2g per kg body weight depending on goal
        $proteinGramsPerKg = match ($goal) {
            'gain_muscle' => 2.0,
            'lose_weight' => 1.8,
            default => 1.6,
        };
        $proteinTargetG = (int) round($weightKg * $proteinGramsPerKg);
        $proteinCalories = $proteinTargetG * 4;

        // Fat: ~25% of total calorie target (9 kcal per gram)
        $fatCalories = $calorieTarget * 0.25;
        $fatTargetG = (int) round($fatCalories / 9);

        // Carbs: Remainder calories (4 kcal per gram)
        $carbsCalories = max(0, $calorieTarget - ($proteinCalories + $fatCalories));
        $carbsTargetG = (int) round($carbsCalories / 4);

        return [
            'bmr' => $bmr,
            'tdee' => $tdee,
            'daily_calorie_target' => $calorieTarget,
            'protein_target_g' => $proteinTargetG,
            'carbs_target_g' => $carbsTargetG,
            'fat_target_g' => $fatTargetG,
        ];
    }
}
