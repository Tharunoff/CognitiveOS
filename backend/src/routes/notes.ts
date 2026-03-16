import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/notes — get all normal notes, newest first
router.get('/', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const notes = await prisma.note.findMany({
            where: { userId, type: 'normal' },
            orderBy: { createdAt: 'desc' },
        });
        res.json(notes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch notes' });
    }
});

// POST /api/notes — create a normal note
router.post('/', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { title, content } = req.body;
    if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Title is required' });
    }
    try {
        const note = await prisma.note.create({
            data: {
                title: title.trim(),
                content: (content || '').trim(),
                type: 'normal',
                userId,
            },
        });
        res.json(note);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create note' });
    }
});

// PATCH /api/notes/:id — update title and/or content
router.patch('/:id', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const id = req.params.id as string;
    const { title, content } = req.body;
    try {
        const existing = await prisma.note.findUnique({ where: { id } });
        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ error: 'Note not found' });
        }
        const data: any = {};
        if (title !== undefined) data.title = title.trim();
        if (content !== undefined) data.content = content.trim();
        const updated = await prisma.note.update({
            where: { id },
            data,
        });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update note' });
    }
});

// DELETE /api/notes/:id — delete a note
router.delete('/:id', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const id = req.params.id as string;
    try {
        const existing = await prisma.note.findUnique({ where: { id } });
        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ error: 'Note not found' });
        }
        await prisma.note.delete({ where: { id } });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete note' });
    }
});

export default router;
