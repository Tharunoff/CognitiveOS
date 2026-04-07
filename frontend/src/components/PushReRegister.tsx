'use client';
import { useEffect } from 'react';
import { registerPushNotifications } from '@/utils/pushNotifications';

export default function PushReRegister() {
  useEffect(() => {
    let mounted = true;
    const handleRegister = async () => {
      try {
        const token =
          localStorage.getItem('token') ||
          localStorage.getItem('authToken') ||
          localStorage.getItem('accessToken') ||
          sessionStorage.getItem('token') ||
          '';
        const apiUrl = process.env.NEXT_PUBLIC_API_URL!;

        // Step A: Fully unregister ALL service workers to clear stale push state
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            try {
              const sub = await reg.pushManager.getSubscription();
              if (sub) {
                await sub.unsubscribe();
              }
            } catch (e) {
              // ignore
            }
            await reg.unregister();
          }

          // Step B: Re-register the SW fresh
          await navigator.serviceWorker.register('/sw.js');
          await navigator.serviceWorker.ready;
        }

        // Step C: Now subscribe fresh
        if (mounted) {
          await registerPushNotifications(apiUrl, token);
        }
      } catch (e: any) {
        console.error('[Push] Auto-register failed:', e);
      }
    };

    const timer = setTimeout(() => {
      handleRegister();
    }, 2000);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, []);

  return null;
}
