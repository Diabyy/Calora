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
        Schema::create('food_log_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('food_log_id')->constrained()->cascadeOnDelete();
            $table->foreignId('indonesian_food_id')->nullable()->constrained('indonesian_foods')->nullOnDelete();
            $table->string('name');
            $table->decimal('portion_g', 6, 2)->default(100);
            $table->decimal('calories', 6, 2);
            $table->decimal('protein', 6, 2);
            $table->decimal('carbs', 6, 2);
            $table->decimal('fat', 6, 2);
            $table->string('source')->default('manual'); // manual, database, ai_scanner
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('food_log_items');
    }
};
