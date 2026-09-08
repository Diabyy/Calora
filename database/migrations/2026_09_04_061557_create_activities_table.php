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
        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // running, walking, cycling, basketball, workout, other
            $table->string('source')->default('manual'); // manual, strava
            $table->string('strava_activity_id')->nullable()->index();
            $table->string('name');
            $table->decimal('distance_m', 10, 2)->nullable();
            $table->integer('duration_seconds');
            $table->integer('calories_burned');
            $table->integer('avg_pace_seconds_per_km')->nullable();
            $table->decimal('avg_speed_kmh', 5, 2)->nullable();
            $table->decimal('elevation_gain_m', 6, 2)->nullable();
            $table->text('polyline')->nullable();
            $table->timestamp('started_at');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('activities');
    }
};
