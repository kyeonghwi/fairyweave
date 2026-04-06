import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateRouter } from './routes/generate';
import { sweebookRouter } from './routes/sweetbook';
import { webhookRouter } from './routes/webhook';
import { initTemplates } from './services/sweebookClient';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());

// Preserve raw body for webhook signature verification, then parse JSON
app.use(express.json({
  limit: '50mb',
  verify: (req, _res, buf) => {
    (req as express.Request & { rawBody?: string }).rawBody = buf.toString();
  },
}));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', generateRouter);
app.use('/api', sweebookRouter);
app.use('/api', webhookRouter);

async function start() {
  await initTemplates();
  app.listen(PORT, () => {
    // intentionally silent — check health endpoint at /health
  });
}

start().catch((err) => {
  console.error('[startup] Failed:', err);
  process.exit(1);
});

export default app;
