import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth';
import { structureIdea, editIdeaWithAI, routeThought, detectConnections, detectContradictions, generatePreMortem, generateEditSummary, vaultChat } from '../services/ai';

const router = express.Router();
const prisma = new PrismaClient();

// ─── Helper: Calculate decay score ────────────────────────
function calculateDecay(lastVisited: Date | null, updatedAt: Date, priority: number): number {
    const now = new Date();
    const daysSinceVisit = lastVisited ? (now.getTime() - lastVisited.getTime()) / (1000 * 60 * 60 * 24) : 30;
    const daysSinceUpdate = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24);
    const visitDecay = Math.exp(-0.049 * daysSinceVisit);
    const updateDecay = Math.exp(-0.035 * daysSinceUpdate);
    const priorityMultiplier = 1 + (priority * 0.1);
    const raw = ((visitDecay * 0.4) + (updateDecay * 0.6)) * priorityMultiplier;
    return Math.max(0, Math.min(1, raw));
}

// ─── BRAIN DUMP (with auto-routing) ──────────────────────
router.post('/dump', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { text, type: manualType } = req.body;
    try {
        // Auto-route the thought
        const routing = await routeThought(text);
        const finalType = manualType || routing.type;
        const aiMined = await structureIdea(text, finalType);
        if (!aiMined) return res.status(500).json({ error: 'AI structuring failed' });

        let sections: any[] = [];
        if (finalType === 'Personal') {
            sections = [
                { sectionName: 'Core Thought', content: aiMined.core_thought || '', orderIndex: 0 },
                { sectionName: 'People Involved', content: JSON.stringify(aiMined.people_involved || []), orderIndex: 1 },
                { sectionName: 'Emotional Tone', content: aiMined.emotional_tone || '', orderIndex: 2 },
                { sectionName: 'Time Horizon', content: aiMined.time_horizon || '', orderIndex: 3 },
                { sectionName: 'Current State', content: aiMined.current_state || '', orderIndex: 4 },
                { sectionName: 'Desired State', content: aiMined.desired_state || '', orderIndex: 5 },
                { sectionName: 'Next Small Step', content: aiMined.next_small_step || '', orderIndex: 6 },
                { sectionName: 'Potential Blockers', content: JSON.stringify(aiMined.potential_blockers || []), orderIndex: 7 },
                { sectionName: 'Related Life Areas', content: JSON.stringify(aiMined.related_life_areas || []), orderIndex: 8 },
                { sectionName: 'Reflection Prompt', content: aiMined.reflection_prompt || '', orderIndex: 9 },
            ];
        } else {
            sections = [
                { sectionName: 'Target Users', content: aiMined.target_users || '', orderIndex: 0 },
                { sectionName: 'Core Solution', content: aiMined.core_solution || '', orderIndex: 1 },
                { sectionName: 'Key Features', content: JSON.stringify(aiMined.key_features || []), orderIndex: 2 },
                { sectionName: 'Business Model', content: JSON.stringify(aiMined.business_model || []), orderIndex: 3 },
                { sectionName: 'Risks', content: JSON.stringify(aiMined.risks || []), orderIndex: 4 },
                { sectionName: 'Open Questions', content: JSON.stringify(aiMined.open_questions || []), orderIndex: 5 },
            ];
        }

        const newIdea = await prisma.idea.create({
            data: {
                userId,
                title: aiMined.title || 'Untitled',
                problem: finalType === 'Personal' ? (aiMined.core_thought || text.substring(0, 200)) : (aiMined.problem || text.substring(0, 200)),
                type: finalType,
                subType: finalType === 'Personal' ? (aiMined.sub_type || null) : null,
                sections: { create: sections },
                tags: {
                    create: routing.tags.slice(0, 5).map(tag => ({ name: tag.toLowerCase() }))
                }
            },
            include: { sections: true, tags: true }
        });

        // Detect connections in background (don't block response)
        detectConnectionsAsync(newIdea, userId);

        res.json({ ...newIdea, routing: { type: routing.type, confidence: routing.confidence, tags: routing.tags } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

async function detectConnectionsAsync(newIdea: any, userId: string) {
    try {
        const existingIdeas = await prisma.idea.findMany({
            where: { userId, id: { not: newIdea.id }, archived: false },
            select: { id: true, title: true, problem: true },
            take: 30
        });
        if (existingIdeas.length === 0) return;

        const connections = await detectConnections(
            { id: newIdea.id, title: newIdea.title, problem: newIdea.problem },
            existingIdeas
        );
        for (const conn of connections) {
            const targetExists = existingIdeas.some(i => i.id === conn.target_id);
            if (targetExists) {
                await prisma.ideaLink.create({
                    data: {
                        sourceId: newIdea.id,
                        targetId: conn.target_id,
                        linkType: conn.link_type || 'related',
                        reason: conn.reason || ''
                    }
                });
            }
        }
    } catch (e) {
        console.error("Connection detection failed (non-blocking):", e);
    }
}

// ─── GET ALL IDEAS (with decay recalculation) ─────────────
router.get('/', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const ideas = await prisma.idea.findMany({
            where: { userId },
            include: { tags: true, sourceLinks: true, targetLinks: true },
            orderBy: { createdAt: 'desc' }
        });

        // Recalculate decay scores
        const updated = ideas.map(idea => {
            const newDecay = calculateDecay(idea.lastVisited, idea.updatedAt, idea.priority);
            return { ...idea, decayScore: newDecay };
        });

        // Batch update decay scores
        const updates = updated.filter((idea, i) => Math.abs(idea.decayScore - ideas[i]!.decayScore) > 0.01);
        if (updates.length > 0) {
            await Promise.all(updates.map(idea =>
                prisma.idea.update({ where: { id: idea.id }, data: { decayScore: idea.decayScore } })
            ));
        }

        res.json(updated);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// ─── GET SINGLE IDEA (updates lastVisited) ────────────────
router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const idea = await prisma.idea.update({
            where: { id: req.params.id as string },
            data: { lastVisited: new Date() },
            include: {
                sections: { orderBy: { orderIndex: 'asc' } },
                tags: true,
                sourceLinks: { include: { target: { select: { id: true, title: true, type: true } } } },
                targetLinks: { include: { source: { select: { id: true, title: true, type: true } } } },
                revisions: { orderBy: { createdAt: 'desc' }, take: 10 }
            }
        });
        if (!idea) return res.status(404).json({ msg: 'Idea not found' });
        res.json(idea);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// ─── UPDATE SECTION ───────────────────────────────────────
router.put('/sections/:id', authMiddleware, async (req, res) => {
    const { content } = req.body;
    try {
        const section = await prisma.ideaSection.update({
            where: { id: req.params.id as string },
            data: { content }
        });
        res.json(section);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ─── AI EDIT ──────────────────────────────────────────────
router.put('/:id/ai-edit', authMiddleware, async (req, res) => {
    const { instructions } = req.body;
    try {
        const idea = await prisma.idea.findUnique({
            where: { id: req.params.id as string },
            include: { sections: { orderBy: { orderIndex: 'asc' } } }
        });
        if (!idea) return res.status(404).json({ msg: 'Idea not found' });

        // Build current JSON
        const currentJson: any = { title: idea.title, problem: idea.problem };
        idea.sections.forEach(s => {
            const key = s.sectionName.toLowerCase().replace(/\s+/g, '_');
            try {
                currentJson[key] = JSON.parse(s.content);
            } catch {
                currentJson[key] = s.content;
            }
        });

        // Save revision before edit
        await prisma.ideaRevision.create({
            data: { ideaId: idea.id, snapshot: JSON.stringify(currentJson) }
        });

        const updatedJson = await editIdeaWithAI(currentJson, instructions);
        if (!updatedJson) return res.status(500).json({ error: 'AI editing failed' });

        // Generate edit summary
        const editNote = await generateEditSummary(currentJson, updatedJson);

        // Update the revision with the note
        const latestRevision = await prisma.ideaRevision.findFirst({
            where: { ideaId: idea.id },
            orderBy: { createdAt: 'desc' }
        });
        if (latestRevision) {
            await prisma.ideaRevision.update({
                where: { id: latestRevision.id },
                data: { editNote }
            });
        }

        // Update main idea
        await prisma.idea.update({
            where: { id: idea.id },
            data: {
                title: updatedJson.title || idea.title,
                problem: updatedJson.problem || idea.problem,
            }
        });

        // Update sections
        const txs = idea.sections.map(section => {
            const key = section.sectionName.toLowerCase().replace(/\s+/g, '_');
            let newContent = section.content;
            if (updatedJson[key] !== undefined) {
                newContent = typeof updatedJson[key] === 'string' ? updatedJson[key] : JSON.stringify(updatedJson[key]);
            }
            return prisma.ideaSection.update({
                where: { id: section.id },
                data: { content: newContent }
            });
        });
        await prisma.$transaction(txs);

        const updatedIdea = await prisma.idea.findUnique({
            where: { id: req.params.id as string },
            include: {
                sections: { orderBy: { orderIndex: 'asc' } },
                tags: true,
                revisions: { orderBy: { createdAt: 'desc' }, take: 10 }
            }
        });
        res.json(updatedIdea);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// ─── EDIT IDEA TITLE/PROBLEM ──────────────────────────────
router.put('/:id', authMiddleware, async (req, res) => {
    const { title, problem } = req.body;
    try {
        const idea = await prisma.idea.update({
            where: { id: req.params.id as string },
            data: { title, problem }
        });
        res.json(idea);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ─── ARCHIVE IDEA ─────────────────────────────────────────
router.put('/:id/archive', authMiddleware, async (req, res) => {
    try {
        const idea = await prisma.idea.update({
            where: { id: req.params.id as string },
            data: { archived: !((await prisma.idea.findUnique({ where: { id: req.params.id as string } }))?.archived) }
        });
        res.json(idea);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ─── DELETE IDEA ──────────────────────────────────────────
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await prisma.idea.delete({ where: { id: req.params.id as string } });
        res.json({ msg: 'Idea deleted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// ─── PRE-MORTEM ───────────────────────────────────────────
router.get('/:id/premortem', authMiddleware, async (req, res) => {
    try {
        const idea = await prisma.idea.findUnique({
            where: { id: req.params.id as string },
            include: { sections: true }
        });
        if (!idea) return res.status(404).json({ msg: 'Idea not found' });
        const premortem = await generatePreMortem(idea);
        res.json(premortem);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to generate pre-mortem' });
    }
});

// ─── CONTRADICTIONS ───────────────────────────────────────
router.get('/:id/contradictions', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    try {
        const idea = await prisma.idea.findUnique({
            where: { id: req.params.id as string },
            include: { sections: true }
        });
        if (!idea) return res.status(404).json({ msg: 'Idea not found' });

        const existingIdeas = await prisma.idea.findMany({
            where: { userId, id: { not: idea.id }, archived: false },
            select: { id: true, title: true, problem: true },
            take: 20
        });
        const contradictions = await detectContradictions(idea, existingIdeas);
        res.json(contradictions);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to detect contradictions' });
    }
});

// ─── VAULT CHAT ───────────────────────────────────────────
router.post('/vault/chat', authMiddleware, async (req, res) => {
    const userId = (req as any).user.id;
    const { message } = req.body;
    try {
        const ideas = await prisma.idea.findMany({
            where: { userId, archived: false },
            select: { id: true, title: true, type: true, subType: true, problem: true },
            orderBy: { updatedAt: 'desc' },
            take: 50
        });
        const result = await vaultChat(message, ideas);
        res.json(result);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Vault chat failed' });
    }
});

export default router;
