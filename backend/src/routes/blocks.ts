import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all blocks
router.get('/', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const blocks = await prisma.timeBlock.findMany({
            where: { userId },
            include: { logs: true },
            orderBy: { startTime: 'asc' }
        });
        res.json(blocks);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Create a block
router.post('/', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { title, description, day, startTime, endTime, reminderTime } = req.body;

    try {
        const block = await prisma.timeBlock.create({
            data: { userId, title, description, day, startTime, endTime, reminderTime, status: 'SCHEDULED' }
        });
        res.json(block);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Log a block (Focus mode complete)
router.post('/:id/log', authMiddleware, async (req, res) => {
    const { output } = req.body;
    try {
        const blockLog = await prisma.blockLog.create({
            data: { blockId: req.params.id as string, output }
        });

        // update block status
        await prisma.timeBlock.update({
            where: { id: req.params.id as string },
            data: { status: 'COMPLETED' }
        });

        res.json(blockLog);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Edit a block
router.put('/:id', authMiddleware, async (req, res) => {
    const { title, description, day, startTime, endTime, reminderTime } = req.body;
    try {
        const block = await prisma.timeBlock.update({
            where: { id: req.params.id as string },
            data: { title, description, day, startTime, endTime, reminderTime }
        });
        res.json(block);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// Delete a block
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await prisma.timeBlock.delete({
            where: { id: req.params.id as string }
        });
        res.json({ msg: 'Block deleted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

export default router;
