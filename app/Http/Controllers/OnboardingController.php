<?php

namespace App\Http\Controllers;

use App\Models\UserProfile;
use App\Services\NutritionCalculationService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class OnboardingController extends Controller
{
    public function __construct(
        protected NutritionCalculationService $nutritionService
    ) {}

    /**
     * Display the onboarding wizard or profile configuration page.
     */
    public function show(Request $request): Response|RedirectResponse
    {
        $user = $request->user();
        $profile = $user->profile;

        return Inertia::render('Onboarding/Index', [
            'profile' => $profile,
        ]);
    }

    /**
     * Store or update user profile and calculate targets.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'age' => ['required', 'integer', 'min:12', 'max:100'],
            'gender' => ['required', 'in:male,female'],
            'height_cm' => ['required', 'numeric', 'min:80', 'max:250'],
            'weight_kg' => ['required', 'numeric', 'min:30', 'max:300'],
            'activity_level' => ['required', 'in:sedentary,lightly_active,moderately_active,very_active,extra_active'],
            'goal' => ['required', 'in:lose_weight,maintain_weight,gain_muscle,improve_fitness'],
        ]);

        $calculated = $this->nutritionService->calculateGoals(
            $validated['gender'],
            (int) $validated['age'],
            (float) $validated['height_cm'],
            (float) $validated['weight_kg'],
            $validated['activity_level'],
            $validated['goal']
        );

        UserProfile::updateOrCreate(
            ['user_id' => $request->user()->id],
            array_merge($validated, $calculated, [
                'onboarding_completed' => true,
            ])
        );

        return redirect()->route('dashboard')->with('success', 'Profil dan target nutrisi berhasil disimpan!');
    }
}
