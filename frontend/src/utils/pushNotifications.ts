export async function registerPushNotifications(apiUrl: string, token: string) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    throw new Error('Push not supported in this browser');
  }

  // Step 1: Ask permission
  console.log('[Push] Step 1: Requesting notification permission...');
  const permission = await Notification.requestPermission();
  console.log('[Push] Step 1 result: permission =', permission);
  if (permission !== 'granted') {
    throw new Error('Notification permission denied by user (got: ' + permission + ')');
  }

  // Step 2: Check VAPID key
  const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  console.log('[Push] Step 2: VAPID key present =', !!vapidKey, 'length =', vapidKey?.length);
  if (!vapidKey) {
    throw new Error('NEXT_PUBLIC_VAPID_PUBLIC_KEY is not set — add it to Vercel Environment Variables');
  }

  // Step 3: Wait for SW registration
  console.log('[Push] Step 3: Waiting for serviceWorker.ready...');
  const registration = await navigator.serviceWorker.ready;
  console.log('[Push] Step 3 result: SW scope =', registration.scope);

  // Step 4: Subscribe to push
  console.log('[Push] Step 4: Calling pushManager.subscribe...');
  let subscription;
  try {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(vapidKey) as any,
    });
    console.log('[Push] Step 4 result: endpoint =', subscription.endpoint.slice(0, 60));
  } catch (subErr: any) {
    const msg = subErr?.message || subErr?.name || String(subErr);
    console.error('[Push] Step 4 FAILED:', msg);
    throw new Error('pushManager.subscribe failed: ' + msg);
  }

  // Step 5: Send to backend
  console.log('[Push] Step 5: Sending subscription to backend...');
  const subJson = subscription.toJSON();
  const body = {
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subJson.keys?.p256dh,
      auth: subJson.keys?.auth,
    }
  };
  console.log('[Push] Step 5: p256dh present =', !!body.keys.p256dh, 'auth present =', !!body.keys.auth);

  let res;
  try {
    res = await fetch(`${apiUrl}/push/subscribe`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
  } catch (fetchErr: any) {
    const msg = fetchErr?.message || String(fetchErr);
    console.error('[Push] Step 5 FETCH FAILED:', msg);
    throw new Error('Network error posting subscription: ' + msg);
  }

  if (!res.ok) {
    const errBody = await res.text().catch(() => '(no body)');
    console.error('[Push] Step 5: Backend returned', res.status, errBody);
    throw new Error('Backend returned ' + res.status + ': ' + errBody);
  }

  console.log('[Push] ✅ Subscribed successfully!');
}

// Helper to convert VAPID key
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array(rawData.split('').map((char) => char.charCodeAt(0)));
}
