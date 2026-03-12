import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/auth';
import ideasRoutes from './routes/ideas';
import learningRoutes from './routes/learning';
import blocksRoutes from './routes/blocks';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/ideas', ideasRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/blocks', blocksRoutes);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Temporary diagnostic endpoint - remove after debugging
app.get('/api/debug/db', async (req, res) => {
    const prisma = new PrismaClient();
    try {
        await prisma.$connect();
        const userCount = await prisma.user.count();
        res.json({ 
            status: 'connected', 
            userCount,
            dbUrl: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@') : 'NOT SET'
        });
    } catch (error: any) {
        res.status(500).json({ 
            status: 'error',
            message: error.message,
            code: error.code,
            dbUrl: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@') : 'NOT SET'
        });
    } finally {
        await prisma.$disconnect();
    }
});

app.listen(PORT, () => {
    console.log(`CognitiveOS Backend running on port ${PORT}`);
});
