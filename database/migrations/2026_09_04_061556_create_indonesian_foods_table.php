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
        Schema::create('indonesian_foods', function (Blueprint $table) {
            $table->id();
            $table->string('name')->index();
            $table->string('category')->index(); // Makanan Pokok, Lauk Pauk, Sayuran, Jajanan & Camilan, Minuman
            $table->decimal('serving_size_g', 6, 2)->default(100);
            $table->string('serving_unit')->default('g');
            $table->decimal('calories', 6, 2);
            $table->decimal('protein', 6, 2);
            $table->decimal('carbs', 6, 2);
            $table->decimal('fat', 6, 2);
            $table->string('source')->default('TKPI');
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('indonesian_foods');
    }
};
