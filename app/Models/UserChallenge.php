<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserChallenge extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'challenge_id',
        'current_progress',
        'is_completed',
        'completed_at',
    ];

    protected function casts(): array
    {
        return [
            'current_progress' => 'float',
            'is_completed' => 'boolean',
            'completed_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function challenge(): BelongsTo
    {
        return $this->belongsTo(Challenge::class);
    }
}
