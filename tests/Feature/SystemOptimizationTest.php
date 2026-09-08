<?php

namespace Tests\Feature;

use App\Models\Activity;
use App\Models\IndonesianFood;
use App\Models\IndonesianFoodAlias;
use App\Models\User;
use App\Models\UserProfile;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class SystemOptimizationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        Cache::flush();
    }

    public function test_food_vision_serves_from_sha256_hash_cache_without_calling_gemini_twice(): void
    {
        $user = User::factory()->create();
        Config::set('services.gemini.api_key', 'test-gemini-key');
        Http::preventStrayRequests();

        $food = IndonesianFood::create([
            'name' => 'Soto Ayam',
            'category' => 'Sup & Soto',
            'serving_size_g' => 100,
            'calories' => 120,
            'protein' => 10.0,
            'carbs' => 8.0,
            'fat' => 5.0,
        ]);

        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'status' => 'detected',
                                        'dish_name' => 'Soto Ayam',
                                        'confidence' => 0.95,
                                        'items' => [
                                            [
                                                'name' => 'Soto Ayam',
                                                'portion_g' => 200,
                                                'confidence' => 0.95,
                                            ],
                                        ],
                                    ]),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        // Create a fake image with deterministic content
        $imageContent = 'fake-image-bytes-for-sha256-testing-12345';
        $file1 = UploadedFile::fake()->createWithContent('plate1.jpg', $imageContent);

        // First scan: should invoke Gemini API
        $response1 = $this->actingAs($user)->postJson('/nutrition/scan', [
            'image' => $file1,
        ]);

        $response1->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'detected',
                    'dish_name' => 'Soto Ayam',
                ],
            ]);

        Http::assertSentCount(1);

        // Second scan with identical content: should be served directly from SHA-256 cache!
        $file2 = UploadedFile::fake()->createWithContent('plate2.jpg', $imageContent);
        $response2 = $this->actingAs($user)->postJson('/nutrition/scan', [
            'image' => $file2,
        ]);

        $response2->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'status' => 'detected',
                    'dish_name' => 'Soto Ayam',
                ],
            ]);

        // Gemini API was NOT called again (count remains 1)
        Http::assertSentCount(1);
    }

    public function test_tkpi_food_search_is_cached_and_searches_by_alias(): void
    {
        $user = User::factory()->create();

        $food = IndonesianFood::create([
            'name' => 'Nasi Lemak',
            'category' => 'Makanan Pokok',
            'serving_size_g' => 100,
            'calories' => 160,
            'protein' => 3.0,
            'carbs' => 30.0,
            'fat' => 3.5,
        ]);

        IndonesianFoodAlias::create([
            'indonesian_food_id' => $food->id,
            'alias' => 'Nasi Gurih Melayu',
            'normalized_alias' => 'nasi gurih melayu',
        ]);

        // Search by alias
        $res1 = $this->actingAs($user)->getJson('/nutrition/search?q=Gurih');
        $res1->assertStatus(200);
        $res1->assertJsonFragment(['name' => 'Nasi Lemak']);

        // Verify cache key exists
        $cacheKey = 'calora:tkpi:search:'.md5('gurih:all');
        $this->assertTrue(Cache::has($cacheKey));

        // Second request uses the cache
        $res2 = $this->actingAs($user)->getJson('/nutrition/search?q=Gurih');
        $res2->assertStatus(200);
        $res2->assertJsonFragment(['name' => 'Nasi Lemak']);
    }

    public function test_dashboard_caches_streak_and_invalidates_on_new_activity_or_food_log(): void
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
            'daily_calorie_target' => 2200,
            'protein_target_g' => 130,
            'carbs_target_g' => 260,
            'fat_target_g' => 70,
            'onboarding_completed' => true,
        ]);

        $today = Carbon::today()->toDateString();
        $streakKey = "calora:user:{$user->id}:streak:{$today}";

        // Initial dashboard visit
        $this->actingAs($user)->get('/dashboard')->assertStatus(200);
        $this->assertTrue(Cache::has($streakKey));

        // Logging an activity should invalidate the streak cache
        $this->actingAs($user)->post('/activities', [
            'type' => 'running',
            'name' => 'Morning Run',
            'duration_minutes' => 30,
            'distance_km' => 5.0,
            'started_at' => now()->toISOString(),
        ])->assertRedirect();

        $this->assertFalse(Cache::has($streakKey));

        // Re-visiting dashboard re-populates cache
        $this->actingAs($user)->get('/dashboard')->assertStatus(200);
        $this->assertTrue(Cache::has($streakKey));

        // Logging a food item should also invalidate the streak cache
        $food = IndonesianFood::create([
            'name' => 'Telur Rebus',
            'category' => 'Lauk Pauk',
            'serving_size_g' => 50,
            'calories' => 78,
            'protein' => 6.3,
            'carbs' => 0.6,
            'fat' => 5.3,
        ]);

        $this->actingAs($user)->post('/nutrition/log', [
            'meal_type' => 'breakfast',
            'date' => $today,
            'items' => [
                [
                    'indonesian_food_id' => $food->id,
                    'portion_g' => 50,
                    'source' => 'database',
                ],
            ],
        ])->assertRedirect();

        $this->assertFalse(Cache::has($streakKey));
    }
}
