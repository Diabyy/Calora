<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\Challenge;
use App\Models\UserChallenge;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ChallengeController extends Controller
{
    /**
     * Display all available and joined challenges.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();

        $challenges = Challenge::orderBy('starts_at', 'desc')->get()->map(function ($challenge) use ($user) {
            $userChallenge = UserChallenge::where('user_id', $user->id)
                ->where('challenge_id', $challenge->id)
                ->first();

            $isJoined = $userChallenge !== null;
            $currentProgress = 0.0;
            $isCompleted = false;

            if ($isJoined) {
                // Calculate progress from user activities within challenge window
                $query = Activity::where('user_id', $user->id)
                    ->whereBetween('started_at', [$challenge->starts_at->startOfDay(), $challenge->ends_at->endOfDay()]);

                if ($challenge->goal_type === 'distance') {
                    $distanceM = (float) $query->where('type', 'running')->sum('distance_m');
                    $currentProgress = round($distanceM / 1000, 2);
                } elseif ($challenge->goal_type === 'calories') {
                    $currentProgress = (float) $query->sum('calories_burned');
                } elseif ($challenge->goal_type === 'duration') {
                    $currentProgress = (float) $query->count();
                }

                $isCompleted = $currentProgress >= $challenge->target_value;

                $userChallenge->update([
                    'current_progress' => $currentProgress,
                    'is_completed' => $isCompleted,
                    'completed_at' => $isCompleted && ! $userChallenge->completed_at ? now() : $userChallenge->completed_at,
                ]);
            }

            $percentage = min(100, round(($currentProgress / max(0.1, $challenge->target_value)) * 100));

            return [
                'id' => $challenge->id,
                'slug' => $challenge->slug,
                'title' => $challenge->title,
                'description' => $challenge->description,
                'goal_type' => $challenge->goal_type,
                'target_value' => (float) $challenge->target_value,
                'unit' => $challenge->unit,
                'badge_icon' => $challenge->badge_icon,
                'points_reward' => $challenge->points_reward,
                'starts_at' => $challenge->starts_at->format('d M Y'),
                'ends_at' => $challenge->ends_at->format('d M Y'),
                'is_joined' => $isJoined,
                'current_progress' => $currentProgress,
                'percentage' => $percentage,
                'is_completed' => $isCompleted,
            ];
        });

        return Inertia::render('Challenges/Index', [
            'challenges' => $challenges,
        ]);
    }

    /**
     * Join a challenge.
     */
    public function join(Request $request, Challenge $challenge): RedirectResponse
    {
        $user = $request->user();

        UserChallenge::firstOrCreate([
            'user_id' => $user->id,
            'challenge_id' => $challenge->id,
        ]);

        return redirect()->back()->with('success', "Kamu berhasil bergabung di {$challenge->title}!");
    }

    /**
     * Leave a challenge.
     */
    public function leave(Request $request, Challenge $challenge): RedirectResponse
    {
        $user = $request->user();

        UserChallenge::where('user_id', $user->id)
            ->where('challenge_id', $challenge->id)
            ->delete();

        return redirect()->back()->with('success', 'Kamu keluar dari tantangan.');
    }
}
