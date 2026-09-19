import sqlite3 from 'sqlite3';
import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { config } from './config.js';

sqlite3.verbose();

// The database is opened at import time, so ensure its directory exists first
// (fresh clones and ephemeral hosting filesystems have no data/ directory).
mkdirSync(dirname(resolve(config.databasePath)), { recursive: true });

const db = new sqlite3.Database(config.databasePath);

export function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

export function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

export function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

export function initDb() {
  const schema = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'DJ',
      status TEXT NOT NULL DEFAULT 'PENDING',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS djs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      logo TEXT,
      bio TEXT,
      tagline TEXT,
      location TEXT,
      social_links TEXT,
      momo_number TEXT,
      momo_ussd TEXT,
      momo_account_name TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dj_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      venue TEXT,
      event_date TEXT,
      event_code TEXT NOT NULL UNIQUE,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(dj_id) REFERENCES djs(id)
    );

    CREATE TABLE IF NOT EXISTS song_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dj_id INTEGER NOT NULL,
      event_id INTEGER,
      song_name TEXT NOT NULL,
      artist_name TEXT,
      status TEXT NOT NULL DEFAULT 'NEW',
      requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      played_at TEXT,
      rejected_at TEXT,
      FOREIGN KEY(dj_id) REFERENCES djs(id),
      FOREIGN KEY(event_id) REFERENCES events(id)
    );

    CREATE TABLE IF NOT EXISTS tips (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dj_id INTEGER NOT NULL,
      event_id INTEGER,
      amount REAL,
      currency TEXT NOT NULL DEFAULT 'RWF',
      payment_status TEXT NOT NULL DEFAULT 'PENDING',
      transaction_reference TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(dj_id) REFERENCES djs(id),
      FOREIGN KEY(event_id) REFERENCES events(id)
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dj_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT,
      content TEXT,
      featured_image TEXT,
      category TEXT,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(dj_id) REFERENCES djs(id)
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS booking_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dj_id INTEGER,
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      event_type TEXT,
      event_date TEXT,
      message TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(dj_id) REFERENCES djs(id)
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      amount REAL,
      currency TEXT NOT NULL DEFAULT 'RWF',
      phone TEXT,
      transaction_reference TEXT,
      payment_code TEXT,
      status TEXT NOT NULL DEFAULT 'SUBMITTED',
      submitted_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      verified_at TEXT,
      verified_by INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payment_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL,
      amount REAL,
      currency TEXT NOT NULL DEFAULT 'RWF',
      status TEXT NOT NULL DEFAULT 'UNUSED',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER NOT NULL,
      used_at TEXT,
      used_by INTEGER,
      FOREIGN KEY(user_id) REFERENCES users(id),
      FOREIGN KEY(created_by) REFERENCES users(id)
    );
  `;

  return new Promise((resolve, reject) => {
    db.exec(schema, async (err) => {
      if (err) return reject(err);
      try {
        // Migration for existing databases created before the multi-DJ update.
        const cols = await all('PRAGMA table_info(users)');
        if (!cols.some((c) => c.name === 'status')) {
          await run("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'PENDING'");
        }
        const djCols = await all('PRAGMA table_info(djs)');
        if (!djCols.some((c) => c.name === 'momo_number')) {
          await run('ALTER TABLE djs ADD COLUMN momo_number TEXT');
        }
        if (!djCols.some((c) => c.name === 'momo_ussd')) {
          await run('ALTER TABLE djs ADD COLUMN momo_ussd TEXT');
        }
        if (!djCols.some((c) => c.name === 'momo_account_name')) {
          await run('ALTER TABLE djs ADD COLUMN momo_account_name TEXT');
        }
        const bookingCols = await all('PRAGMA table_info(booking_messages)');
        if (!bookingCols.some((c) => c.name === 'dj_id')) {
          await run('ALTER TABLE booking_messages ADD COLUMN dj_id INTEGER');
        }
        const userCols = await all('PRAGMA table_info(users)');
        if (!userCols.some((c) => c.name === 'phone')) {
          await run('ALTER TABLE users ADD COLUMN phone TEXT');
        }
        const subCols = await all('PRAGMA table_info(subscriptions)');
        if (!subCols.some((c) => c.name === 'payment_code')) {
          await run('ALTER TABLE subscriptions ADD COLUMN payment_code TEXT');
        }
        resolve();
      } catch (migrationError) {
        reject(migrationError);
      }
    });
  });
}

export default db;
