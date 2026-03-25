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

      console.log('[Push] Re-register — Token length:', token.length, 'API URL:', apiUrl);

      // Force unsubscribe first, then re-subscribe fresh
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          await existing.unsubscribe();
          console.log('[Push] Unsubscribed old subscription');
        }
      }

      await registerPushNotifications(apiUrl, token);
      setStatus('done');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (e: any) {
      console.error('[Push] Re-register failed:', e);
      setStatus('error');
      alert(`Push Failed: ${e.message || String(e)}`);
      setTimeout(() => setStatus('idle'), 3000);
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
