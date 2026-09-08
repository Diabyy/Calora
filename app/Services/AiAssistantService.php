<?php

namespace App\Services;

use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AiAssistantService
{
    /**
     * Generate an AI response based on user context and query.
     */
    public function ask(User $user, string $userMessage, array $history = []): string
    {
        $context = $this->buildUserContext($user);

        $geminiKey = config('services.gemini.api_key') ?? env('GEMINI_API_KEY');
        if (! empty($geminiKey)) {
            try {
                return $this->callGemini($geminiKey, $context, $userMessage, $history);
            } catch (\Throwable $e) {
                Log::warning('Gemini API error, falling back to local assistant: '.$e->getMessage());
            }
        }

        return $this->fallbackAssistantResponse($context, $userMessage);
    }

    /**
     * Build rich biometric and daily energy context for the user.
     */
    protected function buildUserContext(User $user): array
    {
        $profile = $user->profile;
        $today = Carbon::today()->toDateString();

        $consumedCalories = (int) $user->foodLogs()->whereDate('date', $today)->sum('total_calories');
        $consumedProtein = (float) round($user->foodLogs()->whereDate('date', $today)->sum('total_protein'), 1);
        $burnedCalories = (int) $user->activities()->whereDate('started_at', $today)->sum('calories_burned');
        $latestActivity = $user->activities()->latest('started_at')->first();

        return [
            'name' => $user->name,
            'goal' => $profile?->goal ?? 'maintain_weight',
            'weight_kg' => $profile?->weight_kg ?? 65,
            'daily_calorie_target' => $profile?->daily_calorie_target ?? 2000,
            'protein_target_g' => $profile?->protein_target_g ?? 120,
            'consumed_calories_today' => $consumedCalories,
            'consumed_protein_today' => $consumedProtein,
            'burned_calories_today' => $burnedCalories,
            'remaining_calories_today' => max(0, ($profile?->daily_calorie_target ?? 2000) + $burnedCalories - $consumedCalories),
            'latest_activity' => $latestActivity ? "{$latestActivity->name} ({$latestActivity->calories_burned} kcal)" : 'Belum ada aktivitas hari ini',
        ];
    }

    /**
     * Call Google Gemini API.
     */
    protected function callGemini(string $apiKey, array $context, string $userMessage, array $history): string
    {
        $systemPrompt = $this->buildSystemPrompt($context);

        $contents = [
            ['role' => 'user', 'parts' => [['text' => "System Instructions: {$systemPrompt}"]]],
            ['role' => 'model', 'parts' => [['text' => 'Mengerti! Saya Calora AI siap membantu analisa nutrisi dan aktivitas fisik Anda.']]],
        ];

        foreach (array_slice($history, -4) as $msg) {
            $contents[] = [
                'role' => $msg['sender'] === 'user' ? 'user' : 'model',
                'parts' => [['text' => $msg['text']]],
            ];
        }

        $contents[] = [
            'role' => 'user',
            'parts' => [['text' => $userMessage]],
        ];

        $res = Http::withHeaders([
            'x-goog-api-key' => $apiKey,
        ])
            ->timeout(20)
            ->post('https://generativelanguage.googleapis.com/v1beta/models/'.config('services.gemini.model').':generateContent', [
                'contents' => $contents,
                'generationConfig' => [
                    'temperature' => 0.4,
                    'maxOutputTokens' => 600,
                ],
            ]);

        if ($res->successful()) {
            return $res->json('candidates.0.content.parts.0.text') ?? 'Maaf, gagal memproses jawaban.';
        }

        throw new \Exception('Gemini HTTP '.$res->status());
    }

    /**
     * System prompt injecting Calora branding and user biometrics.
     */
    protected function buildSystemPrompt(array $context): string
    {
        return <<<PROMPT
Anda adalah Calora AI — asisten ahli gizi olahraga dan pelatih kebugaran pribadi di aplikasi Calora.
Tagline: "Move. Track. Eat Better."
Bahasa: Bahasa Indonesia ramah, profesional, ringkas, dan memotivasi.

Profil Pengguna:
- Nama: {$context['name']}
- Target Kebugaran: {$context['goal']}
- Berat Badan: {$context['weight_kg']} kg
- Target Kalori Harian: {$context['daily_calorie_target']} kcal
- Target Protein Harian: {$context['protein_target_g']} g
- Kalori Masuk Hari Ini: {$context['consumed_calories_today']} kcal
- Kalori Terbakar Hari Ini: {$context['burned_calories_today']} kcal
- Sisa Budget Kalori Hari Ini: {$context['remaining_calories_today']} kcal
- Protein Masuk Hari Ini: {$context['consumed_protein_today']} g
- Latihan Terakhir: {$context['latest_activity']}

Aturan Jawaban:
1. Hubungkan selalu saran makanan dengan kuliner lokal Indonesia yang praktis (cth: Ayam bakar, Dada ayam rebus, Telur rebus, Soto bening, Tempe bacem, Sayur asem).
2. Jawaban harus langsung to-the-point (maksimal 2-3 paragraf ringkas).
3. Berikan estimasi kalori dan gram protein untuk setiap makanan yang Anda sarankan.
PROMPT;
    }

    /**
     * Intelligent local fallback when offline or API keys are not supplied.
     */
    protected function fallbackAssistantResponse(array $context, string $query): string
    {
        $q = strtolower($query);

        if (str_contains($q, 'makan') || str_contains($q, 'habis lari') || str_contains($q, 'menu')) {
            $rem = $context['remaining_calories_today'];

            return "Berdasarkan data hari ini, kamu sudah membakar {$context['burned_calories_today']} kcal dan masih memiliki sisa budget {$rem} kcal.\n\n".
                "Pilihan menu lokal terbaik untuk pemulihan:\n".
                "1. **Dada Ayam Bakar / Kukus (100g)** + Nasi Merah (120g) + Sayur Bening Bayam (~360 kcal, 32g protein).\n".
                "2. **Soto Ayam Bening (1 mangkok)** + 1 Butir Telur Rebus (~290 kcal, 24g protein).\n".
                '3. **Air Kelapa Muda Murni** untuk mengganti elektrolit yang hilang saat olahraga!';
        }

        if (str_contains($q, 'protein') || str_contains($q, 'kurang')) {
            $diff = max(0, $context['protein_target_g'] - $context['consumed_protein_today']);

            return "Asupan proteinmu hari ini {$context['consumed_protein_today']}g dari target {$context['protein_target_g']}g (kurang sekitar {$diff}g).\n\n".
                "Untuk menutup kekurangan tanpa menambah lemak berlebih, kamu bisa menambahkan:\n".
                "- 2 butir telur rebus (+12g protein, 150 kcal)\n".
                "- 100g tempe bacem atau kukus (+14g protein)\n".
                '- Dada ayam tanpa kulit (+31g protein per 100g).';
        }

        if (str_contains($q, 'kalori') || str_contains($q, 'sisa') || str_contains($q, 'target')) {
            return "Status energi harianmu:\n".
                "- Makanan Masuk: {$context['consumed_calories_today']} kcal\n".
                "- Olahraga Keluar: {$context['burned_calories_today']} kcal\n".
                "- Sisa Budget Kalori: {$context['remaining_calories_today']} kcal dari target {$context['daily_calorie_target']} kcal.\n\n".
                'Tubuhmu masih memiliki ruang kalori yang sehat untuk makan malam berprotein tinggi!';
        }

        return "Halo {$context['name']}! Saya Calora AI. Hari ini kamu sudah mencatat {$context['burned_calories_today']} kcal terbakar dan konsumsi {$context['consumed_calories_today']} kcal. Kamu bisa menanyakan saran menu makan pasca olahraga, analisis makronutrien, atau cara mencapai target {$context['goal']}!";
    }
}
