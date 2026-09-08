<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Challenge extends Model
{
    use HasFactory;

    protected $fillable = [
        'slug',
        'title',
        'description',
        'goal_type',
        'target_value',
        'unit',
        'badge_icon',
        'points_reward',
        'starts_at',
        'ends_at',
    ];

    protected function casts(): array
    {
        return [
            'target_value' => 'float',
            'starts_at' => 'date',
            'ends_at' => 'date',
        ];
    }

    public function userChallenges(): HasMany
    {
        return $this->hasMany(UserChallenge::class);
    }
}
