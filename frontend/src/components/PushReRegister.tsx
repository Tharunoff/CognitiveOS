'use client';
import { useState } from 'react';
import { registerPushNotifications } from '@/utils/pushNotifications';

export default function PushReRegister() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');

  const handleRegister = async () => {
    setStatus('loading');
    try {
      const token =
        localStorage.getItem('token') ||
        localStorage.getItem('authToken') ||
        localStorage.getItem('accessToken') ||
        sessionStorage.getItem('token') ||
        '';
      const apiUrl = process.env.NEXT_PUBLIC_API_URL!;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '(not set)';

      console.log('[Push] Re-register — Token length:', token.length, 'API URL:', apiUrl);
      console.log('[Push] VAPID key first 10 chars:', vapidKey.slice(0, 10), 'last 5:', vapidKey.slice(-5), 'length:', vapidKey.length);

      // Step A: Fully unregister ALL service workers to clear stale push state
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        console.log('[Push] Found', registrations.length, 'SW registrations');
        for (const reg of registrations) {
          // Unsubscribe push if exists
          try {
            const sub = await reg.pushManager.getSubscription();
            if (sub) {
              await sub.unsubscribe();
              console.log('[Push] Unsubscribed push from SW scope:', reg.scope);
            }
          } catch (e) {
            console.log('[Push] Could not unsubscribe from', reg.scope);
          }
          // Fully unregister the SW
          await reg.unregister();
          console.log('[Push] Unregistered SW scope:', reg.scope);
        }

        // Step B: Re-register the SW fresh
        console.log('[Push] Re-registering sw.js...');
        await navigator.serviceWorker.register('/sw.js');
        console.log('[Push] SW re-registered, waiting for ready...');
        await navigator.serviceWorker.ready;
        console.log('[Push] SW is ready');
      }

      // Step C: Now subscribe fresh
      await registerPushNotifications(apiUrl, token);
      setStatus('done');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (e: any) {
      console.error('[Push] Re-register failed:', e);
      setStatus('error');
      alert(`Push Failed: ${e?.message || String(e)}`);
      setTimeout(() => setStatus('idle'), 5000);
    }
  };

  return (
    <button
      id="push-reregister-btn"
      onClick={handleRegister}
      disabled={status === 'loading'}
      className="text-sm px-3 py-1.5 rounded-md border border-input bg-background hover:bg-accent transition-colors"
    >
      {status === 'loading' && 'Registering...'}
      {status === 'done' && '✓ Alarm notifications enabled'}
      {status === 'error' && 'Failed — try again'}
      {status === 'idle' && '🔔 Enable alarm notifications'}
    </button>
  );
}
