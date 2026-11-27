import { useSyncExternalStore } from 'react';

function subscribe(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

// navigator.onLine=false reliably means "no network"; true does not guarantee the backend is
// reachable, so failed requests are still reported by each screen (see ARCHITECTURE.md).
export function useBrowserOnline() {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
