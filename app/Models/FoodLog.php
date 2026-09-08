<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class FoodLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'meal_type',
        'date',
        'notes',
        'total_calories',
        'total_protein',
        'total_carbs',
        'total_fat',
    ];

    protected function casts(): array
    {
        return [
            'date' => 'date',
            'total_protein' => 'float',
            'total_carbs' => 'float',
            'total_fat' => 'float',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(FoodLogItem::class);
    }
}
