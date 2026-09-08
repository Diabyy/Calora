<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class FoodLogItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'food_log_id',
        'indonesian_food_id',
        'name',
        'portion_g',
        'calories',
        'protein',
        'carbs',
        'fat',
        'source',
    ];

    protected function casts(): array
    {
        return [
            'portion_g' => 'float',
            'calories' => 'float',
            'protein' => 'float',
            'carbs' => 'float',
            'fat' => 'float',
        ];
    }

    public function foodLog(): BelongsTo
    {
        return $this->belongsTo(FoodLog::class);
    }

    public function indonesianFood(): BelongsTo
    {
        return $this->belongsTo(IndonesianFood::class);
    }
}
