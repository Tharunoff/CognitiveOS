import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth';
import { generateMorningBrief, generateDailyQuote, detectPatterns, draftWeeklyMission } from '../services/ai';
import { getCached, setCached, clearCached } from '../utils/dailyCache';

const router = express.Router();
const prisma = new PrismaClient();

// ─── DAILY QUOTE ──────────────────────────────────────────
router.get('/quote', authMiddleware, async (req, res) => {
    try {
        const cached = await getCached('daily_quote');
        if (cached) {
            console.log('[Quote] Serving from cache');
            return res.json(cached);
        }

        console.log('[Quote] No cache found, generating from Gemini...');
        const quote = await generateDailyQuote();
        await setCached('daily_quote', quote);
        return res.json(quote);
    } catch (e) {
        console.error('[Quote] Error:', e);
        return res.status(500).json({ error: 'Failed to generate quote' });
    }
});

router.post('/quote/reset', async (req, res) => {
    await clearCached('daily_quote');
    res.json({ message: 'Quote cache cleared. Refresh dashboard to get new quote.' });
});

// ─── MORNING BRIEF ────────────────────────────────────────
router.get('/brief', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const cacheKey = `brief_${userId}`;
        const cached = await getCached(cacheKey);
        if (cached) return res.json(cached);

        const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'long' });

        const [todayBlocks, allIdeas, streak, completedBlocks] = await Promise.all([
            prisma.timeBlock.findMany({ where: { userId }, orderBy: { startTime: 'asc' } }),
            prisma.idea.findMany({ where: { userId, archived: false }, orderBy: { updatedAt: 'desc' }, take: 30 }),
            prisma.userStreak.findUnique({ where: { userId } }),
            prisma.timeBlock.findMany({ where: { userId, status: 'COMPLETED' } })
        ]);

        const todayBlocksFiltered = todayBlocks.filter(b => {
             // Fallback filtering in case of migration
             if (b.scheduledDate) {
                 const blockDate = new Date(b.scheduledDate);
                 const today = new Date();
                 return blockDate.toDateString() === today.toDateString();
             }
             return false;
        });

        const decayingIdeas = allIdeas.filter(i => i.decayScore < 0.4);
        const recentIdeas = allIdeas.filter(i => {
            const daysSince = (Date.now() - i.createdAt.getTime()) / (1000 * 60 * 60 * 24);
            return daysSince <= 7;
        });

        const totalDeepWorkHours = completedBlocks.length;

        const brief = await generateMorningBrief({
            todayBlocks: todayBlocksFiltered,
            decayingIdeas,
            recentIdeas,
            streak,
            totalDeepWorkHours
        });

        const result = {
            brief,
            todayBlocks: todayBlocksFiltered,
            decayingIdeas: decayingIdeas.slice(0, 3),
            stats: {
                streak: streak?.currentStreak || 0,
                longestStreak: streak?.longestStreak || 0,
                deepWorkHours: totalDeepWorkHours,
                activeIdeas: allIdeas.filter(i => !i.archived).length,
                decayingCount: decayingIdeas.length
            }
        };

        await setCached(cacheKey, result);
        res.json(result);
    } catch (err: any) {
        if (err.message?.includes('limit reached')) return res.status(429).json({ error: err.message });
        console.error(err);
        res.status(500).json({ error: 'Failed to generate brief' });
    }
});

// ─── PATTERN RADAR ────────────────────────────────────────
router.get('/patterns', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const cacheKey = `patterns_${userId}`;
        const cached = await getCached(cacheKey);
        if (cached) return res.json(cached);

        const [ideas, blocks] = await Promise.all([
            prisma.idea.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, take: 30 }),
            prisma.timeBlock.findMany({ where: { userId, status: 'COMPLETED' }, take: 20 })
        ]);
        const patterns = await detectPatterns(ideas, blocks);
        await setCached(cacheKey, patterns);
        res.json(patterns);
    } catch (err: any) {
        if (err.message?.includes('limit reached')) return res.status(429).json({ error: err.message });
        console.error(err);
        res.status(500).json({ error: 'Pattern detection failed' });
    }
});

// ─── WEEKLY MISSION ───────────────────────────────────────
router.get('/mission', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const cacheKey = `mission_${userId}`;
        const cached = await getCached(cacheKey);
        if (cached) return res.json(cached);

        const [activeIdeas, blocks, decayingIdeas] = await Promise.all([
            prisma.idea.findMany({ where: { userId, archived: false }, orderBy: { updatedAt: 'desc' }, take: 20 }),
            prisma.timeBlock.findMany({ where: { userId } }),
            prisma.idea.findMany({ where: { userId, archived: false, decayScore: { lt: 0.4 } } })
        ]);
        const mission = await draftWeeklyMission(activeIdeas, blocks, decayingIdeas);
        await setCached(cacheKey, mission);
        res.json(mission);
    } catch (err: any) {
        if (err.message?.includes('limit reached')) return res.status(429).json({ error: err.message });
        console.error(err);
        res.status(500).json({ error: 'Mission drafting failed' });
    }
});

// ─── MANUAL REFRESH CACHE ─────────────────────────────────
router.post('/refresh/:key', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { key } = req.params;
    try {
        const fullKey = `${key}_${userId}`;
        const todayStr = new Date().toDateString();
        await prisma.dailyCache.deleteMany({
            where: { key: fullKey, date: todayStr }
        });
        res.json({ success: true, message: `Cache for ${key} cleared` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to clear cache' });
    }
});

// ─── STREAK ───────────────────────────────────────────────
router.get('/streak', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    try {
        let streak = await prisma.userStreak.findUnique({ where: { userId } });
        if (!streak) {
            streak = await prisma.userStreak.create({ data: { userId } });
        }
        res.json(streak);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to get streak' });
    }
});

router.post('/streak/record', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    try {
        let streak = await prisma.userStreak.findUnique({ where: { userId } });
        if (!streak) {
            streak = await prisma.userStreak.create({ data: { userId } });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const lastActive = streak.lastActiveDate ? new Date(streak.lastActiveDate) : null;
        if (lastActive) lastActive.setHours(0, 0, 0, 0);

        if (lastActive && lastActive.getTime() === today.getTime()) {
            return res.json(streak); // Already recorded today
        }

        const daysSinceLast = lastActive ? Math.floor((today.getTime() - lastActive.getTime()) / (1000 * 60 * 60 * 24)) : 999;

        let newStreak = streak.currentStreak;
        let freezesUsed = streak.freezesUsed;

        if (daysSinceLast === 1) {
            newStreak += 1;
        } else if (daysSinceLast === 2 && streak.freezesAvailable - streak.freezesUsed > 0) {
            newStreak += 1;
            freezesUsed += 1;
        } else if (daysSinceLast > 1) {
            newStreak = 1; // Reset
        }

        const updated = await prisma.userStreak.update({
            where: { userId },
            data: {
                currentStreak: newStreak,
                longestStreak: Math.max(streak.longestStreak, newStreak),
                lastActiveDate: new Date(),
                totalActiveDays: streak.totalActiveDays + 1,
                freezesUsed
            }
        });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to record streak' });
    }
});

// ─── WEEKLY REVIEW ────────────────────────────────────────
router.get('/weekly-review', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const [blocks, ideas, decayingIdeas] = await Promise.all([
            prisma.timeBlock.findMany({ where: { userId } }),
            prisma.idea.findMany({ where: { userId, createdAt: { gte: weekAgo } } }),
            prisma.idea.findMany({ where: { userId, archived: false, decayScore: { lt: 0.4 } }, select: { id: true, title: true, decayScore: true } })
        ]);

        const completedBlocks = blocks.filter(b => b.status === 'COMPLETED').length;

        res.json({
            blocksTotal: blocks.length,
            blocksCompleted: completedBlocks,
            ideasCreated: ideas.length,
            decayingIdeas,
            completionRate: blocks.length > 0 ? Math.round((completedBlocks / blocks.length) * 100) : 0
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to get weekly review' });
    }
});

router.post('/weekly-review', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { moodRating, decisions } = req.body;
    try {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const [blocks, ideas, decayingIdeas] = await Promise.all([
            prisma.timeBlock.findMany({ where: { userId } }),
            prisma.idea.findMany({ where: { userId, createdAt: { gte: weekAgo } } }),
            prisma.idea.findMany({ where: { userId, archived: false, decayScore: { lt: 0.4 } } })
        ]);

        const review = await prisma.weeklyReview.create({
            data: {
                userId,
                weekStart: weekAgo,
                blocksTotal: blocks.length,
                blocksCompleted: blocks.filter(b => b.status === 'COMPLETED').length,
                ideasCreated: ideas.length,
                ideasDecayed: decayingIdeas.length,
                moodRating,
                decisions: decisions ? JSON.stringify(decisions) : null,
                completedAt: new Date()
            }
        });

        // Process archive decisions
        if (decisions && Array.isArray(decisions)) {
            for (const d of decisions) {
                if (d.action === 'archive' && d.ideaId) {
                    await prisma.idea.update({ where: { id: d.ideaId }, data: { archived: true } });
                }
            }
        }

        res.json(review);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to save weekly review' });
    }
});

export default router;
