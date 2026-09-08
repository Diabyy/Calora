<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class IndonesianFoodAlias extends Model
{
    use HasFactory;

    protected $fillable = [
        'indonesian_food_id',
        'alias',
        'normalized_alias',
    ];

    public function food(): BelongsTo
    {
        return $this->belongsTo(IndonesianFood::class, 'indonesian_food_id');
    }
}
