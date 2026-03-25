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
    console.log(`[Alarm] Cron tick at ${now.toISOString()}`);

    try {
      const blocks = await prisma.timeBlock.findMany({
        where: {
          reminded: false,
          reminderMinutes: { not: null },
        },
      });

      if (blocks.length > 0) {
        console.log(`[Alarm] Found ${blocks.length} pending unreminded block(s)`);
      }

      for (const block of blocks) {
        if (!block.reminderMinutes || !block.scheduledDate) continue;

        // When should reminder fire
        const reminderTime = new Date(
          new Date(block.scheduledDate).getTime() - block.reminderMinutes * 60 * 1000
        );

        const diffMs = reminderTime.getTime() - now.getTime();

        console.log(`[Alarm] Inspecting "${block.title}" | scheduledFor: ${block.scheduledDate.toISOString()} | diffMs: ${diffMs}`);

        // Fire if we are at the reminder time, or ANY time past it (handles Render server sleeping/waking up late).
        // diffMs <= 90000 allows firing up to 90 seconds early to account for cron tick drift.
        if (diffMs <= 90000) {
          console.log(`[Alarm] >>> FIRING for block "${block.title}" (diffMs: ${diffMs} <= 90000)`);

          const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId: block.userId },
          });

          const payload = JSON.stringify({
            title: '⏰ Block Starting Soon',
            body: `"${block.title}" starts in ${block.reminderMinutes} minute${block.reminderMinutes === 1 ? '' : 's'}`,
            sound: '/alarm.mp3',
            blockId: block.id,
          });

          for (const sub of subscriptions) {
            try {
              await webpush.sendNotification(
                { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
                payload,
                {
                  urgency: 'high', // tells Android to deliver immediately
                  TTL: 21600,      // 6 hours (Android Doze might hold push for hours. 60s is too short and drops it).
                }
              );
              console.log(`[Alarm] Push DELIVERED to endpoint: ${sub.endpoint.slice(0, 50)}...`);
            } catch (e: any) {
              console.error(`[Alarm] Push failed for endpoint ${sub.endpoint.slice(0, 50)}:`, e.message);
              if (e.statusCode === 410) {
                console.log(`[Alarm] Removing stale subscription (410 Gone)`);
                await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } });
              }
            }
          }

          await prisma.timeBlock.update({
            where: { id: block.id },
            data: { reminded: true },
          });
        }
      }
    } catch (e) {
      console.error('[Alarm] Cron error:', e);
    }
  });

  console.log('[Alarm] Scheduler started');
}

