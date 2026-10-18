// OWNER: Celestin — shared file, say something in the group chat before changing it.
//
// The Express server. Registers every route file under /api and starts
// listening on port 3001. Vite proxies /api here during development, so the
// front end still runs on one port.
//
// Run it in its own terminal:   npm run server

import express from 'express';

import authRoutes from './routes/auth.routes.js';
import servicesRoutes from './routes/services.routes.js';
import queueRoutes from './routes/queue.routes.js';
import miscRoutes from './routes/misc.routes.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Parses a JSON request body into req.body. Without this, req.body is
// undefined on every POST and the cause is not obvious.
app.use(express.json());

// A quick way to check the server is alive: curl localhost:3001/api/health
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/queue', queueRoutes);
app.use('/api/users', miscRoutes);

// Anything under /api that no route matched.
app.use('/api', (req, res) => {
  res.status(404).json({ error: `No such endpoint: ${req.method} ${req.originalUrl}` });
});

// Catches a thrown error anywhere above so the server replies instead of
// dying. Invalid input should be handled in the modules, not reach this.
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
});

app.listen(PORT, () => {
  console.log(`QueueSmart API listening on http://localhost:${PORT}`);
});

export default app;
