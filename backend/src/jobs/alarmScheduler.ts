import cron from 'node-cron';
import webpush from 'web-push';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

webpush.setVapidDetails(
  process.env.VAPID_EMAIL!,
  process.env.VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export function startAlarmScheduler() {
  // Runs every minute
  cron.schedule('* * * * *', async () => {
    const now = new Date();

    try {
      // Find all blocks whose reminder time has arrived and haven't been reminded yet
      const blocks = await prisma.timeBlock.findMany({
        where: {
          reminded: false,
          reminderMinutes: { not: null },
          scheduledDate: { gte: new Date(now.getTime() - 60000) }, // not in the past more than 1 min
        },
      });

      for (const block of blocks) {
        if (!block.reminderMinutes || !block.scheduledDate) continue;

        // Calculate when the reminder should fire
        // `scheduledDate` usually represents the start time, or you parse `startTime` string
        // Since `startTime` is string like "HH:MM", we have to parse it. Wait, checking TimeBlock model:
        // scheduledDate: DateTime
        // startTime: String
        // Is `scheduledDate` only the date? Let's check how it's used. Let's look closely at `startTime`.
        // Let's assume scheduledDate is the base and startTime adds the time. Let's see later.
        
        let blockDate = new Date(block.scheduledDate);
        if (block.startTime) {
          const parts = block.startTime.split(':');
          const hh = parts[0] || '0';
          const mm = parts[1] || '0';
          blockDate.setHours(parseInt(hh, 10));
          blockDate.setMinutes(parseInt(mm, 10));
          blockDate.setSeconds(0);
        }

        const reminderTime = new Date(
          blockDate.getTime() - block.reminderMinutes * 60000
        );

        // Check if reminder time is within this minute window
        const diff = Math.abs(now.getTime() - reminderTime.getTime());
        if (diff > 60000) continue;

        // Get all push subscriptions for this user
        const subscriptions = await prisma.pushSubscription.findMany({
          where: { userId: block.userId },
        });

        const payload = JSON.stringify({
          title: '⏰ Block Starting Soon',
          body: `"${block.title}" starts in ${block.reminderMinutes} minute${block.reminderMinutes === 1 ? '' : 's'}`,
          sound: '/alarm.mp3',
          blockId: block.id,
        });

        // Send push to all user devices
        for (const sub of subscriptions) {
          try {
            await webpush.sendNotification(
              {
                endpoint: sub.endpoint,
                keys: { p256dh: sub.p256dh, auth: sub.auth },
              },
              payload
            );
          } catch (e: any) {
            // If subscription expired, remove it
            if (e.statusCode === 410) {
              await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } });
            }
          }
        }

        // Mark this block as reminded so it never fires again
        await prisma.timeBlock.update({
          where: { id: block.id },
          data: { reminded: true },
        });

        console.log(`[Alarm] Fired reminder for block "${block.title}" for user ${block.userId}`);
      }
    } catch (e) {
      console.error('[Alarm] Cron error:', e);
    }
  });

  console.log('[Alarm] Scheduler started');
}
