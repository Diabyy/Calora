<?php

namespace App\Http\Controllers;

use App\Models\Achievement;
use App\Models\WeightLog;
use App\Services\AnalyticsService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ProgressController extends Controller
{
    public function __construct(
        protected AnalyticsService $analyticsService
    ) {}

    /**
     * Display the analytics and progress tracking page.
     */
    public function index(Request $request): Response
    {
        $user = $request->user();
        $analytics = $this->analyticsService->getProgressAnalytics($user);

        // All achievements with unlock status
        $allAchievements = Achievement::all()->map(function ($ach) use ($user) {
            $unlocked = $user->userAchievements->where('achievement_id', $ach->id)->first();

            return [
                'id' => $ach->id,
                'slug' => $ach->slug,
                'title' => $ach->title,
                'description' => $ach->description,
                'icon' => $ach->icon,
                'category' => $ach->category,
                'points' => $ach->points,
                'is_unlocked' => $unlocked !== null,
                'unlocked_at' => $unlocked?->unlocked_at?->format('d M Y'),
            ];
        });

        return Inertia::render('Progress/Index', [
            'profile' => $user->profile,
            'analytics' => $analytics,
            'achievements' => $allAchievements,
        ]);
    }

    /**
     * Store new weight entry.
     */
    public function storeWeight(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'weight_kg' => ['required', 'numeric', 'min:30', 'max:300'],
            'recorded_at' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:255'],
        ]);

        $user = $request->user();

        WeightLog::updateOrCreate(
            [
                'user_id' => $user->id,
                'recorded_at' => $validated['recorded_at'],
            ],
            [
                'weight_kg' => $validated['weight_kg'],
                'notes' => $validated['notes'] ?? null,
            ]
        );

        // Update current weight in user profile
        if ($user->profile) {
            $user->profile->update(['weight_kg' => $validated['weight_kg']]);
        }

        return redirect()->back()->with('success', 'Catatan berat badan berhasil disimpan!');
    }

    /**
     * Delete weight entry.
     */
    public function destroyWeight(Request $request, WeightLog $weightLog): RedirectResponse
    {
        if ($weightLog->user_id !== $request->user()->id) {
            abort(403);
        }

        $weightLog->delete();

        return redirect()->back()->with('success', 'Catatan berat badan dihapus.');
    }
}
