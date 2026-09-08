<?php

use App\Http\Controllers\ActivityController;
use App\Http\Controllers\AiAssistantController;
use App\Http\Controllers\ChallengeController;
use App\Http\Controllers\CommunityController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\NutritionController;
use App\Http\Controllers\OnboardingController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProgressController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
        'canLogin' => Route::has('login'),
        'canRegister' => Route::has('register'),
        'laravelVersion' => Application::VERSION,
        'phpVersion' => PHP_VERSION,
    ]);
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
});

Route::middleware('auth')->group(function () {
    Route::get('/onboarding', [OnboardingController::class, 'show'])->name('onboarding.show');
    Route::post('/onboarding', [OnboardingController::class, 'store'])->name('onboarding.store');

    // Nutrition & AI Scanner routes
    Route::get('/nutrition', [NutritionController::class, 'index'])->name('nutrition.index');
    Route::get('/nutrition/search', [NutritionController::class, 'search'])->name('nutrition.search');
    Route::get('/nutrition/barcode', [NutritionController::class, 'scanBarcode'])->name('nutrition.barcode');
    Route::post('/nutrition/scan', [NutritionController::class, 'scan'])
        ->middleware('throttle:vision-scan')
        ->name('nutrition.scan');
    Route::post('/nutrition/log', [NutritionController::class, 'store'])->name('nutrition.store');
    Route::delete('/nutrition/item/{item}', [NutritionController::class, 'destroyItem'])->name('nutrition.item.destroy');

    // Calora AI Assistant Chat route
    Route::post('/ai/chat', [AiAssistantController::class, 'chat'])
        ->middleware('throttle:ai-chat')
        ->name('ai.chat');

    // Activity & GPS routes
    Route::get('/activities', [ActivityController::class, 'index'])->name('activities.index');
    Route::post('/activities', [ActivityController::class, 'store'])->name('activities.store');
    Route::delete('/activities/{activity}', [ActivityController::class, 'destroy'])->name('activities.destroy');

    // Progress & Analytics routes
    Route::get('/progress', [ProgressController::class, 'index'])->name('progress.index');
    Route::post('/progress/weight', [ProgressController::class, 'storeWeight'])->name('progress.weight.store');
    Route::delete('/progress/weight/{weightLog}', [ProgressController::class, 'destroyWeight'])->name('progress.weight.destroy');

    // Challenges routes
    Route::get('/challenges', [ChallengeController::class, 'index'])->name('challenges.index');
    Route::post('/challenges/{challenge}/join', [ChallengeController::class, 'join'])->name('challenges.join');
    Route::delete('/challenges/{challenge}/leave', [ChallengeController::class, 'leave'])->name('challenges.leave');

    // Community & Social Feed routes
    Route::get('/community', [CommunityController::class, 'index'])->name('community.index');
    Route::post('/community/{activity}/like', [CommunityController::class, 'toggleLike'])->name('community.like');
    Route::post('/community/{activity}/comment', [CommunityController::class, 'comment'])->name('community.comment');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__.'/auth.php';
