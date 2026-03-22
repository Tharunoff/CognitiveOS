'use client';

import { useEffect } from 'react';

export function PWARegister() {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').catch((err) => {
                console.log('SW registration failed:', err);
            });
        }
    }, []);

    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data?.type === 'PLAY_ALARM') {
                    const audio = new Audio(event.data.sound);
                    audio.volume = 1.0;
                    audio.play().catch(e => console.log('Audio play failed:', e));
                }
            });
        }
    }, []);

    return null;
}
