<?php

namespace App\Http\Controllers;

use App\Services\AiAssistantService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiAssistantController extends Controller
{
    public function __construct(
        protected AiAssistantService $aiService
    ) {}

    /**
     * Send user message and get AI answer.
     */
    public function chat(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'message' => ['required', 'string', 'max:1000'],
            'history' => ['nullable', 'array'],
        ]);

        $reply = $this->aiService->ask(
            $request->user(),
            $validated['message'],
            $validated['history'] ?? []
        );

        return response()->json([
            'reply' => $reply,
        ]);
    }
}
