import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../middlewares/auth';
import { structureIdea, editIdeaWithAI } from '../services/ai';

const router = express.Router();
const prisma = new PrismaClient();

router.post('/dump', authMiddleware, async (req, res) => {
    const { text, type = 'Work' } = req.body;
    try {
        const aiMined = await structureIdea(text, type);
        if (!aiMined) return res.status(500).json({ error: 'AI structuring failed' });

        const newIdea = await prisma.idea.create({
            data: {
                title: aiMined.title,
                problem: aiMined.problem,
                type: type,
                sections: {
                    create: [
                        { sectionName: 'Target Users', content: aiMined.target_users, orderIndex: 0 },
                        { sectionName: 'Core Solution', content: aiMined.core_solution, orderIndex: 1 },
                        { sectionName: 'Key Features', content: JSON.stringify(aiMined.key_features), orderIndex: 2 },
                        { sectionName: 'Business Model', content: JSON.stringify(aiMined.business_model), orderIndex: 3 },
                        { sectionName: 'Risks', content: JSON.stringify(aiMined.risks), orderIndex: 4 },
                        { sectionName: 'Open Questions', content: JSON.stringify(aiMined.open_questions), orderIndex: 5 },
                        ...(type === 'Personal' && aiMined.ai_suggestions ? [{ sectionName: 'AI Suggestions', content: JSON.stringify(aiMined.ai_suggestions), orderIndex: 6 }] : []),
                    ]
                }
            },
            include: { sections: true }
        });
        res.json(newIdea);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});

router.get('/', authMiddleware, async (req, res) => {
    try {
        const ideas = await prisma.idea.findMany({ orderBy: { createdAt: 'desc' } });
        res.json(ideas);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.get('/:id', authMiddleware, async (req, res) => {
    try {
        const idea = await prisma.idea.findUnique({
            where: { id: req.params.id as string },
            include: { sections: { orderBy: { orderIndex: 'asc' } } }
        });
        if (!idea) return res.status(404).json({ msg: 'Idea not found' });
        res.json(idea);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

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

router.put('/:id/ai-edit', authMiddleware, async (req, res) => {
    const { instructions } = req.body;
    try {
        const idea = await prisma.idea.findUnique({
            where: { id: req.params.id as string },
            include: { sections: { orderBy: { orderIndex: 'asc' } } }
        });
        if (!idea) return res.status(404).json({ msg: 'Idea not found' });

        // Build current JSON structure to send to AI
        const currentJson: any = {
            title: idea.title,
            problem: idea.problem,
            target_users: idea.sections.find(s => s.sectionName === 'Target Users')?.content || "",
            core_solution: idea.sections.find(s => s.sectionName === 'Core Solution')?.content || "",
            key_features: JSON.parse(idea.sections.find(s => s.sectionName === 'Key Features')?.content || "[]"),
            business_model: JSON.parse(idea.sections.find(s => s.sectionName === 'Business Model')?.content || "[]"),
            risks: JSON.parse(idea.sections.find(s => s.sectionName === 'Risks')?.content || "[]"),
            open_questions: JSON.parse(idea.sections.find(s => s.sectionName === 'Open Questions')?.content || "[]"),
        };
        if (idea.type === 'Personal') {
            currentJson.ai_suggestions = JSON.parse(idea.sections.find(s => s.sectionName === 'AI Suggestions')?.content || "[]");
        }

        const updatedJson = await editIdeaWithAI(currentJson, instructions);
        if (!updatedJson) return res.status(500).json({ error: 'AI editing failed' });

        // Update main idea
        await prisma.idea.update({
            where: { id: idea.id },
            data: {
                title: updatedJson.title,
                problem: updatedJson.problem,
            }
        });

        // Update sections
        const txs = idea.sections.map(section => {
            let newContent = section.content;
            switch (section.sectionName) {
                case 'Target Users': newContent = updatedJson.target_users || newContent; break;
                case 'Core Solution': newContent = updatedJson.core_solution || newContent; break;
                case 'Key Features': newContent = updatedJson.key_features ? JSON.stringify(updatedJson.key_features) : newContent; break;
                case 'Business Model': newContent = updatedJson.business_model ? JSON.stringify(updatedJson.business_model) : newContent; break;
                case 'Risks': newContent = updatedJson.risks ? JSON.stringify(updatedJson.risks) : newContent; break;
                case 'Open Questions': newContent = updatedJson.open_questions ? JSON.stringify(updatedJson.open_questions) : newContent; break;
                case 'AI Suggestions': newContent = updatedJson.ai_suggestions ? JSON.stringify(updatedJson.ai_suggestions) : newContent; break;
            }
            return prisma.ideaSection.update({
                where: { id: section.id },
                data: { content: newContent }
            });
        });

        await prisma.$transaction(txs);

        const updatedIdea = await prisma.idea.findUnique({
            where: { id: req.params.id as string },
            include: { sections: { orderBy: { orderIndex: 'asc' } } }
        });

        res.json(updatedIdea);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// Edit idea title/problem
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

// Delete idea
router.delete('/:id', authMiddleware, async (req, res) => {
    try {
        await prisma.idea.delete({
            where: { id: req.params.id as string }
        });
        res.json({ msg: 'Idea deleted' });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

export default router;
