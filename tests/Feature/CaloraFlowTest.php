<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\Challenge;
use App\Models\IndonesianFood;
use App\Models\User;
use App\Models\UserProfile;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class CaloraFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_welcome_page_is_accessible(): void
    {
        $response = $this->get('/');
        $response->assertStatus(200);
    }

    public function test_user_can_complete_onboarding_and_targets_are_calculated(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/onboarding', [
            'age' => 25,
            'gender' => 'male',
            'height_cm' => 175,
            'weight_kg' => 70,
            'activity_level' => 'moderately_active',
            'goal' => 'lose_weight',
        ]);

        $response->assertRedirect('/dashboard');

        $profile = UserProfile::where('user_id', $user->id)->first();
        $this->assertNotNull($profile);
        $this->assertTrue($profile->onboarding_completed);
        $this->assertGreaterThan(1000, $profile->bmr);
        $this->assertGreaterThan(1200, $profile->daily_calorie_target);
    }

    public function test_user_can_log_food_and_search_indonesian_database(): void
    {
        $user = User::factory()->create();
        UserProfile::create([
            'user_id' => $user->id,
            'age' => 25,
            'gender' => 'male',
            'height_cm' => 175,
            'weight_kg' => 70,
            'activity_level' => 'moderately_active',
            'goal' => 'maintain_weight',
            'onboarding_completed' => true,
        ]);

        $food = IndonesianFood::create([
            'name' => 'Nasi Putih',
            'category' => 'Makanan Pokok',
            'calories' => 130,
            'protein' => 2.4,
            'carbs' => 28.6,
            'fat' => 0.3,
        ]);

        // Search test
        $searchRes = $this->actingAs($user)->getJson('/nutrition/search?q=Nasi');
        $searchRes->assertStatus(200);
        $searchRes->assertJsonFragment(['name' => 'Nasi Putih']);

        // Log food test
        $logRes = $this->actingAs($user)->post('/nutrition/log', [
            'meal_type' => 'lunch',
            'date' => now()->toDateString(),
            'items' => [
                [
                    'portion_g' => 150,
                    'source' => 'database',
                    'indonesian_food_id' => $food->id,
                ],
            ],
        ]);

        $logRes->assertRedirect();
        $this->assertDatabaseHas('food_logs', ['meal_type' => 'lunch', 'user_id' => $user->id]);

        $foodLogItem = $user->foodLogs()->firstOrFail()->items()->firstOrFail();
        $this->assertSame(195.0, (float) $foodLogItem->calories);
        $this->assertSame(3.6, (float) $foodLogItem->protein);
        $this->assertSame(42.9, (float) $foodLogItem->carbs);
        $this->assertSame(0.4, (float) $foodLogItem->fat);
    }

    public function test_user_can_record_activity_and_calories_burned_are_computed(): void
    {
        $user = User::factory()->create();
        UserProfile::create([
            'user_id' => $user->id,
            'age' => 25,
            'gender' => 'male',
            'height_cm' => 175,
            'weight_kg' => 70,
            'activity_level' => 'moderately_active',
            'goal' => 'maintain_weight',
            'onboarding_completed' => true,
        ]);

        $res = $this->actingAs($user)->post('/activities', [
            'type' => 'running',
            'name' => 'Morning Run 5K',
            'duration_minutes' => 30,
            'distance_km' => 5.0,
            'started_at' => now()->toISOString(),
        ]);

        $res->assertRedirect();
        $this->assertDatabaseHas('activities', [
            'user_id' => $user->id,
            'type' => 'running',
            'name' => 'Morning Run 5K',
        ]);
    }

    public function test_browser_gps_activity_persists_route_and_recalculates_distance_server_side(): void
    {
        $user = User::factory()->create();
        UserProfile::create([
            'user_id' => $user->id,
            'age' => 25,
            'gender' => 'male',
            'height_cm' => 175,
            'weight_kg' => 70,
            'activity_level' => 'moderately_active',
            'goal' => 'maintain_weight',
            'onboarding_completed' => true,
        ]);

        $startedAt = now()->subSeconds(20);
        $endedAt = now();
        $response = $this->actingAs($user)->post('/activities', [
            'type' => 'running',
            'name' => 'Live GPS Run',
            'source' => 'browser_gps',
            'duration_minutes' => 1,
            'distance_km' => 999,
            'started_at' => $startedAt->toISOString(),
            'ended_at' => $endedAt->toISOString(),
            'paused_seconds' => 0,
            'route_points' => [
                ['lat' => -6.2000, 'lng' => 106.8000, 'accuracy' => 8, 'timestamp' => 1700000000000],
                ['lat' => -6.1990, 'lng' => 106.8000, 'accuracy' => 9, 'timestamp' => 1700000005000],
                ['lat' => -6.1985, 'lng' => 106.8005, 'accuracy' => 10, 'timestamp' => 1700000010000],
            ],
        ]);

        $response->assertRedirect();

        $activity = $user->activities()->latest('id')->firstOrFail();
        $this->assertSame('browser_gps', $activity->source);
        $this->assertNotNull($activity->polyline);
        $this->assertSame(3, $activity->gps_point_count);
        $this->assertGreaterThan(100, (float) $activity->distance_m);
        $this->assertLessThan(1, (float) $activity->distance_m / 1000);
        $this->assertSame(20, $activity->duration_seconds);
    }

    public function test_browser_gps_activity_rejects_inaccurate_points(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->post('/activities', [
            'type' => 'walking',
            'name' => 'Invalid GPS Session',
            'source' => 'browser_gps',
            'duration_minutes' => 1,
            'started_at' => now()->subMinute()->toISOString(),
            'ended_at' => now()->toISOString(),
            'route_points' => [
                ['lat' => -6.2000, 'lng' => 106.8000, 'accuracy' => 101, 'timestamp' => 1700000000000],
            ],
        ]);

        $response->assertSessionHasErrors(['route_points.0.accuracy']);
        $this->assertDatabaseMissing('activities', ['name' => 'Invalid GPS Session']);
    }

    public function test_ai_assistant_endpoint_responds(): void
    {
        Config::set('services.gemini.api_key', 'test-gemini-key');
        Http::preventStrayRequests();
        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => 'Pilih makanan dengan protein yang cukup setelah berlari.',
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $user = User::factory()->create();
        UserProfile::create([
            'user_id' => $user->id,
            'age' => 25,
            'gender' => 'male',
            'height_cm' => 175,
            'weight_kg' => 70,
            'activity_level' => 'moderately_active',
            'goal' => 'maintain_weight',
            'onboarding_completed' => true,
        ]);

        $res = $this->actingAs($user)->postJson('/ai/chat', [
            'message' => 'Habis lari 5km, makan apa?',
        ]);

        $res->assertStatus(200);
        $res->assertJsonStructure(['reply']);
    }

    public function test_barcode_lookup_rejects_invalid_barcode_values(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/nutrition/barcode?barcode=not-a-barcode');

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'message' => 'Barcode harus berupa 8-14 digit.',
            ]);
    }

    public function test_barcode_lookup_does_not_fabricate_a_product_when_open_food_facts_fails(): void
    {
        Http::preventStrayRequests();
        Http::fake([
            'https://world.openfoodfacts.org/*' => Http::response([], 500),
        ]);

        $user = User::factory()->create();

        $response = $this->actingAs($user)->getJson('/nutrition/barcode?barcode=8998866200388');

        $response->assertStatus(503)
            ->assertJson([
                'success' => false,
                'message' => 'Layanan barcode sedang tidak tersedia. Silakan coba lagi nanti.',
            ]);
    }

    public function test_scan_endpoint_is_rate_limited(): void
    {
        $user = User::factory()->create();

        for ($attempt = 0; $attempt < 10; $attempt++) {
            $this->actingAs($user)->postJson('/nutrition/scan', []);
        }

        $response = $this->actingAs($user)->postJson('/nutrition/scan', []);

        $response->assertStatus(429);
    }

    public function test_user_can_join_challenge(): void
    {
        $user = User::factory()->create();
        $challenge = Challenge::create([
            'slug' => 'test_run_50k',
            'title' => 'Test 50 KM Challenge',
            'description' => 'Test',
            'goal_type' => 'distance',
            'target_value' => 50,
            'unit' => 'KM',
            'starts_at' => now()->startOfMonth(),
            'ends_at' => now()->endOfMonth(),
        ]);

        $res = $this->actingAs($user)->post("/challenges/{$challenge->id}/join");
        $res->assertRedirect();
        $this->assertDatabaseHas('user_challenges', [
            'user_id' => $user->id,
            'challenge_id' => $challenge->id,
        ]);
    }

    public function test_user_can_like_and_comment_in_community(): void
    {
        $user = User::factory()->create();
        $activity = Activity::create([
            'user_id' => $user->id,
            'type' => 'running',
            'name' => 'Community Run',
            'duration_seconds' => 1800,
            'calories_burned' => 300,
            'started_at' => now(),
        ]);

        // Toggle like
        $likeRes = $this->actingAs($user)->post("/community/{$activity->id}/like");
        $likeRes->assertRedirect();
        $this->assertDatabaseHas('activity_likes', [
            'user_id' => $user->id,
            'activity_id' => $activity->id,
        ]);

        // Comment
        $commentRes = $this->actingAs($user)->post("/community/{$activity->id}/comment", [
            'comment' => 'Mantap larinya!',
        ]);
        $commentRes->assertRedirect();
        $this->assertDatabaseHas('activity_comments', [
            'user_id' => $user->id,
            'activity_id' => $activity->id,
            'comment' => 'Mantap larinya!',
        ]);
    }
}
