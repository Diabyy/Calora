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

        $contents = [];

        foreach (array_slice($history, -6) as $msg) {
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
                'system_instruction' => [
                    'parts' => [['text' => $systemPrompt]],
                ],
                'contents' => $contents,
                'generationConfig' => [
                    'temperature' => 0.7,
                    'maxOutputTokens' => 800,
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
Kamu adalah Calora AI — asisten nutrisi dan pelatih kebugaran pribadi yang cerdas, ramah, dan solutif di aplikasi Calora.
Bicaralah dengan gaya bahasa Indonesia yang luwes, santai, hangat, dan mengalir natural layaknya coach / personal trainer profesional.

Pedoman Gaya Jawaban:
- Jawab secara langsung, relevan, dan mengalir seperti percakapan nyata (seperti ChatGPT / Claude).
- HINDARI bahasa kaku atau robotik. JANGAN pernah menyematkan template penutup formal, slogan ("Move. Track. Eat Better."), atau format promosi berulang di akhir chat.
- Berikan saran makanan lokal Indonesia yang mudah ditemui (misal: telur rebus, dada ayam, tempe, tahu, soto, pecel, sayur bening bayam, dll) beserta perkiraan kalori dan protein jika topiknya seputar makanan.
- Manfaatkan data fisik dan energi pengguna di bawah ini sebagai konteks personal, namun jangan mendiktekan semua angka tersebut jika tidak relevan dengan pertanyaan pengguna.

Konteks Pengguna ({$context['name']}):
- Target: {$context['goal']} | Berat: {$context['weight_kg']} kg
- Target Kalori Harian: {$context['daily_calorie_target']} kcal | Target Protein: {$context['protein_target_g']} g
- Hari Ini: Makanan Masuk {$context['consumed_calories_today']} kcal, Protein {$context['consumed_protein_today']}g, Olahraga Terbakar {$context['burned_calories_today']} kcal, Sisa Kalori {$context['remaining_calories_today']} kcal.
- Aktivitas Terakhir: {$context['latest_activity']}
PROMPT;
    }

    /**
     * Intelligent local fallback when offline or API keys are not supplied.
     */
    protected function fallbackAssistantResponse(array $context, string $query): string
    {
        $q = strtolower($query);

        if (str_contains($q, 'makan') || str_contains($q, 'habis lari') || str_contains($q, 'menu') || str_contains($q, 'pagi') || str_contains($q, 'siang') || str_contains($q, 'malam')) {
            $rem = $context['remaining_calories_today'];

            return "Berdasarkan aktivitasmu hari ini, kamu masih punya sisa budget sekitar {$rem} kcal.\n\n".
                "Ini beberapa opsi menu lokal bergizi yang ramah pemulihan:\n".
                "1. **Dada Ayam Panggang / Kukus (100g)** + Nasi Merah + Sayur Bening Bayam (~360 kcal, 32g protein).\n".
                "2. **Soto Ayam Bening** + 1 butir telur rebus (~290 kcal, 24g protein).\n".
                "3. **Pepes Tahu / Tempe** + Tumis Kangkung (~180 kcal, 14g protein).\n\n".
                'Lagi pengen menu yang berkuah hangat atau yang praktis keringan?';
        }

        if (str_contains($q, 'protein') || str_contains($q, 'kurang')) {
            $diff = max(0, $context['protein_target_g'] - $context['consumed_protein_today']);

            return "Asupan proteinmu saat ini {$context['consumed_protein_today']}g dari target {$context['protein_target_g']}g (masih perlu sekitar {$diff}g lagi).\n\n".
                "Pilihan cemilan atau lauk padat protein yang gampang:\n".
                "- 2 butir telur rebus (+12g protein)\n".
                "- 1 papan tempe bacem / kukus (+14g protein)\n".
                '- Susu kedelai murni / greek yogurt (~10-15g protein).';
        }

        if (str_contains($q, 'kalori') || str_contains($q, 'sisa') || str_contains($q, 'target')) {
            return "Status energi harianmu:\n".
                "- Makanan masuk: {$context['consumed_calories_today']} kcal\n".
                "- Olahraga terbakar: {$context['burned_calories_today']} kcal\n".
                "- Sisa budget kalori: {$context['remaining_calories_today']} kcal dari target harian {$context['daily_calorie_target']} kcal.\n\n".
                'Masih aman banget buat makan dengan porsi seimbang!';
        }

        return "Halo {$context['name']}! Ada yang bisa aku bantu seputar nutrisi, menu makan sehat, atau evaluasi latihan fisikmu hari ini?";
    }
}
