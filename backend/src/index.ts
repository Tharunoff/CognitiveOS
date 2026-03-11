import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

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

app.listen(PORT, () => {
    console.log(`CognitiveOS Backend running on port ${PORT}`);
});
