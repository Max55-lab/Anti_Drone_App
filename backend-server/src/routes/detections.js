const express = require('express');
const db = require('../db');
const { authMiddleware } = require('./auth');

const router = express.Router();
router.use(authMiddleware);

// NOTE ON SCOPE: every endpoint here is detection, logging, and notification
// only. Nothing in this service issues commands to a drone, jams any signal,
// or otherwise interacts with third-party aircraft. It records what a
// connected RF/Remote ID receiver reports and helps the account holder get
// that information to themselves and, optionally, to authorities.

// Get the user's current zone/threshold settings
router.get('/settings', (req, res) => {
  const user = db.prepare('SELECT zone_radius_m, warning_threshold_m FROM users WHERE id = ?').get(req.userId);
  res.json(user);
});

router.put('/settings', (req, res) => {
  const { zone_radius_m, warning_threshold_m } = req.body;
  if (warning_threshold_m !== undefined && (warning_threshold_m < 2 || warning_threshold_m > 10)) {
    return res.status(400).json({ error: 'Prag upozorenja mora biti između 2 i 10 metara.' });
  }
  db.prepare(
    'UPDATE users SET zone_radius_m = COALESCE(?, zone_radius_m), warning_threshold_m = COALESCE(?, warning_threshold_m) WHERE id = ?'
  ).run(zone_radius_m ?? null, warning_threshold_m ?? null, req.userId);
  res.json({ ok: true });
});

// Record a new detection/intrusion event (would be called by the paired
// hardware sensor once real RF/Remote ID hardware is wired in)
router.post('/intrusions', (req, res) => {
  const { contact_label, manufacturer, model, remote_id, altitude_m, latitude, longitude } = req.body;
  const result = db.prepare(`
    INSERT INTO intrusions (user_id, contact_label, manufacturer, model, remote_id, altitude_m, latitude, longitude)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(req.userId, contact_label, manufacturer, model, remote_id || null, altitude_m, latitude || null, longitude || null);

  res.status(201).json({ id: result.lastInsertRowid });
});

// List intrusion history for the logged-in user
router.get('/intrusions', (req, res) => {
  const rows = db.prepare(
    'SELECT * FROM intrusions WHERE user_id = ? ORDER BY detected_at DESC LIMIT 200'
  ).all(req.userId);
  res.json(rows);
});

// Mark an intrusion as forwarded to authorities. This only sets a status
// flag and timestamp in this user's own log — it does not contact any
// external agency by itself. Wiring this to a real police/military intake
// system requires that agency's own API and a formal data-sharing agreement;
// this endpoint is the hook point for that integration once it exists.
router.post('/intrusions/:id/notify-authorities', (req, res) => {
  const intrusion = db.prepare('SELECT * FROM intrusions WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!intrusion) return res.status(404).json({ error: 'Zapis nije pronađen.' });

  db.prepare(
    "UPDATE intrusions SET reported_to_authorities = 1, reported_at = datetime('now') WHERE id = ?"
  ).run(req.params.id);

  res.json({ ok: true, notified_at: new Date().toISOString() });
});

module.exports = router;
