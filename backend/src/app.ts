import express from 'express';
import type { Application } from 'express';
import health from './routes/health.js';

const app: Application = express();

app.use(express.json());

app.use("/", health);
app.use("/health", health);

export default app;
