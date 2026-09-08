<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Activity extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'type',
        'source',
        'name',
        'distance_m',
        'duration_seconds',
        'calories_burned',
        'avg_pace_seconds_per_km',
        'avg_speed_kmh',
        'elevation_gain_m',
        'polyline',
        'started_at',
        'ended_at',
        'gps_point_count',
        'max_accuracy_m',
    ];

    protected function casts(): array
    {
        return [
            'distance_m' => 'float',
            'avg_speed_kmh' => 'float',
            'elevation_gain_m' => 'float',
            'started_at' => 'datetime',
            'ended_at' => 'datetime',
            'gps_point_count' => 'integer',
            'max_accuracy_m' => 'float',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function likes(): HasMany
    {
        return $this->hasMany(ActivityLike::class);
    }

    public function comments(): HasMany
    {
        return $this->hasMany(ActivityComment::class);
    }
}
