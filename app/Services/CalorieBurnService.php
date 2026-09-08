<?php

namespace App\Services;

class CalorieBurnService
{
    /**
     * Standard Metabolic Equivalent of Task (MET) values.
     */
    protected const MET_VALUES = [
        'running' => 9.8,     // ~9:00/mile or 5:35/km pace
        'walking' => 3.8,     // Brisk walk ~5 km/h
        'cycling' => 7.5,     // Moderate leisure/road cycling ~19-22 km/h
        'basketball' => 8.0,  // Competitive game
        'workout' => 6.0,     // Weight training / HIIT circuit
        'other' => 5.0,
    ];

    /**
     * Calculate calories burned.
     */
    public function calculateBurnedCalories(
        string $type,
        int $durationMinutes,
        float $weightKg
    ): int {
        $met = self::MET_VALUES[$type] ?? 5.0;
        $hours = $durationMinutes / 60;

        // Calories = MET * Weight(kg) * Time(hours)
        $calories = $met * $weightKg * $hours;

        return (int) round($calories);
    }

    /**
     * Calculate average pace in seconds per kilometer.
     */
    public function calculatePaceSeconds(float $distanceMeters, int $durationSeconds): ?int
    {
        if ($distanceMeters <= 0 || $durationSeconds <= 0) {
            return null;
        }

        $distanceKm = $distanceMeters / 1000;

        return (int) round($durationSeconds / $distanceKm);
    }

    /**
     * Calculate average speed in km/h.
     */
    public function calculateSpeedKmh(float $distanceMeters, int $durationSeconds): ?float
    {
        if ($distanceMeters <= 0 || $durationSeconds <= 0) {
            return null;
        }

        $distanceKm = $distanceMeters / 1000;
        $hours = $durationSeconds / 3600;

        return round($distanceKm / $hours, 2);
    }
}
