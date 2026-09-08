// PWA registration and install prompt manager for Calora

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const installListeners = new Set<(canInstall: boolean) => void>();
const onlineListeners = new Set<(isOnline: boolean) => void>();

export function registerServiceWorker(): void {
    if (typeof window === 'undefined') return;

    // Listen to online / offline status
    window.addEventListener('online', () => {
        onlineListeners.forEach((cb) => cb(true));
    });

    window.addEventListener('offline', () => {
        onlineListeners.forEach((cb) => cb(false));
    });

    // Capture PWA beforeinstallprompt event
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e as BeforeInstallPromptEvent;
        installListeners.forEach((cb) => cb(true));
    });

    window.addEventListener('appinstalled', () => {
        deferredPrompt = null;
        installListeners.forEach((cb) => cb(false));
    });

    // Register Service Worker in production or supporting browsers
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    // Check for SW updates
                    registration.addEventListener('updatefound', () => {
                        const newWorker = registration.installing;
                        if (!newWorker) return;
                        newWorker.addEventListener('statechange', () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                console.log('[Calora PWA] New update available.');
                            }
                        });
                    });
                })
                .catch((err) => {
                    console.warn('[Calora PWA] Service worker registration failed:', err);
                });
        });
    }
}

export function subscribeToInstallPrompt(callback: (canInstall: boolean) => void): () => void {
    installListeners.add(callback);
    callback(deferredPrompt !== null);
    return () => {
        installListeners.delete(callback);
    };
}

export function subscribeToOnlineStatus(callback: (isOnline: boolean) => void): () => void {
    onlineListeners.add(callback);
    if (typeof navigator !== 'undefined') {
        callback(navigator.onLine);
    }
    return () => {
        onlineListeners.delete(callback);
    };
}

export async function promptPwaInstall(): Promise<boolean> {
    if (!deferredPrompt) return false;
    try {
        await deferredPrompt.prompt();
        const choice = await deferredPrompt.userChoice;
        deferredPrompt = null;
        installListeners.forEach((cb) => cb(false));
        return choice.outcome === 'accepted';
    } catch {
        return false;
    }
}
