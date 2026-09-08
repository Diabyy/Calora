<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('indonesian_food_aliases', function (Blueprint $table) {
            $table->id();
            $table->foreignId('indonesian_food_id')
                ->constrained('indonesian_foods')
                ->cascadeOnDelete();
            $table->string('alias');
            $table->string('normalized_alias');
            $table->unique(['indonesian_food_id', 'normalized_alias']);
            $table->index('normalized_alias');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('indonesian_food_aliases');
    }
};
