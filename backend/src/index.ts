import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import authRoutes from './routes/auth';
import ideasRoutes from './routes/ideas';
import learningRoutes from './routes/learning';
import blocksRoutes from './routes/blocks';
import dashboardRoutes from './routes/dashboard';
import questionsRoutes from './routes/questions';
import notesRouter from './routes/notes';
import notesAIRouter from './routes/notesAI';
import domainsRouter from './routes/domains';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(helmet());
app.use(cors());
app.use(express.json());

// Health check — placed before all routes so keep-alive pings always succeed
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/ideas', ideasRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/blocks', blocksRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/notes', notesRouter);
app.use('/api/notes', notesAIRouter);
app.use('/api/domains', domainsRouter);

app.listen(PORT, () => {
    console.log(`CognitiveOS Backend running on port ${PORT}`);
});
