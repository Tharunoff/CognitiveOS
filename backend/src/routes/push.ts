import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Save or update push subscription for this user's device
router.post('/subscribe', authMiddleware, async (req: any, res) => {
  const { endpoint, keys } = req.body;
  const userId = req.user.id;

  console.log(`[Push] Subscribe request from user ${userId}`);
  console.log(`[Push] Endpoint: ${endpoint?.slice(0, 60)}...`);
  console.log(`[Push] Keys present: p256dh=${!!keys?.p256dh} auth=${!!keys?.auth}`);

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    console.error('[Push] Invalid subscription data received');
    return res.status(400).json({ error: 'Invalid subscription data' });
  }

  try {
    await prisma.pushSubscription.upsert({
      where: { endpoint },
      update: { p256dh: keys.p256dh, auth: keys.auth, userId },
      create: { endpoint, p256dh: keys.p256dh, auth: keys.auth, userId },
    });
    console.log(`[Push] Subscription saved for user ${userId}`);
    res.json({ success: true });
  } catch (e) {
    console.error('[Push] Subscribe error:', e);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// Debug: list all subscriptions for the current user
router.get('/debug', authMiddleware, async (req: any, res) => {
  const subs = await prisma.pushSubscription.findMany({
    where: { userId: req.user.id },
    select: { id: true, endpoint: true, createdAt: true },
  });
  res.json({ count: subs.length, subscriptions: subs });
});

// Remove subscription (when user denies permission)
router.post('/unsubscribe', authMiddleware, async (req: any, res) => {
  const { endpoint } = req.body;
  try {
    await prisma.pushSubscription.deleteMany({ where: { endpoint } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to remove subscription' });
  }
});

export default router;
