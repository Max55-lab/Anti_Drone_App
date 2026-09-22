const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, '..', 'nadstresnica.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    zone_radius_m INTEGER DEFAULT 150,
    warning_threshold_m INTEGER DEFAULT 5,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS intrusions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    contact_label TEXT,
    manufacturer TEXT,
    model TEXT,
    remote_id TEXT,
    altitude_m INTEGER,
    latitude REAL,
    longitude REAL,
    detected_at TEXT DEFAULT (datetime('now')),
    reported_to_authorities INTEGER DEFAULT 0,
    reported_at TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

module.exports = db;
