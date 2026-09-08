<?php

namespace Tests\Feature;

use App\Models\IndonesianFood;
use App\Models\IndonesianFoodAlias;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class FoodVisionScannerTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        IndonesianFood::create([
            'name' => 'Nasi Putih',
            'category' => 'Makanan Pokok',
            'serving_size_g' => 100,
            'calories' => 130,
            'protein' => 2.4,
            'carbs' => 28.6,
            'fat' => 0.3,
        ]);

        IndonesianFood::create([
            'name' => 'Rendang Sapi',
            'category' => 'Lauk Pauk',
            'serving_size_g' => 100,
            'calories' => 285,
            'protein' => 22.5,
            'carbs' => 5.1,
            'fat' => 19.3,
        ]);

        IndonesianFood::create([
            'name' => 'Daun Singkong Rebus Padang',
            'category' => 'Sayuran',
            'serving_size_g' => 100,
            'calories' => 48,
            'protein' => 3.7,
            'carbs' => 7.5,
            'fat' => 0.6,
        ]);
    }

    public function test_scan_requires_authentication(): void
    {
        $file = UploadedFile::fake()->create('food.jpg', 120, 'image/jpeg');

        $response = $this->postJson('/nutrition/scan', [
            'image' => $file,
        ]);

        $response->assertStatus(401);
    }

    public function test_scan_validates_image_file(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/nutrition/scan', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['image']);
    }

    public function test_scan_succeeds_with_gemini_vision_and_enriches_with_database(): void
    {
        $user = User::factory()->create();
        Config::set('services.gemini.api_key', 'test-gemini-key');
        Config::set('services.gemini.model', 'gemini-3.5-flash-lite');
        Http::preventStrayRequests();

        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'dish_name' => 'Nasi Padang Rendang & Daun Singkong',
                                        'confidence' => 0.96,
                                        'items' => [
                                            [
                                                'name' => 'Nasi Putih',
                                                'portion_g' => 180,
                                                'calories' => 234,
                                                'protein' => 4.3,
                                                'carbs' => 51.5,
                                                'fat' => 0.5,
                                            ],
                                            [
                                                'name' => 'Rendang Sapi',
                                                'portion_g' => 80,
                                                'calories' => 228,
                                                'protein' => 18.0,
                                                'carbs' => 4.1,
                                                'fat' => 15.4,
                                            ],
                                            [
                                                'name' => 'Daun Singkong Rebus Padang',
                                                'portion_g' => 60,
                                                'calories' => 29,
                                                'protein' => 2.2,
                                                'carbs' => 4.5,
                                                'fat' => 0.4,
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

        $file = UploadedFile::fake()->create('padang.jpg', 120, 'image/jpeg');

        $response = $this->actingAs($user)->postJson('/nutrition/scan', [
            'image' => $file,
        ]);

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'dish_name' => 'Nasi Padang Rendang & Daun Singkong',
                    'confidence' => 0.96,
                    'total_calories' => 490.8,
                    'total_protein' => 24.5,
                    'total_carbs' => 60.1,
                    'total_fat' => 16.3,
                ],
            ]);

        $items = $response->json('data.items');
        $this->assertCount(3, $items);
        $this->assertNotNull($items[0]['food_id']);
        $this->assertNotNull($items[1]['food_id']);
        $this->assertNotNull($items[2]['food_id']);
    }

    public function test_scan_does_not_call_a_paid_fallback_when_gemini_fails(): void
    {
        $user = User::factory()->create();
        Config::set('services.gemini.api_key', 'test-gemini-key');
        Http::preventStrayRequests();

        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response(['error' => 'Rate limit'], 429),
        ]);

        $file = UploadedFile::fake()->create('padang2.jpg', 120, 'image/jpeg');

        $response = $this->actingAs($user)->postJson('/nutrition/scan', [
            'image' => $file,
        ]);

        $response->assertStatus(503)
            ->assertJson([
                'success' => false,
                'message' => 'AI Vision sedang tidak tersedia. Silakan coba lagi beberapa saat lagi.',
            ]);

        Http::assertSentCount(1);
    }

    public function test_scan_returns_error_json_when_gemini_fails(): void
    {
        $user = User::factory()->create();
        Config::set('services.gemini.api_key', 'test-gemini-key');
        Http::preventStrayRequests();

        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response('Server error', 500),
        ]);

        $file = UploadedFile::fake()->create('padang3.jpg', 120, 'image/jpeg');

        $response = $this->actingAs($user)->postJson('/nutrition/scan', [
            'image' => $file,
        ]);

        $response->assertStatus(503)
            ->assertJson([
                'success' => false,
                'message' => 'AI Vision sedang tidak tersedia. Silakan coba lagi beberapa saat lagi.',
            ]);
    }

    public function test_scan_returns_not_detected_when_gemini_is_ambiguous(): void
    {
        $user = User::factory()->create();
        Config::set('services.gemini.api_key', 'test-gemini-key');
        Http::preventStrayRequests();

        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'status' => 'not_detected',
                                        'dish_name' => null,
                                        'confidence' => 0.35,
                                        'items' => [],
                                    ]),
                                ],
                            ],
                        ],
                    ],
                ],
            ], 200),
        ]);

        $file = UploadedFile::fake()->create('ambiguous.jpg', 120, 'image/jpeg');

        $response = $this->actingAs($user)->postJson('/nutrition/scan', [
            'image' => $file,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'code' => 'not_detected',
                'message' => 'Makanan tidak terdeteksi dengan cukup yakin.',
            ]);
    }

    public function test_scan_rejects_a_food_that_is_not_in_the_database(): void
    {
        $user = User::factory()->create();
        Config::set('services.gemini.api_key', 'test-gemini-key');
        Http::preventStrayRequests();

        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'status' => 'detected',
                                        'dish_name' => 'Sate Lilit Bali',
                                        'confidence' => 0.94,
                                        'items' => [
                                            [
                                                'name' => 'Sate Lilit Bali',
                                                'portion_g' => 100,
                                                'confidence' => 0.94,
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

        $file = UploadedFile::fake()->create('unknown-food.jpg', 120, 'image/jpeg');

        $response = $this->actingAs($user)->postJson('/nutrition/scan', [
            'image' => $file,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'code' => 'not_in_database',
                'message' => 'Makanan terdeteksi tetapi belum tersedia di database: Sate Lilit Bali.',
            ]);
    }

    public function test_scan_returns_not_detected_for_an_ambiguous_database_match(): void
    {
        $user = User::factory()->create();
        Config::set('services.gemini.api_key', 'test-gemini-key');
        Http::preventStrayRequests();

        IndonesianFood::create([
            'name' => 'Ayam Pop',
            'category' => 'Lauk Pauk',
            'serving_size_g' => 100,
            'serving_unit' => 'g',
            'calories' => 215,
            'protein' => 22,
            'carbs' => 1.5,
            'fat' => 13.5,
        ]);
        IndonesianFood::create([
            'name' => 'Ayam Gulai Padang',
            'category' => 'Lauk Pauk',
            'serving_size_g' => 100,
            'serving_unit' => 'g',
            'calories' => 285,
            'protein' => 23.5,
            'carbs' => 3.2,
            'fat' => 20,
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
                                        'dish_name' => 'Ayam',
                                        'confidence' => 0.95,
                                        'items' => [
                                            [
                                                'name' => 'Ayam',
                                                'portion_g' => 100,
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

        $file = UploadedFile::fake()->create('ambiguous-name.jpg', 120, 'image/jpeg');

        $response = $this->actingAs($user)->postJson('/nutrition/scan', [
            'image' => $file,
        ]);

        $response->assertStatus(422)
            ->assertJson([
                'success' => false,
                'code' => 'not_detected',
                'message' => 'Makanan tidak terdeteksi dengan cukup yakin.',
            ]);
    }

    public function test_scan_matches_a_known_alias_without_using_ai_nutrition_values(): void
    {
        $user = User::factory()->create();
        $nasiPutih = IndonesianFood::query()->where('name', 'Nasi Putih')->firstOrFail();
        IndonesianFoodAlias::create([
            'indonesian_food_id' => $nasiPutih->id,
            'alias' => 'nasi',
            'normalized_alias' => 'nasi',
        ]);
        Config::set('services.gemini.api_key', 'test-gemini-key');
        Http::preventStrayRequests();

        Http::fake([
            'https://generativelanguage.googleapis.com/*' => Http::response([
                'candidates' => [
                    [
                        'content' => [
                            'parts' => [
                                [
                                    'text' => json_encode([
                                        'status' => 'detected',
                                        'dish_name' => 'Nasi',
                                        'confidence' => 0.9,
                                        'items' => [
                                            [
                                                'name' => 'nasi',
                                                'portion_g' => 200,
                                                'confidence' => 0.9,
                                                'calories' => 9999,
                                                'protein' => 9999,
                                                'carbs' => 9999,
                                                'fat' => 9999,
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

        $file = UploadedFile::fake()->create('rice.jpg', 120, 'image/jpeg');

        $response = $this->actingAs($user)->postJson('/nutrition/scan', [
            'image' => $file,
        ]);

        $response->assertOk()
            ->assertJsonPath('data.items.0.name', 'Nasi Putih')
            ->assertJsonPath('data.items.0.food_id', $nasiPutih->id)
            ->assertJsonPath('data.items.0.calories', 260)
            ->assertJsonPath('data.items.0.protein', 4.8);
    }
}
