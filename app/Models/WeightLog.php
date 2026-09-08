<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WeightLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'weight_kg',
        'recorded_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'weight_kg' => 'float',
            'recorded_at' => 'date',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
