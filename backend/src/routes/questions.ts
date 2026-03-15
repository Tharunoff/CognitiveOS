import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/questions — fetch all questions for logged in user, newest first
router.get('/', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const questions = await prisma.question.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(questions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch questions' });
    }
});

// POST /api/questions — create a new question
router.post('/', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { text } = req.body;
    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Question text is required' });
    }
    try {
        const question = await prisma.question.create({
            data: { text: text.trim(), userId },
        });
        res.json(question);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create question' });
    }
});

// PATCH /api/questions/:id — edit question text
router.patch('/:id', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const id = req.params.id as string;
    const { text } = req.body;
    if (!text || !text.trim()) {
        return res.status(400).json({ error: 'Question text is required' });
    }
    try {
        const existing = await prisma.question.findUnique({ where: { id } });
        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ error: 'Question not found' });
        }
        const updated = await prisma.question.update({
            where: { id },
            data: { text: text.trim() },
        });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update question' });
    }
});

// DELETE /api/questions/:id — delete a question by id
router.delete('/:id', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const id = req.params.id as string;
    try {
        const existing = await prisma.question.findUnique({ where: { id } });
        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ error: 'Question not found' });
        }
        await prisma.question.delete({ where: { id } });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete question' });
    }
});

export default router;
