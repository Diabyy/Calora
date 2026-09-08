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
        Schema::create('user_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained()->cascadeOnDelete();
            $table->unsignedInteger('age');
            $table->string('gender'); // male, female
            $table->decimal('height_cm', 5, 2);
            $table->decimal('weight_kg', 5, 2);
            $table->string('activity_level'); // sedentary, lightly_active, moderately_active, very_active, extra_active
            $table->string('goal'); // lose_weight, maintain_weight, gain_muscle, improve_fitness
            $table->integer('bmr')->default(0);
            $table->integer('tdee')->default(0);
            $table->integer('daily_calorie_target')->default(2000);
            $table->integer('protein_target_g')->default(120);
            $table->integer('carbs_target_g')->default(250);
            $table->integer('fat_target_g')->default(65);
            $table->boolean('onboarding_completed')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('user_profiles');
    }
};
