import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all blocks
router.get('/', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { from, to } = req.query;
    try {
        const whereClause: any = { userId };
        
        if (from && to) {
            whereClause.scheduledDate = {
                gte: new Date(from as string),
                lte: new Date(to as string)
            };
        }
        
        const blocks = await prisma.timeBlock.findMany({
            where: whereClause,
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
    const { title, description, scheduledDate, day, startTime, endTime, reminderTime, reminderMinutes } = req.body;
    
    // Explicitly parse reminderMinutes — it may come as a string from the frontend
    const parsedReminderMinutes = reminderMinutes !== null && reminderMinutes !== undefined
      ? parseInt(String(reminderMinutes), 10)
      : null;

    console.log(`[Blocks] Creating block: title="${title}" scheduledDate="${scheduledDate || day}" reminderMinutes=${parsedReminderMinutes}`);

    // Support fallback to 'day' if frontend still sends it
    const parsedDate = new Date(scheduledDate || day);

    try {
        const block = await prisma.timeBlock.create({
            data: { userId, title, description, scheduledDate: parsedDate, startTime, endTime, reminderTime, reminderMinutes: parsedReminderMinutes, status: 'SCHEDULED' }
        });
        res.json(block);
    } catch (error) {
        console.error('[Blocks] Create error:', error);
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
    const { title, description, scheduledDate, day, startTime, endTime, reminderTime, reminderMinutes } = req.body;
    
    // Explicitly parse reminderMinutes
    const parsedReminderMinutes = reminderMinutes !== null && reminderMinutes !== undefined
      ? parseInt(String(reminderMinutes), 10)
      : null;

    try {
        const dataToUpdate: any = { title, description, startTime, endTime, reminderTime, reminderMinutes: parsedReminderMinutes };
        if (scheduledDate || day) {
            dataToUpdate.scheduledDate = new Date(scheduledDate || day);
        }

        const block = await prisma.timeBlock.update({
            where: { id: req.params.id as string },
            data: dataToUpdate
        });
        res.json(block);
    } catch (err) {
        console.error('[Blocks] Update error:', err);
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
