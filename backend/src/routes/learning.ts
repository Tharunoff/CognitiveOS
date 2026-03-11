import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth';
import { compressLearning } from '../services/ai';

const router = express.Router();
const prisma = new PrismaClient({
    datasourceUrl: "file:./dev.db"
});

router.post('/compress', authMiddleware, async (req, res) => {
    const { topic } = req.body;
    try {
        const compressed = await compressLearning(topic);
        if (!compressed) return res.status(500).json({ error: 'AI structuring failed' });

        const newTopic = await prisma.learningTopic.create({
            data: {
                topic,
                kidExplanation: compressed.kid_explanation,
                examAnswer: compressed.exam_answer,
                bulletNotes: compressed.bullet_notes,
                stepExplanation: compressed.step_explanation
            }
        });
        res.json(newTopic);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/', authMiddleware, async (req, res) => {
    try {
        const topics = await prisma.learningTopic.findMany({ orderBy: { id: 'desc' } });
        res.json(topics);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
