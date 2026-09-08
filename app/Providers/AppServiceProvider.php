<?php

namespace App\Providers;

use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        RateLimiter::for('vision-scan', function (Request $request): Limit {
            return Limit::perMinute(10)->by(
                ($request->user()?->id ?? 'guest').'|'.$request->ip(),
            );
        });

        RateLimiter::for('ai-chat', function (Request $request): Limit {
            return Limit::perMinute(30)->by(
                ($request->user()?->id ?? 'guest').'|'.$request->ip(),
            );
        });
    }
}
