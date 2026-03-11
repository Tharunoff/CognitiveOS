'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useAppStore } from '@/store/useAppStore';

export function ReminderSystem() {
    const { isAuthenticated } = useAppStore();
    const [blocks, setBlocks] = useState<any[]>([]);

    useEffect(() => {
        if (!isAuthenticated) return;

        // Request permission for notifications if supported
        if (typeof window !== 'undefined' && 'Notification' in window) {
            if (Notification.permission === 'default') {
                Notification.requestPermission();
            }
        }

        const fetchBlocks = async () => {
            try {
                const data = await apiFetch('/blocks');
                setBlocks(data);
            } catch (e) {
                console.error("Failed to load blocks for reminders", e);
            }
        };

        fetchBlocks();
        // Refresh blocks every 5 minutes in case of background updates
        const fetchInterval = setInterval(fetchBlocks, 5 * 60 * 1000);

        return () => clearInterval(fetchInterval);
    }, [isAuthenticated]);

    useEffect(() => {
        if (!isAuthenticated || blocks.length === 0) return;

        const checkReminders = () => {
            const now = new Date();
            const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' });
            const currentHrs = now.getHours();
            const currentMins = now.getMinutes();
            const nowInMins = currentHrs * 60 + currentMins;

            blocks.forEach(block => {
                if (block.day !== currentDay || block.status === 'COMPLETED') return;

                const [sH, sM] = block.startTime.split(':').map(Number);
                const blockTimeInMins = sH * 60 + sM;

                // Trigger precisely at the reminderTime threshold
                if (blockTimeInMins - block.reminderTime === nowInMins) {
                    if ('Notification' in window && Notification.permission === 'granted') {
                        new Notification("Upcoming Focus Block", {
                            body: `${block.title} starts in ${block.reminderTime} minutes!`,
                            requireInteraction: true
                        });
                    }
                }
            });
        };

        // Check exactly every 1 minute
        const checkInterval = setInterval(checkReminders, 60 * 1000);

        return () => clearInterval(checkInterval);
    }, [blocks, isAuthenticated]);

    return null; // Invisible component
}
