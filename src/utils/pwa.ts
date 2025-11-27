// PWA utilities for Lalani ERP

// Register service worker
export const registerServiceWorker = async (): Promise<void> => {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });

            console.log('Service Worker registered successfully:', registration.scope);

            // Handle updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            // New version available
                            showUpdateNotification();
                        }
                    });
                }
            });

        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
};

// Show update notification
const showUpdateNotification = (): void => {
    const updateBanner = document.createElement('div');
    updateBanner.id = 'pwa-update-banner';
    updateBanner.innerHTML = `
    <div class="fixed top-0 left-0 right-0 bg-brand-600 text-white px-4 py-3 z-50 shadow-lg">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <span class="text-sm font-medium">App update available!</span>
        </div>
        <div class="flex space-x-2">
          <button id="update-dismiss" class="text-xs underline hover:no-underline">Later</button>
          <button id="update-refresh" class="bg-white text-brand-600 px-3 py-1 rounded text-xs font-medium hover:bg-gray-100">Update</button>
        </div>
      </div>
    </div>
  `;

    document.body.appendChild(updateBanner);

    document.getElementById('update-refresh')?.addEventListener('click', () => {
        window.location.reload();
    });

    document.getElementById('update-dismiss')?.addEventListener('click', () => {
        updateBanner.remove();
    });
};

// Initialize PWA features
export const initPWA = async (): Promise<void> => {
    await registerServiceWorker();
};