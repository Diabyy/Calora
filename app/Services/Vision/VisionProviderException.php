<?php

namespace App\Services\Vision;

use RuntimeException;

final class VisionProviderException extends RuntimeException
{
    public function __construct(
        public readonly string $provider,
        public readonly string $reason,
        public readonly ?int $statusCode = null,
    ) {
        $message = $provider.' '.$reason;

        if ($statusCode !== null) {
            $message .= ' (HTTP '.$statusCode.')';
        }

        parent::__construct($message);
    }
}
