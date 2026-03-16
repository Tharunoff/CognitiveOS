import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { authMiddleware } from '../middlewares/auth';
import { getGeminiKey } from '../utils/geminiKeyRotator';

const router = express.Router();

// POST /api/notes/polish — polish note content with AI
router.post('/polish', authMiddleware, async (req, res) => {
    const { content } = req.body;
    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Content is required' });
    }

    try {
        let apiKey: string;
        try {
            apiKey = await getGeminiKey();
        } catch (e) {
            const fallback = process.env.GEMINI_API_KEY;
            if (!fallback) throw new Error('No Gemini API key available.');
            apiKey = fallback;
        }

        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are a clean-up assistant for personal notes. The user has written a rough note and wants it polished.

Do the following:
1. Fix all spelling mistakes
2. Fix grammar errors
3. Improve sentence structure where it is unclear
4. Organise the content into short logical paragraphs if it is long
5. Do NOT change the meaning, remove information, or add new ideas
6. Do NOT make it formal or professional — keep the user's personal tone
7. Return only the cleaned note content as plain text, no explanations, no markdown, no extra commentary

Here is the note to polish:
${content}`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: 'application/json' },
        });

        if (response.text) {
            let cleanText = response.text.trim();
            if (cleanText.startsWith('```json')) cleanText = cleanText.replace(/^```json\s*/i, '');
            else if (cleanText.startsWith('```')) cleanText = cleanText.replace(/^```\s*/, '');
            if (cleanText.endsWith('```')) cleanText = cleanText.replace(/\s*```$/, '');

            try {
                const parsed = JSON.parse(cleanText);
                res.json({ polished: parsed.polished || cleanText });
            } catch {
                // If Gemini returned plain text instead of JSON
                res.json({ polished: cleanText });
            }
        } else {
            res.status(500).json({ error: 'Failed to polish note' });
        }
    } catch (err) {
        console.error('Polish error:', err);
        res.status(500).json({ error: 'Failed to polish note' });
    }
});

export default router;
