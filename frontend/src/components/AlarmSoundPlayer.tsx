'use client';
import { useEffect } from 'react';

export default function AlarmSoundPlayer() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handleMessage = (event: MessageEvent) => {
      console.log('[App] SW message received:', event.data);
      if (event.data?.type === 'PLAY_ALARM_SOUND') {
        try {
          const audio = new Audio(event.data.sound || '/alarm.mp3');
          audio.volume = 1.0;
          audio
            .play()
            .then(() => console.log('[App] Alarm sound playing'))
            .catch((e) => console.warn('[App] Audio play blocked:', e));
        } catch (e) {
          console.warn('[App] Audio error:', e);
        }
      }
    };

    navigator.serviceWorker.addEventListener('message', handleMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleMessage);
    };
  }, []);

  return null;
}
