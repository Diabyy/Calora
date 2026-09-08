<?php

namespace App\Services\Vision;

use JsonException;

final class VisionResponseParser
{
    /**
     * @param  array<string, mixed>  $response
     */
    public function extractGeminiText(array $response): string
    {
        foreach ($response['candidates'] ?? [] as $candidate) {
            if (! is_array($candidate)) {
                continue;
            }

            $parts = $candidate['content']['parts'] ?? [];
            if (! is_array($parts)) {
                continue;
            }

            foreach ($parts as $part) {
                if (! is_array($part)) {
                    continue;
                }

                if (is_string($part['text'] ?? null) && trim($part['text']) !== '') {
                    return $part['text'];
                }
            }
        }

        throw new VisionProviderException('gemini', 'response_missing_text');
    }

    /**
     * @return array<string, mixed>
     */
    public function parseJson(string $rawText, string $provider): array
    {
        $text = trim($rawText);
        $candidates = [$text];

        if (preg_match('/```(?:json)?\s*(.*?)\s*```/is', $text, $matches) === 1) {
            $candidates[] = trim($matches[1]);
        }

        $balancedObject = $this->extractBalancedObject($text);
        if ($balancedObject !== null) {
            $candidates[] = $balancedObject;
        }

        foreach (array_unique($candidates) as $candidate) {
            try {
                $parsed = json_decode($candidate, true, 512, JSON_THROW_ON_ERROR);
            } catch (JsonException) {
                continue;
            }

            if (is_array($parsed)) {
                return $parsed;
            }
        }

        throw new VisionProviderException($provider, 'invalid_json_response');
    }

    private function extractBalancedObject(string $text): ?string
    {
        $start = strpos($text, '{');
        if ($start === false) {
            return null;
        }

        $depth = 0;
        $inString = false;
        $escaped = false;
        $length = strlen($text);

        for ($index = $start; $index < $length; $index++) {
            $character = $text[$index];

            if ($inString) {
                if ($escaped) {
                    $escaped = false;
                } elseif ($character === '\\') {
                    $escaped = true;
                } elseif ($character === '"') {
                    $inString = false;
                }

                continue;
            }

            if ($character === '"') {
                $inString = true;
            } elseif ($character === '{') {
                $depth++;
            } elseif ($character === '}') {
                $depth--;

                if ($depth === 0) {
                    return substr($text, $start, $index - $start + 1);
                }
            }
        }

        return null;
    }
}
