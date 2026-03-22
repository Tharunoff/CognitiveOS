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
      // First check: how many total blocks exist
      const totalBlocks = await prisma.timeBlock.count();
      console.log(`[Alarm] Total blocks in DB: ${totalBlocks}`);

      // Second check: how many have reminderMinutes set
      const blocksWithReminder = await prisma.timeBlock.count({
        where: { reminderMinutes: { not: null } }
      });
      console.log(`[Alarm] Blocks with reminderMinutes set: ${blocksWithReminder}`);

      // Third check: how many are not yet reminded
      const unreminded = await prisma.timeBlock.count({
        where: { reminderMinutes: { not: null }, reminded: false }
      });
      console.log(`[Alarm] Unreminded blocks: ${unreminded}`);

      // Fourth check: show all upcoming blocks raw
      const upcoming = await prisma.timeBlock.findMany({
        where: { reminded: false, reminderMinutes: { not: null } },
        select: {
          id: true,
          title: true,
          scheduledDate: true,
          reminderMinutes: true,
          reminded: true,
        },
        take: 5,
      });
      console.log(`[Alarm] Upcoming blocks sample:`, JSON.stringify(upcoming, null, 2));

      const blocks = await prisma.timeBlock.findMany({
        where: {
          reminded: false,
          reminderMinutes: { not: null },
        },
      });

      console.log(`[Alarm] Checking ${blocks.length} unreminded blocks at ${now.toISOString()}`);

      for (const block of blocks) {
        if (!block.reminderMinutes || !block.scheduledDate) continue;

        // When should reminder fire
        const reminderTime = new Date(
          new Date(block.scheduledDate).getTime() - block.reminderMinutes * 60 * 1000
        );

        const diffMs = reminderTime.getTime() - now.getTime();
        const diffMins = diffMs / 60000;

        console.log(`[Alarm] Block "${block.title}" reminderTime=${reminderTime.toISOString()} diffMins=${diffMins.toFixed(2)}`);

        // Fire if within a 90 second window (handles cron timing drift)
        if (diffMs >= -90000 && diffMs <= 90000) {
          console.log(`[Alarm] FIRING for block "${block.title}"`);

          const subscriptions = await prisma.pushSubscription.findMany({
            where: { userId: block.userId },
          });

          console.log(`[Alarm] Found ${subscriptions.length} push subscriptions for user ${block.userId}`);

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
                payload
              );
              console.log(`[Alarm] Push sent to endpoint: ${sub.endpoint.slice(0, 50)}...`);
            } catch (e: any) {
              console.error(`[Alarm] Push failed:`, e.message);
              if (e.statusCode === 410) {
                await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } });
                console.log(`[Alarm] Removed expired subscription`);
              }
            }
          }

          await prisma.timeBlock.update({
            where: { id: block.id },
            data: { reminded: true },
          });

          console.log(`[Alarm] Marked block "${block.title}" as reminded`);
        }
      }
    } catch (e) {
      console.error('[Alarm] Cron debug error:', e);
    }
  });

  console.log('[Alarm] Scheduler started');
}
