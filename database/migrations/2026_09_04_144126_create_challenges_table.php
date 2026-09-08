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
        Schema::create('challenges', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique();
            $table->string('title');
            $table->text('description');
            $table->string('goal_type'); // distance, calories, duration
            $table->decimal('target_value', 10, 2);
            $table->string('unit'); // km, kcal, minutes
            $table->string('badge_icon')->default('Trophy');
            $table->integer('points_reward')->default(300);
            $table->date('starts_at');
            $table->date('ends_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('challenges');
    }
};
