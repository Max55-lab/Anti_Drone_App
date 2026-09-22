const express = require('express');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET nije podešen. Postavite ga u .env fajlu prije pokretanja servera.');
}

// Sprječava brute-force pogađanje lozinki: max 10 pokušaja po IP adresi u 15 minuta
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: 'Previše pokušaja. Pokušajte ponovo za 15 minuta.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', authLimiter, async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password || password.length < 8) {
    return res.status(400).json({ error: 'Ime, email i lozinka (min. 8 karaktera) su obavezni.' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) {
    return res.status(409).json({ error: 'Nalog sa ovim emailom već postoji.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = db.prepare(
    'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)'
  ).run(name, email.toLowerCase(), passwordHash);

  const token = jwt.sign({ userId: result.lastInsertRowid }, JWT_SECRET, { expiresIn: '30d' });
  res.status(201).json({
    token,
    user: { id: result.lastInsertRowid, name, email: email.toLowerCase() }
  });
});

router.post('/login', authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email i lozinka su obavezni.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email.toLowerCase());
  if (!user) {
    return res.status(401).json({ error: 'Pogrešan email ili lozinka.' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Pogrešan email ili lozinka.' });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
});

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Niste prijavljeni.' });
  }
  try {
    const payload = jwt.verify(header.slice(7), JWT_SECRET);
    req.userId = payload.userId;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Sesija je istekla, prijavite se ponovo.' });
  }
}

module.exports = { router, authMiddleware };
