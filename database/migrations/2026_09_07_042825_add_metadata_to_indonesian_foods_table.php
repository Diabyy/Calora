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
        Schema::table('indonesian_foods', function (Blueprint $table) {
            $table->string('preparation_state')->default('as_served')->index();
            $table->string('region')->nullable()->index();
            $table->string('source_version')->nullable();
            $table->string('source_reference')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('indonesian_foods', function (Blueprint $table) {
            $table->dropColumn([
                'preparation_state',
                'region',
                'source_version',
                'source_reference',
            ]);
        });
    }
};
