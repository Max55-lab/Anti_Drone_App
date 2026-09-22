require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { router: authRouter } = require('./routes/auth');
const detectionsRouter = require('./routes/detections');

const app = express();
app.use(helmet());

// U produkciji ograniči CORS na tvoj stvarni app domen umjesto na sve (*).
// Postavi ALLOWED_ORIGIN u .env (npr. https://tvoj-domen.com ili
// capacitor://localhost za mobilnu app).
const allowedOrigin = process.env.ALLOWED_ORIGIN || '*';
app.use(cors({ origin: allowedOrigin }));
app.use(express.json({ limit: '100kb' }));

app.get('/health', (req, res) => res.json({ ok: true, service: 'nadstresnica-backend' }));

app.use('/api/auth', authRouter);
app.use('/api/detections', detectionsRouter);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Nadstrešnica backend running on port ${PORT}`);
});
