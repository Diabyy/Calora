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
        Schema::create('food_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('meal_type'); // breakfast, lunch, dinner, snack
            $table->date('date')->index();
            $table->string('notes')->nullable();
            $table->integer('total_calories')->default(0);
            $table->decimal('total_protein', 6, 2)->default(0);
            $table->decimal('total_carbs', 6, 2)->default(0);
            $table->decimal('total_fat', 6, 2)->default(0);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('food_logs');
    }
};
