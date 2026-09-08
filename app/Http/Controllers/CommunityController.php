<?php

namespace App\Http\Controllers;

use App\Models\Activity;
use App\Models\ActivityComment;
use App\Models\ActivityLike;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CommunityController extends Controller
{
    /**
     * Display Social Feed & Community Leaderboard.
     */
    public function index(Request $request): Response
    {
        $currentUser = $request->user();

        // 1. Activity Feed with author, likes and comments
        $activities = Activity::with(['user', 'likes', 'comments.user'])
            ->orderBy('started_at', 'desc')
            ->limit(20)
            ->get()
            ->map(function ($act) use ($currentUser) {
                return [
                    'id' => $act->id,
                    'type' => $act->type,
                    'name' => $act->name,
                    'source' => $act->source,
                    'distance_m' => (float) $act->distance_m,
                    'duration_seconds' => $act->duration_seconds,
                    'calories_burned' => $act->calories_burned,
                    'avg_pace_seconds_per_km' => $act->avg_pace_seconds_per_km,
                    'started_at' => $act->started_at->diffForHumans(),
                    'user' => [
                        'id' => $act->user->id,
                        'name' => $act->user->name,
                    ],
                    'likes_count' => $act->likes->count(),
                    'has_liked' => $act->likes->contains('user_id', $currentUser->id),
                    'comments' => $act->comments->map(fn ($c) => [
                        'id' => $c->id,
                        'comment' => $c->comment,
                        'user_name' => $c->user->name,
                        'created_at' => $c->created_at->diffForHumans(),
                    ]),
                ];
            });

        // 2. Weekly Leaderboard (Distance & Calories)
        $startOfWeek = Carbon::now()->startOfWeek();
        $endOfWeek = Carbon::now()->endOfWeek();

        $leaderboard = User::with(['activities' => function ($q) use ($startOfWeek, $endOfWeek) {
            $q->whereBetween('started_at', [$startOfWeek, $endOfWeek]);
        }])
            ->get()
            ->map(function ($u) {
                $totalDist = (float) $u->activities->sum('distance_m');
                $totalCals = (int) $u->activities->sum('calories_burned');

                return [
                    'id' => $u->id,
                    'name' => $u->name,
                    'distance_km' => round($totalDist / 1000, 2),
                    'calories' => $totalCals,
                    'sessions' => $u->activities->count(),
                ];
            })
            ->sortByDesc('distance_km')
            ->values()
            ->take(10);

        return Inertia::render('Community/Index', [
            'activities' => $activities,
            'leaderboard' => $leaderboard,
        ]);
    }

    /**
     * Toggle Kudos / Like on an activity.
     */
    public function toggleLike(Request $request, Activity $activity): RedirectResponse
    {
        $user = $request->user();

        $existing = ActivityLike::where('user_id', $user->id)
            ->where('activity_id', $activity->id)
            ->first();

        if ($existing) {
            $existing->delete();
        } else {
            ActivityLike::create([
                'user_id' => $user->id,
                'activity_id' => $activity->id,
            ]);
        }

        return redirect()->back();
    }

    /**
     * Post a comment on an activity.
     */
    public function comment(Request $request, Activity $activity): RedirectResponse
    {
        $validated = $request->validate([
            'comment' => ['required', 'string', 'max:500'],
        ]);

        ActivityComment::create([
            'user_id' => $request->user()->id,
            'activity_id' => $activity->id,
            'comment' => $validated['comment'],
        ]);

        return redirect()->back()->with('success', 'Komentar berhasil dikirim!');
    }
}
