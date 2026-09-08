<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class IndonesianFood extends Model
{
    use HasFactory;

    protected $table = 'indonesian_foods';

    protected $fillable = [
        'name',
        'category',
        'serving_size_g',
        'serving_unit',
        'calories',
        'protein',
        'carbs',
        'fat',
        'source',
        'description',
        'preparation_state',
        'region',
        'source_version',
        'source_reference',
    ];

    protected function casts(): array
    {
        return [
            'serving_size_g' => 'float',
            'calories' => 'float',
            'protein' => 'float',
            'carbs' => 'float',
            'fat' => 'float',
        ];
    }

    public function foodLogItems(): HasMany
    {
        return $this->hasMany(FoodLogItem::class);
    }

    public function aliases(): HasMany
    {
        return $this->hasMany(IndonesianFoodAlias::class);
    }
}
