<?php

namespace App\Http\Controllers;

use App\Models\FoodLog;
use App\Models\FoodLogItem;
use App\Models\IndonesianFood;
use App\Services\FoodVisionAiService;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class NutritionController extends Controller
{
    public function __construct(
        protected FoodVisionAiService $visionService
    ) {}

    /**
     * Display the Nutrition tracking dashboard for a given date.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $date = $request->query('date', Carbon::today()->toDateString());

        $logs = FoodLog::where('user_id', $user->id)
            ->whereDate('date', $date)
            ->with(['items.indonesianFood'])
            ->get();

        $profile = $user->profile;

        // Calculate consumed totals for the day
        $consumed = [
            'calories' => (int) $logs->sum('total_calories'),
            'protein' => (float) round($logs->sum('total_protein'), 1),
            'carbs' => (float) round($logs->sum('total_carbs'), 1),
            'fat' => (float) round($logs->sum('total_fat'), 1),
        ];

        return Inertia::render('Nutrition/Index', [
            'date' => $date,
            'logs' => $logs,
            'consumed' => $consumed,
            'target' => [
                'calories' => $profile?->daily_calorie_target ?? 2000,
                'protein' => $profile?->protein_target_g ?? 120,
                'carbs' => $profile?->carbs_target_g ?? 250,
                'fat' => $profile?->fat_target_g ?? 65,
            ],
        ]);
    }

    /**
     * Search foods from the Indonesian Food database (TKPI).
     */
    public function search(Request $request): JsonResponse
    {
        $query = $request->query('q', '');
        $category = $request->query('category');

        $foods = IndonesianFood::query()
            ->when($query, fn ($q) => $q->where('name', 'like', "%{$query}%"))
            ->when($category, fn ($q) => $q->where('category', $category))
            ->limit(25)
            ->get();

        return response()->json($foods);
    }

    /**
     * Scan uploaded meal image using Vision AI.
     */
    public function scan(Request $request): JsonResponse
    {
        $request->validate([
            'image' => ['required', 'image', 'mimes:jpg,jpeg,png,webp', 'max:10240'],
        ]);

        try {
            $result = $this->visionService->analyzeFoodImage($request->file('image'));

            if (($result['status'] ?? 'detected') !== 'detected') {
                return response()->json([
                    'success' => false,
                    'code' => $result['status'],
                    'message' => $result['message'] ?? 'Makanan tidak terdeteksi dengan cukup yakin.',
                ], 422);
            }

            return response()->json([
                'success' => true,
                'data' => $result,
            ]);
        } catch (\Throwable $e) {
            Log::error('Food Vision scan failed', [
                'exception' => $e,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'AI Vision sedang tidak tersedia. Silakan coba lagi beberapa saat lagi.',
            ], 503);
        }
    }

    /**
     * Scan packaged food product by barcode using Open Food Facts public API.
     */
    public function scanBarcode(Request $request): JsonResponse
    {
        $barcode = trim($request->query('barcode', ''));
        if (! preg_match('/^\d{8,14}$/', $barcode)) {
            return response()->json(['success' => false, 'message' => 'Barcode harus berupa 8-14 digit.'], 422);
        }

        try {
            $res = Http::acceptJson()
                ->connectTimeout(5)
                ->timeout(10)
                ->withUserAgent('Calora - Fitness and Nutrition Web - Version 1.0')
                ->get("https://world.openfoodfacts.org/api/v2/product/{$barcode}.json");

            if ($res->successful() && (int) $res->json('status') === 1 && is_array($res->json('product'))) {
                $product = $res->json('product');
                $nutriments = $product['nutriments'] ?? [];

                $name = $product['product_name'] ?? $product['generic_name'] ?? "Produk Barcode {$barcode}";
                $brand = $product['brands'] ?? '';
                if ($brand && ! str_contains(strtolower($name), strtolower($brand))) {
                    $name = "{$brand} {$name}";
                }

                $servingSizeG = 100.0;
                if (! empty($product['serving_quantity'])) {
                    $servingSizeG = (float) $product['serving_quantity'];
                }

                $calories = (float) ($nutriments['energy-kcal_serving'] ?? $nutriments['energy-kcal_100g'] ?? 0);
                $protein = (float) ($nutriments['proteins_serving'] ?? $nutriments['proteins_100g'] ?? 0);
                $carbs = (float) ($nutriments['carbohydrates_serving'] ?? $nutriments['carbohydrates_100g'] ?? 0);
                $fat = (float) ($nutriments['fat_serving'] ?? $nutriments['fat_100g'] ?? 0);

                return response()->json([
                    'success' => true,
                    'product' => [
                        'barcode' => $barcode,
                        'name' => $name,
                        'portion_g' => $servingSizeG,
                        'calories' => round($calories),
                        'protein' => round($protein, 1),
                        'carbs' => round($carbs, 1),
                        'fat' => round($fat, 1),
                        'source' => 'Open Food Facts',
                    ],
                ]);
            }

            if ($res->successful() && (int) $res->json('status') === 0) {
                return response()->json([
                    'success' => false,
                    'message' => 'Produk dengan barcode tersebut tidak ditemukan.',
                ], 404);
            }

            Log::warning('Open Food Facts barcode lookup failed', [
                'barcode' => $barcode,
                'status' => $res->status(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Open Food Facts barcode lookup threw an exception', [
                'barcode' => $barcode,
                'exception' => $e,
            ]);
        }

        return response()->json([
            'success' => false,
            'message' => 'Layanan barcode sedang tidak tersedia. Silakan coba lagi nanti.',
        ], 503);
    }

    /**
     * Store a new or updated food log with corrected items.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'meal_type' => ['required', 'in:breakfast,lunch,dinner,snack'],
            'date' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:255'],
            'items' => ['required', 'array', 'min:1'],
            'items.*.indonesian_food_id' => ['nullable', 'exists:indonesian_foods,id'],
            'items.*.name' => ['nullable', 'string', 'max:150'],
            'items.*.portion_g' => ['required', 'numeric', 'min:1', 'max:2000'],
            'items.*.calories' => ['nullable', 'numeric', 'min:0'],
            'items.*.protein' => ['nullable', 'numeric', 'min:0'],
            'items.*.carbs' => ['nullable', 'numeric', 'min:0'],
            'items.*.fat' => ['nullable', 'numeric', 'min:0'],
            'items.*.source' => ['required', 'in:manual,database,ai_scanner'],
        ]);

        $user = $request->user();

        foreach ($validated['items'] as $index => $item) {
            if (in_array($item['source'], ['ai_scanner', 'database'], true) && empty($item['indonesian_food_id'])) {
                throw ValidationException::withMessages([
                    "items.{$index}.indonesian_food_id" => 'Item hasil scanner harus memiliki makanan database.',
                ]);
            }

            if ($item['source'] === 'manual') {
                foreach (['name', 'calories', 'protein', 'carbs', 'fat'] as $field) {
                    if (! array_key_exists($field, $item) || $item[$field] === null || $item[$field] === '') {
                        throw ValidationException::withMessages([
                            "items.{$index}.{$field}" => 'Field ini wajib untuk item manual.',
                        ]);
                    }
                }
            }
        }

        DB::transaction(function () use ($validated, $user): void {
            $foodIds = collect($validated['items'])
                ->pluck('indonesian_food_id')
                ->filter()
                ->unique()
                ->values();
            $foods = IndonesianFood::query()
                ->whereIn('id', $foodIds)
                ->get()
                ->keyBy('id');

            $log = FoodLog::firstOrCreate(
                [
                    'user_id' => $user->id,
                    'meal_type' => $validated['meal_type'],
                    'date' => $validated['date'],
                ],
                [
                    'notes' => $validated['notes'] ?? null,
                ]
            );

            foreach ($validated['items'] as $item) {
                $portionG = (float) $item['portion_g'];
                $foodId = $item['indonesian_food_id'] ?? null;
                $food = $foodId ? $foods->get($foodId) : null;

                if ($food) {
                    $factor = $portionG / max(1.0, (float) $food->serving_size_g);
                    $name = $food->name;
                    $calories = round($food->calories * $factor, 1);
                    $protein = round($food->protein * $factor, 1);
                    $carbs = round($food->carbs * $factor, 1);
                    $fat = round($food->fat * $factor, 1);
                } else {
                    if (in_array($item['source'], ['ai_scanner', 'database'], true)) {
                        throw ValidationException::withMessages([
                            'items' => 'Item hasil database tidak lagi tersedia.',
                        ]);
                    }

                    $name = $item['name'];
                    $calories = (float) $item['calories'];
                    $protein = (float) $item['protein'];
                    $carbs = (float) $item['carbs'];
                    $fat = (float) $item['fat'];
                }

                $log->items()->create([
                    'indonesian_food_id' => $food?->id,
                    'name' => $name,
                    'portion_g' => $portionG,
                    'calories' => $calories,
                    'protein' => $protein,
                    'carbs' => $carbs,
                    'fat' => $fat,
                    'source' => $item['source'],
                ]);
            }

            $log->total_calories = (int) round($log->items()->sum('calories'));
            $log->total_protein = (float) round($log->items()->sum('protein'), 1);
            $log->total_carbs = (float) round($log->items()->sum('carbs'), 1);
            $log->total_fat = (float) round($log->items()->sum('fat'), 1);
            $log->save();
        });

        return redirect()->back()->with('success', 'Makanan berhasil dicatat!');
    }

    /**
     * Delete an item from food log.
     */
    public function destroyItem(Request $request, FoodLogItem $item): RedirectResponse
    {
        $log = $item->foodLog;
        if ($log->user_id !== $request->user()->id) {
            abort(403);
        }

        $item->delete();

        if ($log->items()->count() === 0) {
            $log->delete();
        } else {
            $log->total_calories = (int) round($log->items()->sum('calories'));
            $log->total_protein = (float) round($log->items()->sum('protein'), 1);
            $log->total_carbs = (float) round($log->items()->sum('carbs'), 1);
            $log->total_fat = (float) round($log->items()->sum('fat'), 1);
            $log->save();
        }

        return redirect()->back()->with('success', 'Item makanan berhasil dihapus');
    }
}
