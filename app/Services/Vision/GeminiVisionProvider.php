<?php

namespace App\Services\Vision;

use Illuminate\Support\Facades\Http;

final class GeminiVisionProvider implements VisionProvider
{
    public function __construct(private readonly VisionResponseParser $parser) {}

    public function analyze(array $image, string $prompt): array
    {
        $apiKey = (string) config('services.gemini.api_key', '');
        if ($apiKey === '') {
            throw new VisionProviderException($this->name(), 'api_key_missing');
        }

        $model = (string) config('services.gemini.vision_model');
        $response = Http::acceptJson()
            ->withHeaders(['x-goog-api-key' => $apiKey])
            ->connectTimeout(5)
            ->timeout(30)
            ->post("https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent", [
                'contents' => [
                    [
                        'parts' => [
                            ['text' => $prompt],
                            [
                                'inline_data' => [
                                    'mime_type' => $image['mime_type'],
                                    'data' => $image['base64'],
                                ],
                            ],
                        ],
                    ],
                ],
                'generationConfig' => [
                    'responseMimeType' => 'application/json',
                    'temperature' => 0.2,
                ],
            ]);

        if (! $response->successful()) {
            throw new VisionProviderException($this->name(), 'http_error', $response->status());
        }

        $payload = $response->json();
        if (! is_array($payload)) {
            throw new VisionProviderException($this->name(), 'invalid_response_payload');
        }

        return $this->parser->parseJson(
            $this->parser->extractGeminiText($payload),
            $this->name(),
        );
    }

    public function isConfigured(): bool
    {
        return (string) config('services.gemini.api_key', '') !== '';
    }

    public function name(): string
    {
        return 'gemini';
    }
}
