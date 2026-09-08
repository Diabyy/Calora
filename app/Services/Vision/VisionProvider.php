<?php

namespace App\Services\Vision;

interface VisionProvider
{
    /**
     * @param  array{base64: string, mime_type: string}  $image
     * @return array<string, mixed>
     */
    public function analyze(array $image, string $prompt): array;

    public function isConfigured(): bool;

    public function name(): string;
}
