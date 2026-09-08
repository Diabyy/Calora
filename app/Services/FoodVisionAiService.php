<?php

namespace App\Services;

use App\Models\IndonesianFood;
use App\Models\IndonesianFoodAlias;
use App\Services\Vision\GeminiVisionProvider;
use App\Services\Vision\VisionProvider;
use App\Services\Vision\VisionProviderException;
use Illuminate\Database\Eloquent\Collection as EloquentCollection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class FoodVisionAiService
{
    public function __construct(
        private readonly GeminiVisionProvider $geminiProvider,
    ) {}

    /**
     * Analyze an image, then calculate nutrition from the local food database.
     *
     * @return array{
     *     status: 'detected'|'not_detected'|'not_in_database',
     *     message?: string,
     *     dish_name: string|null,
     *     confidence: float,
     *     items: array<int, array{
     *         food_id: int,
     *         name: string,
     *         portion_g: float,
     *         confidence: float,
     *         calories: float,
     *         protein: float,
     *         carbs: float,
     *         fat: float
     *     }>,
     *     total_calories: float,
     *     total_protein: float,
     *     total_carbs: float,
     *     total_fat: float
     * }
     */
    public function analyzeFoodImage(UploadedFile $image): array
    {
        $imageData = $this->prepareImage($image);

        /** @var EloquentCollection<int, IndonesianFood> $foods */
        $foods = IndonesianFood::query()
            ->with('aliases')
            ->orderBy('name')
            ->get();
        $prompt = $this->buildVisionPrompt($foods);
        $providers = [
            'gemini' => $this->geminiProvider,
        ];
        $lastNonDetection = null;
        $hasConfiguredProvider = false;

        foreach (['gemini'] as $providerName) {
            $providerName = trim((string) $providerName);
            $provider = $providers[$providerName] ?? null;

            if (! $provider instanceof VisionProvider || ! $provider->isConfigured()) {
                continue;
            }

            $hasConfiguredProvider = true;

            try {
                $providerResponse = $provider->analyze($imageData, $prompt);
                $normalizedResponse = $this->normalizeProviderResponse(
                    $providerResponse,
                    $provider->name(),
                );

                if ($normalizedResponse['status'] === 'not_detected') {
                    $lastNonDetection = $this->preferNonDetection(
                        $lastNonDetection,
                        $this->notDetectedResult('Makanan tidak terdeteksi dengan cukup yakin.'),
                    );

                    continue;
                }

                $result = $this->enrichWithDatabaseMatches($normalizedResponse, $foods);
                if ($result['status'] === 'detected') {
                    return $result;
                }

                $lastNonDetection = $this->preferNonDetection($lastNonDetection, $result);
            } catch (VisionProviderException $exception) {
                Log::warning('Food vision provider failed', [
                    'provider' => $exception->provider,
                    'reason' => $exception->reason,
                    'status' => $exception->statusCode,
                ]);
            } catch (\Throwable $exception) {
                Log::warning('Food vision provider failed unexpectedly', [
                    'provider' => $provider->name(),
                    'exception' => $exception,
                ]);
            }
        }

        if ($lastNonDetection !== null) {
            return $lastNonDetection;
        }

        if (! $hasConfiguredProvider) {
            throw new RuntimeException('AI Vision belum dikonfigurasi.');
        }

        throw new RuntimeException('AI Vision gagal menganalisis gambar.');
    }

    /**
     * @return array{base64: string, mime_type: string}
     */
    private function prepareImage(UploadedFile $image): array
    {
        $contents = file_get_contents($image->getRealPath());
        if ($contents === false) {
            throw new RuntimeException('Food image could not be read.');
        }

        return [
            'base64' => base64_encode($contents),
            'mime_type' => $image->getMimeType() ?: 'image/jpeg',
        ];
    }

    /**
     * @param  EloquentCollection<int, IndonesianFood>  $foods
     */
    private function buildVisionPrompt(EloquentCollection $foods): string
    {
        $canonicalFoodNames = $foods
            ->map(function (IndonesianFood $food): string {
                $aliases = $food->aliases->pluck('alias')->implode(', ');

                return $aliases === '' ? $food->name : $food->name.' (aliases: '.$aliases.')';
            })
            ->implode(', ');

        return <<<PROMPT
You are Calora AI, an expert Indonesian food recognition assistant.
Analyze the meal photo and identify each clearly visible food component.

Use only a specific name from this canonical database list when there is a clear match:
{$canonicalFoodNames}

If the food is unclear, multiple foods are equally likely, confidence is below the threshold, or no canonical name matches, return status "not_detected" with an empty items array. Never invent a local food name.

For each detected item return its canonical or database alias name, estimated visible portion in grams, and identity confidence from 0 to 1. Do not estimate calories or macronutrients.

Return only a JSON object with this shape:
{
  "status": "detected",
  "dish_name": "string or null",
  "confidence": 0.95,
  "items": [
    {
      "name": "Nasi Putih",
      "portion_g": 180,
      "confidence": 0.95
    }
  ]
}

For an uncertain photo return:
{"status":"not_detected","dish_name":null,"confidence":0,"items":[]}
PROMPT;
    }

    /**
     * @param  array<string, mixed>  $response
     * @return array{status: 'detected'|'not_detected', dish_name: string|null, confidence: float, items: array<int, array{name: string, portion_g: float, confidence: float}>}
     */
    private function normalizeProviderResponse(array $response, string $provider): array
    {
        $status = strtolower(trim((string) ($response['status'] ?? '')));
        if ($status === '' && array_key_exists('items', $response)) {
            $status = 'detected';
        }
        if ($status === 'success') {
            $status = 'detected';
        }

        if (! in_array($status, ['detected', 'not_detected'], true)) {
            throw new VisionProviderException($provider, 'invalid_status');
        }

        if ($status === 'not_detected') {
            return [
                'status' => 'not_detected',
                'dish_name' => null,
                'confidence' => 0.0,
                'items' => [],
            ];
        }

        $confidence = $this->normalizeConfidence($response['confidence'] ?? 0);
        $minimumConfidence = (float) config('services.vision_min_confidence', 0.75);
        $items = $response['items'] ?? null;

        if (! is_array($items) || $items === []) {
            throw new VisionProviderException($provider, 'invalid_items');
        }

        if ($confidence < $minimumConfidence) {
            return [
                'status' => 'not_detected',
                'dish_name' => null,
                'confidence' => 0.0,
                'items' => [],
            ];
        }

        $normalizedItems = [];
        foreach ($items as $item) {
            if (! is_array($item)) {
                throw new VisionProviderException($provider, 'invalid_item');
            }

            $name = trim((string) ($item['name'] ?? ''));
            $portionG = $item['portion_g'] ?? null;
            if ($name === '' || ! is_numeric($portionG)) {
                throw new VisionProviderException($provider, 'invalid_item');
            }

            $portionG = (float) $portionG;
            if (! is_finite($portionG) || $portionG <= 0 || $portionG > 2000) {
                throw new VisionProviderException($provider, 'invalid_portion');
            }

            $itemConfidence = $this->normalizeConfidence($item['confidence'] ?? $confidence);
            if ($itemConfidence < $minimumConfidence) {
                return [
                    'status' => 'not_detected',
                    'dish_name' => null,
                    'confidence' => 0.0,
                    'items' => [],
                ];
            }

            $normalizedItems[] = [
                'name' => $name,
                'portion_g' => $portionG,
                'confidence' => $itemConfidence,
            ];
        }

        $dishName = $response['dish_name'] ?? null;

        return [
            'status' => 'detected',
            'dish_name' => is_string($dishName) && trim($dishName) !== '' ? trim($dishName) : null,
            'confidence' => $confidence,
            'items' => $normalizedItems,
        ];
    }

    /**
     * @param  array<string, mixed>|null  $current
     * @param  array<string, mixed>  $candidate
     * @return array<string, mixed>
     */
    private function preferNonDetection(?array $current, array $candidate): array
    {
        if ($current === null || $candidate['status'] === 'not_in_database') {
            return $candidate;
        }

        return $current;
    }

    /**
     * @param  array<string, mixed>  $data
     * @param  EloquentCollection<int, IndonesianFood>  $foods
     * @return array<string, mixed>
     */
    private function enrichWithDatabaseMatches(array $data, EloquentCollection $foods): array
    {
        $totalCalories = 0.0;
        $totalProtein = 0.0;
        $totalCarbs = 0.0;
        $totalFat = 0.0;
        $enrichedItems = [];

        foreach ($data['items'] as $item) {
            $name = $item['name'];
            $dbFood = $this->findMatchingFood($name, $foods);

            if (! $dbFood) {
                if ($this->hasAmbiguousFoodMatch($name, $foods)) {
                    return $this->notDetectedResult('Makanan tidak terdeteksi dengan cukup yakin.');
                }

                return $this->notInDatabaseResult($name);
            }

            $portionG = (float) $item['portion_g'];
            $factor = $portionG / max(1.0, (float) $dbFood->serving_size_g);
            $calories = (float) round($dbFood->calories * $factor, 1);
            $protein = (float) round($dbFood->protein * $factor, 1);
            $carbs = (float) round($dbFood->carbs * $factor, 1);
            $fat = (float) round($dbFood->fat * $factor, 1);

            $totalCalories += $calories;
            $totalProtein += $protein;
            $totalCarbs += $carbs;
            $totalFat += $fat;
            $enrichedItems[] = [
                'food_id' => $dbFood->id,
                'name' => $dbFood->name,
                'portion_g' => $portionG,
                'confidence' => (float) $item['confidence'],
                'calories' => $calories,
                'protein' => $protein,
                'carbs' => $carbs,
                'fat' => $fat,
            ];
        }

        return [
            'status' => 'detected',
            'dish_name' => $data['dish_name'],
            'confidence' => $data['confidence'],
            'items' => $enrichedItems,
            'total_calories' => round($totalCalories, 1),
            'total_protein' => round($totalProtein, 1),
            'total_carbs' => round($totalCarbs, 1),
            'total_fat' => round($totalFat, 1),
        ];
    }

    /**
     * @param  EloquentCollection<int, IndonesianFood>  $foods
     */
    private function findMatchingFood(string $name, EloquentCollection $foods): ?IndonesianFood
    {
        $normalizedName = $this->normalizeFoodName($name);
        if ($normalizedName === '') {
            return null;
        }

        $exactMatches = $foods->filter(function (IndonesianFood $food) use ($normalizedName): bool {
            return $this->isExactFoodMatch($food, $normalizedName);
        });
        if ($exactMatches->count() === 1) {
            return $exactMatches->first();
        }
        if ($exactMatches->count() > 1) {
            return null;
        }

        $partialMatches = $foods->filter(function (IndonesianFood $food) use ($normalizedName): bool {
            $normalizedFood = $this->normalizeFoodName($food->name);

            return str_contains($normalizedFood, $normalizedName)
                || str_contains($normalizedName, $normalizedFood);
        });

        return $partialMatches->count() === 1 ? $partialMatches->first() : null;
    }

    /**
     * @param  EloquentCollection<int, IndonesianFood>  $foods
     */
    private function hasAmbiguousFoodMatch(string $name, EloquentCollection $foods): bool
    {
        $normalizedName = $this->normalizeFoodName($name);
        if ($normalizedName === '') {
            return false;
        }

        $exactMatches = $foods->filter(function (IndonesianFood $food) use ($normalizedName): bool {
            return $this->isExactFoodMatch($food, $normalizedName);
        });
        if ($exactMatches->count() > 1) {
            return true;
        }

        $partialMatches = $foods->filter(function (IndonesianFood $food) use ($normalizedName): bool {
            $normalizedFood = $this->normalizeFoodName($food->name);

            return str_contains($normalizedFood, $normalizedName)
                || str_contains($normalizedName, $normalizedFood);
        });

        return $partialMatches->count() > 1;
    }

    private function isExactFoodMatch(IndonesianFood $food, string $normalizedName): bool
    {
        if ($this->normalizeFoodName($food->name) === $normalizedName) {
            return true;
        }

        return $food->relationLoaded('aliases')
            && $food->aliases->contains(function (IndonesianFoodAlias $alias) use ($normalizedName): bool {
                return $alias->normalized_alias === $normalizedName;
            });
    }

    private function normalizeFoodName(string $name): string
    {
        $normalized = mb_strtolower($name);
        $normalized = preg_replace('/[^a-z0-9]+/', ' ', $normalized) ?? '';

        return trim($normalized);
    }

    private function normalizeConfidence(mixed $value): float
    {
        $confidence = is_numeric($value) ? (float) $value : 0.0;
        if (! is_finite($confidence)) {
            return 0.0;
        }
        if ($confidence > 1 && $confidence <= 100) {
            $confidence /= 100;
        }

        return min(1, max(0, $confidence));
    }

    /**
     * @return array<string, mixed>
     */
    private function notDetectedResult(string $message): array
    {
        return [
            'status' => 'not_detected',
            'message' => $message,
            'dish_name' => null,
            'confidence' => 0.0,
            'items' => [],
            'total_calories' => 0.0,
            'total_protein' => 0.0,
            'total_carbs' => 0.0,
            'total_fat' => 0.0,
        ];
    }

    /**
     * @return array<string, mixed>
     */
    private function notInDatabaseResult(string $name): array
    {
        return [
            'status' => 'not_in_database',
            'message' => "Makanan terdeteksi tetapi belum tersedia di database: {$name}.",
            'dish_name' => null,
            'confidence' => 0.0,
            'items' => [],
            'total_calories' => 0.0,
            'total_protein' => 0.0,
            'total_carbs' => 0.0,
            'total_fat' => 0.0,
        ];
    }
}
