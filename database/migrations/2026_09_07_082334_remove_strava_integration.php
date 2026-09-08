<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::table('activities')
            ->where('source', 'strava')
            ->update(['source' => 'legacy_import']);

        if (Schema::hasTable('strava_accounts')) {
            DB::table('strava_accounts')->delete();
            Schema::dropIfExists('strava_accounts');
        }

        Schema::table('activities', function (Blueprint $table) {
            $table->dropIndex(['strava_activity_id']);
            $table->dropColumn('strava_activity_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('activities', function (Blueprint $table) {
            $table->string('strava_activity_id')->nullable()->index();
        });

        Schema::create('strava_accounts', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('athlete_id')->nullable();
            $table->text('access_token')->nullable();
            $table->text('refresh_token')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->string('scope')->nullable();
            $table->timestamp('synced_at')->nullable();
            $table->timestamps();
        });

        DB::table('activities')
            ->where('source', 'legacy_import')
            ->update(['source' => 'strava']);
    }
};
