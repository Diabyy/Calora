<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'age',
        'gender',
        'height_cm',
        'weight_kg',
        'activity_level',
        'goal',
        'bmr',
        'tdee',
        'daily_calorie_target',
        'protein_target_g',
        'carbs_target_g',
        'fat_target_g',
        'onboarding_completed',
    ];

    protected function casts(): array
    {
        return [
            'height_cm' => 'float',
            'weight_kg' => 'float',
            'onboarding_completed' => 'boolean',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
