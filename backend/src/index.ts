import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { generateRouter } from './routes/generate';
import { sweebookRouter } from './routes/sweetbook';
import { initTemplates } from './services/sweebookClient';
import { initDb } from './services/db';

dotenv.config();

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', generateRouter);
app.use('/api', sweebookRouter);

async function start() {
  initDb();
  await initTemplates();
  const server = app.listen(PORT, () => {
    // intentionally silent — check health endpoint at /health
  });

  // Prevent ECONNRESET when proxies reuse keep-alive connections.
  // Node.js default keepAliveTimeout (5s) causes the server to close idle
  // keep-alive sockets, which looks like a socket hang-up to upstream proxies.
  server.keepAliveTimeout = 61000;
  server.headersTimeout = 65000;
}

start().catch((err) => {
  console.error('[startup] Failed:', err);
  process.exit(1);
});

export default app;
