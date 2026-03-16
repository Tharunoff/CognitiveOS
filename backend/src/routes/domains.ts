import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/domains — get all domains for logged in user
router.get('/', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const domains = await prisma.domain.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { notes: true } } },
        });
        res.json(domains);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch domains' });
    }
});

// POST /api/domains — create a domain
router.post('/', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { name, color } = req.body;
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Domain name is required' });
    }
    try {
        const domain = await prisma.domain.create({
            data: {
                name: name.trim(),
                color: color || '#6366f1',
                userId,
            },
        });
        res.json(domain);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create domain' });
    }
});

// PATCH /api/domains/:id — update domain name or color
router.patch('/:id', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const id = req.params.id as string;
    const { name, color } = req.body;
    try {
        const existing = await prisma.domain.findUnique({ where: { id } });
        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ error: 'Domain not found' });
        }
        const data: any = {};
        if (name !== undefined) data.name = name.trim();
        if (color !== undefined) data.color = color;
        const updated = await prisma.domain.update({
            where: { id },
            data,
        });
        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update domain' });
    }
});

// DELETE /api/domains/:id — delete domain (notes get domainId set to null via onDelete: SetNull)
router.delete('/:id', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const id = req.params.id as string;
    try {
        const existing = await prisma.domain.findUnique({ where: { id } });
        if (!existing || existing.userId !== userId) {
            return res.status(404).json({ error: 'Domain not found' });
        }
        await prisma.domain.delete({ where: { id } });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete domain' });
    }
});

// GET /api/domains/:id/notes — get all notes inside a specific domain
router.get('/:id/notes', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const domainId = req.params.id as string;
    try {
        const domain = await prisma.domain.findUnique({ where: { id: domainId } });
        if (!domain || domain.userId !== userId) {
            return res.status(404).json({ error: 'Domain not found' });
        }
        const notes = await prisma.note.findMany({
            where: { domainId, userId },
            orderBy: { createdAt: 'desc' },
        });
        res.json(notes);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch domain notes' });
    }
});

// POST /api/domains/:id/notes — create a note inside a domain
router.post('/:id/notes', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const domainId = req.params.id as string;
    const { title, content } = req.body;
    if (!title || !title.trim()) {
        return res.status(400).json({ error: 'Title is required' });
    }
    try {
        const domain = await prisma.domain.findUnique({ where: { id: domainId } });
        if (!domain || domain.userId !== userId) {
            return res.status(404).json({ error: 'Domain not found' });
        }
        const note = await prisma.note.create({
            data: {
                title: title.trim(),
                content: (content || '').trim(),
                type: 'domain',
                userId,
                domainId,
            },
        });
        res.json(note);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to create domain note' });
    }
});

export default router;
