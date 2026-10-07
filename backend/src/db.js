import sqlite3 from 'sqlite3';
import pg from 'pg';
import { mkdirSync } from 'fs';
import { dirname, resolve } from 'path';
import { config } from './config.js';

let db, usePg;

function toPgParam(i) {
  return `$${i}`;
}

const isPg = Boolean(config.databaseUrl);

if (isPg) {
  usePg = true;
  db = new pg.Pool({
    connectionString: config.databaseUrl,
    ssl: config.databaseUrl.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
    max: 10,
  });
} else {
  usePg = false;
  sqlite3.verbose();
  mkdirSync(dirname(resolve(config.databasePath)), { recursive: true });
  db = new sqlite3.Database(config.databasePath);
}

export function getParamCount(sqlSqlite) {
  const m = sqlSqlite.match(/\?/g);
  return m ? m.length : 0;
}

function convertSql(sql) {
  if (!usePg) return sql;
  let idx = 0;
  return sql.replace(/\?/g, () => {
    idx += 1;
    return `$${idx}`;
  });
}

export function run(sql, params = []) {
  const s = convertSql(sql);
  const p = Array.isArray(params) ? params : [params];
  if (!usePg) {
    return new Promise((resolve, reject) => {
      db.run(s, p, function (err) {
        if (err) return reject(err);
        resolve({ id: this.lastID, changes: this.changes });
      });
    });
  } else {
    return new Promise((resolve, reject) => {
      db.query(s + ' RETURNING *', p, (err, result) => {
        if (err) return reject(err);
        const row = result && result.rows && result.rows[0];
        resolve({
          id: row ? row.id : undefined,
          changes: result && result.rowCount !== undefined ? result.rowCount : 1,
          row,
        });
      });
    });
  }
}

export function get(sql, params = []) {
  const s = convertSql(sql);
  const p = Array.isArray(params) ? params : [params];
  if (!usePg) {
    return new Promise((resolve, reject) => {
      db.get(s, p, (err, row) => {
        if (err) return reject(err);
        resolve(row);
      });
    });
  } else {
    return new Promise((resolve, reject) => {
      db.query(s, p, (err, result) => {
        if (err) return reject(err);
        resolve(result && result.rows && result.rows[0]);
      });
    });
  }
}

export function all(sql, params = []) {
  const s = convertSql(sql);
  const p = Array.isArray(params) ? params : [params];
  if (!usePg) {
    return new Promise((resolve, reject) => {
      db.all(s, p, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  } else {
    return new Promise((resolve, reject) => {
      db.query(s, p, (err, result) => {
        if (err) return reject(err);
        resolve(result && result.rows);
      });
    });
  }
}

async function pgExec(sql) {
  try {
    await db.query(sql);
  } catch (e) {
    throw e;
  }
}

const PG_TYPE_MAP = { TEXT: 'text', REAL: 'real', INTEGER: 'integer', SERIAL: 'integer' };

// Reads the expected columns straight out of the schema string so this list can
// never drift away from CREATE TABLE again.
function parsePgSchema(schemaSql) {
  const expected = [];
  const statements = schemaSql.split(';').map((s) => s.trim()).filter(Boolean);
  for (const statement of statements) {
    const match = statement.match(/^CREATE TABLE IF NOT EXISTS (\w+)\s*\(([\s\S]*)\)\s*$/i);
    if (!match) continue;
    const table = match[1];
    let depth = 0;
    let buffer = '';
    for (const ch of match[2]) {
      if (ch === ',' && depth === 0) {
        if (buffer.trim()) expected.push({ table, definition: buffer.trim() });
        buffer = '';
        continue;
      }
      if (ch === '(') depth += 1;
      else if (ch === ')') depth -= 1;
      buffer += ch;
    }
    if (buffer.trim()) expected.push({ table, definition: buffer.trim() });
  }
  return expected;
}

function castTo(column, fromType, toType) {
  if (toType === 'text') {
    if (fromType === 'timestamp with time zone') return `to_char(${column} AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;
    if (fromType === 'timestamp without time zone') return `to_char(${column}, 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')`;
    if (fromType === 'date') return `to_char(${column}, 'YYYY-MM-DD')`;
    return `CAST(${column} AS text)`;
  }
  if (toType === 'real') return fromType === 'boolean' ? `CASE WHEN ${column} THEN 1 ELSE 0 END` : `CAST(${column} AS real)`;
  return `CAST(${column} AS integer)`;
}

// Tables created by an older version of this file are never touched again by
// CREATE TABLE IF NOT EXISTS, so production can hold columns the current code
// no longer understands (timestamps instead of TEXT, numerics instead of REAL).
// This brings them back to the declared types on every boot. Each change is its
// own statement, and a failure is logged instead of blocking startup.
async function alignPgSchema(schemaSql) {
  const expected = parsePgSchema(schemaSql);
  if (!expected.length) return;

  const actual = await all(
    "SELECT table_name, column_name, data_type FROM information_schema.columns WHERE table_schema = 'public'"
  );
  const actualTypes = new Map(actual.map((row) => [`${row.table_name}.${row.column_name}`, row.data_type]));

  for (const { table, definition } of expected) {
    const header = definition.match(/^(\w+)\s+(\w+)/);
    if (!header) continue;
    const column = header[1];
    const wanted = PG_TYPE_MAP[header[2].toUpperCase()];
    if (!wanted) continue;
    const key = `${table}.${column}`;
    const current = actualTypes.get(key);
    const defaultExpr = (definition.match(/\bDEFAULT\s+([\s\S]+)$/i) || [])[1];

    if (!current) {
      if (column === 'id') continue;
      try {
        await pgExec(`ALTER TABLE ${table} ADD COLUMN IF NOT EXISTS ${definition}`);
        console.log(`[schema] added ${key}`);
      } catch (e) {
        console.error(`[schema] could not add ${key}: ${e.message}`);
      }
      continue;
    }

    if (current === wanted) continue;

    try {
      await pgExec(`ALTER TABLE ${table} ALTER COLUMN ${column} DROP DEFAULT`);
      await pgExec(`ALTER TABLE ${table} ALTER COLUMN ${column} TYPE ${wanted} USING (${castTo(column, current, wanted)})`);
      if (defaultExpr) await pgExec(`ALTER TABLE ${table} ALTER COLUMN ${column} SET DEFAULT ${defaultExpr.trim()}`);
      console.log(`[schema] aligned ${key}: ${current} -> ${wanted}`);
    } catch (e) {
      console.error(`[schema] could not align ${key}: ${e.message}`);
    }
  }
}

export function initDb() {
  const schemaSqlite = `
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'DJ',
      status TEXT NOT NULL DEFAULT 'PENDING',
      phone TEXT,
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
      period_start TEXT,
      period_end TEXT,
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

  const schemaPg = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'DJ',
      status TEXT NOT NULL DEFAULT 'PENDING',
      phone TEXT,
      created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
      updated_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
    );
    CREATE TABLE IF NOT EXISTS djs (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL UNIQUE REFERENCES users(id),
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
      created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
      updated_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
    );
    CREATE TABLE IF NOT EXISTS events (
      id SERIAL PRIMARY KEY,
      dj_id INTEGER NOT NULL REFERENCES djs(id),
      name TEXT NOT NULL,
      venue TEXT,
      event_date TEXT,
      event_code TEXT NOT NULL UNIQUE,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
      updated_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
    );
    CREATE TABLE IF NOT EXISTS song_requests (
      id SERIAL PRIMARY KEY,
      dj_id INTEGER NOT NULL REFERENCES djs(id),
      event_id INTEGER REFERENCES events(id),
      song_name TEXT NOT NULL,
      artist_name TEXT,
      status TEXT NOT NULL DEFAULT 'NEW',
      requested_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
      played_at TEXT,
      rejected_at TEXT
    );
    CREATE TABLE IF NOT EXISTS tips (
      id SERIAL PRIMARY KEY,
      dj_id INTEGER NOT NULL REFERENCES djs(id),
      event_id INTEGER REFERENCES events(id),
      amount REAL,
      currency TEXT NOT NULL DEFAULT 'RWF',
      payment_status TEXT NOT NULL DEFAULT 'PENDING',
      transaction_reference TEXT,
      created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
    );
    CREATE TABLE IF NOT EXISTS blog_posts (
      id SERIAL PRIMARY KEY,
      dj_id INTEGER NOT NULL REFERENCES djs(id),
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      excerpt TEXT,
      content TEXT,
      featured_image TEXT,
      category TEXT,
      status TEXT NOT NULL DEFAULT 'DRAFT',
      published_at TEXT,
      created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
      updated_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
    );
    CREATE TABLE IF NOT EXISTS app_settings (
      id SERIAL PRIMARY KEY,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
    );
    CREATE TABLE IF NOT EXISTS booking_messages (
      id SERIAL PRIMARY KEY,
      dj_id INTEGER REFERENCES djs(id),
      name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT,
      event_type TEXT,
      event_date TEXT,
      message TEXT,
      created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'))
    );
    CREATE TABLE IF NOT EXISTS subscriptions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL REFERENCES users(id),
      amount REAL,
      currency TEXT NOT NULL DEFAULT 'RWF',
      phone TEXT,
      transaction_reference TEXT,
      payment_code TEXT,
      status TEXT NOT NULL DEFAULT 'SUBMITTED',
      period_start TEXT,
      period_end TEXT,
      submitted_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
      verified_at TEXT,
      verified_by INTEGER
    );
    CREATE TABLE IF NOT EXISTS payment_codes (
      id SERIAL PRIMARY KEY,
      code TEXT NOT NULL UNIQUE,
      user_id INTEGER NOT NULL REFERENCES users(id),
      amount REAL,
      currency TEXT NOT NULL DEFAULT 'RWF',
      status TEXT NOT NULL DEFAULT 'UNUSED',
      created_at TEXT NOT NULL DEFAULT (to_char(CURRENT_TIMESTAMP AT TIME ZONE 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"')),
      created_by INTEGER NOT NULL REFERENCES users(id),
      used_at TEXT,
      used_by INTEGER REFERENCES users(id)
    );
  `;

  if (!usePg) {
    return new Promise((resolve, reject) => {
      db.exec(schemaSqlite, async (err) => {
        if (err) return reject(err);
        try {
          const cols = await all('PRAGMA table_info(users)');
          if (!cols.some((c) => c.name === 'status')) await run("ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'PENDING'");
          if (!cols.some((c) => c.name === 'phone')) await run('ALTER TABLE users ADD COLUMN phone TEXT');
          const djCols = await all('PRAGMA table_info(djs)');
          if (!djCols.some((c) => c.name === 'momo_number')) await run('ALTER TABLE djs ADD COLUMN momo_number TEXT');
          if (!djCols.some((c) => c.name === 'momo_ussd')) await run('ALTER TABLE djs ADD COLUMN momo_ussd TEXT');
          if (!djCols.some((c) => c.name === 'momo_account_name')) await run('ALTER TABLE djs ADD COLUMN momo_account_name TEXT');
          const bookingCols = await all('PRAGMA table_info(booking_messages)');
          if (!bookingCols.some((c) => c.name === 'dj_id')) await run('ALTER TABLE booking_messages ADD COLUMN dj_id INTEGER');
          const subCols = await all('PRAGMA table_info(subscriptions)');
          if (!subCols.some((c) => c.name === 'payment_code')) await run('ALTER TABLE subscriptions ADD COLUMN payment_code TEXT');
          if (!subCols.some((c) => c.name === 'period_start')) await run('ALTER TABLE subscriptions ADD COLUMN period_start TEXT');
          if (!subCols.some((c) => c.name === 'period_end')) await run('ALTER TABLE subscriptions ADD COLUMN period_end TEXT');
          resolve();
        } catch (e) {
          reject(e);
        }
      });
    });
  } else {
    return (async () => {
      const statements = schemaPg.split(';').map((s) => s.trim()).filter(Boolean);
      for (const s of statements) {
        await pgExec(s + ';');
      }
      const hasUserPhone = await get(
        "SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='phone'",
        []
      );
      if (!hasUserPhone) await pgExec("ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT");
      const hasDjMomo = await get(
        "SELECT 1 FROM information_schema.columns WHERE table_name='djs' AND column_name='momo_number'",
        []
      );
      if (!hasDjMomo) await pgExec("ALTER TABLE djs ADD COLUMN IF NOT EXISTS momo_number TEXT");
      const hasDjUssd = await get(
        "SELECT 1 FROM information_schema.columns WHERE table_name='djs' AND column_name='momo_ussd'",
        []
      );
      if (!hasDjUssd) await pgExec("ALTER TABLE djs ADD COLUMN IF NOT EXISTS momo_ussd TEXT");
      const hasDjName = await get(
        "SELECT 1 FROM information_schema.columns WHERE table_name='djs' AND column_name='momo_account_name'",
        []
      );
      if (!hasDjName) await pgExec("ALTER TABLE djs ADD COLUMN IF NOT EXISTS momo_account_name TEXT");
      const hasBookDj = await get(
        "SELECT 1 FROM information_schema.columns WHERE table_name='booking_messages' AND column_name='dj_id'",
        []
      );
      if (!hasBookDj) await pgExec("ALTER TABLE booking_messages ADD COLUMN IF NOT EXISTS dj_id INTEGER");
      const hasSubCode = await get(
        "SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='payment_code'",
        []
      );
      if (!hasSubCode) await pgExec("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS payment_code TEXT");
      const hasSubStart = await get(
        "SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='period_start'",
        []
      );
      if (!hasSubStart) await pgExec("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS period_start TEXT");
      const hasSubEnd = await get(
        "SELECT 1 FROM information_schema.columns WHERE table_name='subscriptions' AND column_name='period_end'",
        []
      );
      if (!hasSubEnd) await pgExec("ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS period_end TEXT");
      await alignPgSchema(schemaPg);
    })();
  }
}

export default db;
