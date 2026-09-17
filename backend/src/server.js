import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { mkdirSync } from 'fs';
import { dirname } from 'path';
import { Server } from 'socket.io';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import QRCode from 'qrcode';

import { config } from './config.js';
import { initDb, get, all, run } from './db.js';
import { seedDatabase } from './seed.js';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: config.allowedOrigins,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    credentials: true,
  },
});

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || config.allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error('Origin not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({ limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

const publicLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });
const adminLimiter = rateLimit({ windowMs: 60 * 1000, max: 60, standardHeaders: true, legacyHeaders: false });
app.use('/api', publicLimiter);

function generateToken(user) {
  return jwt.sign({ id: user.id, email: user.email, role: user.role, status: user.status }, config.jwtSecret, { expiresIn: '7d' });
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Session expired' });
  }
}

function requireAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return get('SELECT id, name, email, role, status FROM users WHERE id = ?', [req.user.id])
    .then((user) => {
      if (!user) return res.status(401).json({ error: 'Unauthorized' });
      req.dbUser = user;
      if (!['ADMIN', 'DJ'].includes(user.role) || user.status !== 'ACTIVE') {
        return res.status(403).json({ error: 'Your account needs approval before you can do this.' });
      }
      next();
    })
    .catch(next);
}

function requireSuperAdmin(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return get('SELECT id, name, email, role, status FROM users WHERE id = ?', [req.user.id])
    .then((user) => {
      if (!user || user.role !== 'SUPERADMIN' || user.status !== 'ACTIVE') {
        return res.status(403).json({ error: 'SuperAdmin access required' });
      }
      req.dbUser = user;
      next();
    })
    .catch(next);
}

async function getDjForUser(userId) {
  return await get('SELECT * FROM djs WHERE user_id = ?', [userId]);
}

async function getSettings() {
  const rows = await all('SELECT key, value FROM app_settings');
  const settings = {};
  for (const row of rows) settings[row.key] = row.value;
  return settings;
}

async function setSetting(key, value) {
  const existing = await get('SELECT id FROM app_settings WHERE key = ?', [key]);
  if (existing) {
    return await run(`UPDATE app_settings SET value = ?, updated_at = ? WHERE key = ?`, [value, new Date().toISOString(), key]);
  }
  return await run(`INSERT INTO app_settings (key, value) VALUES (?, ?)`, [key, value]);
}

function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'dj-platform-backend', uptime: process.uptime() });
});

/* ----------------------------- AUTH ----------------------------- */

app.post('/api/auth/login', adminLimiter, async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await get('SELECT * FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

  const dj = await getDjForUser(user.id);
  const token = generateToken(user);
  res.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status },
    dj: dj ? { id: dj.id, name: dj.name, slug: dj.slug, logo: dj.logo, tagline: dj.tagline } : null,
  });
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const user = await get('SELECT id, name, email, role, status FROM users WHERE id = ?', [req.user.id]);
  const dj = await getDjForUser(req.user.id);
  const subscription = user
    ? await get('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1', [user.id])
    : null;
  res.json({
    user,
    subscription,
    dj: dj ? { id: dj.id, name: dj.name, slug: dj.slug, logo: dj.logo, tagline: dj.tagline, location: dj.location, social_links: dj.social_links } : null,
  });
});

app.post('/api/auth/logout', (req, res) => {
  res.json({ success: true });
});

/* ----------------------------- REGISTRATION / PAYMENT ----------------------------- */

app.post('/api/auth/register', adminLimiter, asyncHandler(async (req, res) => {
  const { name, email, password, phone } = req.body || {};

  if (!name || typeof name !== 'string' || name.trim().length < 2) {
    return res.status(400).json({ error: 'Please enter your full name.' });
  }
  if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long.' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const exists = await get('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
  if (exists) {
    return res.status(409).json({ error: 'An account with this email already exists.' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await run(
    `INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)`,
    [name.trim(), normalizedEmail, passwordHash, 'DJ', 'PENDING']
  );

  const base = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'dj';
  let slug = base;
  for (let i = 1; ; i++) {
    const conflict = await get('SELECT id FROM djs WHERE slug = ?', [slug]);
    if (!conflict) break;
    slug = `${base}-${i}`;
  }

  await run(
    `INSERT INTO djs (user_id, name, slug, location, social_links) VALUES (?, ?, ?, ?, ?)`,
    [user.id, name.trim(), slug, null, JSON.stringify({})]
  );

  const dj = await getDjForUser(user.id);
  const token = generateToken({ id: user.id, email: normalizedEmail, role: 'DJ', status: 'PENDING' });
  res.status(201).json({
    success: true,
    token,
    user: { id: user.id, name: name.trim(), email: normalizedEmail, role: 'DJ', status: 'PENDING' },
    dj,
  });
}));

app.post('/api/dj/payment', authMiddleware, asyncHandler(async (req, res) => {
  const { reference, phone, amount } = req.body || {};
  const ref = String(reference || '').trim();
  if (ref.length < 4) {
    return res.status(400).json({ error: 'Please enter the transaction reference you received from MTN Mobile Money.' });
  }

  const me = await get('SELECT id, role FROM users WHERE id = ?', [req.user.id]);
  if (!me || !['DJ', 'ADMIN'].includes(me.role)) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  const existing = await get('SELECT id FROM subscriptions WHERE user_id = ? AND status = ?', [me.id, 'SUBMITTED']);
  if (existing) {
    await run(
      `UPDATE subscriptions SET transaction_reference = ?, phone = COALESCE(?, phone), amount = COALESCE(?, amount), submitted_at = ? WHERE id = ?`,
      [ref, phone || null, amount ? Number(amount) : null, new Date().toISOString(), existing.id]
    );
    const updated = await get('SELECT * FROM subscriptions WHERE id = ?', [existing.id]);
    return res.json({ subscription: updated });
  }

  const sub = await run(
    `INSERT INTO subscriptions (user_id, amount, currency, phone, transaction_reference, status) VALUES (?, ?, ?, ?, ?, ?)`,
    [me.id, amount ? Number(amount) : null, 'RWF', phone || null, ref, 'SUBMITTED']
  );
  const created = await get('SELECT * FROM subscriptions WHERE id = ?', [sub.id]);
  res.status(201).json({ subscription: created });
}));

app.get('/api/registration-info', asyncHandler(async (req, res) => {
  const settings = await getSettings();
  res.json({
    subscription_fee: Number(settings.subscription_fee || 5000),
    currency: settings.currency || 'RWF',
    mtn_momo_number: settings.mtn_momo_number || config.mtnMomoNumber,
    mtn_momo_ussd: settings.mtn_momo_ussd || config.mtnMomoUssd,
  });
}));

/* ----------------------------- PUBLIC DJ / WEBSITE ----------------------------- */

app.get('/api/djs/public', async (req, res) => {
  const djs = await all(
    `SELECT d.id, d.name, d.slug, d.logo, d.bio, d.tagline, d.location, d.social_links, d.created_at, u.status
     FROM djs d JOIN users u ON u.id = d.user_id
     WHERE u.role IN ('ADMIN', 'DJ') AND u.status = 'ACTIVE'
     ORDER BY d.created_at ASC`
  );
  for (const dj of djs) {
    if (dj.social_links) {
      try { dj.social_links = JSON.parse(dj.social_links); } catch { dj.social_links = {}; }
    } else {
      dj.social_links = {};
    }
    dj.events = await all(
      'SELECT id, name, venue, event_date, event_code FROM events WHERE dj_id = ? AND active = 1 ORDER BY created_at DESC',
      [dj.id]
    );
  }
  res.json({ djs });
});

app.get('/api/dj/public/:slug', async (req, res) => {
  const dj = await get(
    `SELECT d.*, u.role, u.status FROM djs d JOIN users u ON u.id = d.user_id WHERE d.slug = ?`,
    [req.params.slug]
  );
  if (!dj || !['ADMIN', 'DJ'].includes(dj.role) || dj.status !== 'ACTIVE') {
    return res.status(404).json({ error: 'DJ not found' });
  }
  const events = await all(
    `SELECT e.*, (SELECT COUNT(*) FROM song_requests WHERE event_id = e.id) AS request_count
     FROM events e WHERE e.dj_id = ? ORDER BY e.created_at DESC LIMIT 6`,
    [dj.id]
  );
  const posts = await all(
    `SELECT id, title, slug, excerpt, featured_image, category, published_at FROM blog_posts
     WHERE dj_id = ? AND status = 'PUBLISHED' ORDER BY published_at DESC LIMIT 3`,
    [dj.id]
  );
  const settings = await getSettings();
  res.json({ dj, events, posts, settings });
});

app.patch('/api/dj/profile', authMiddleware, requireAdmin, asyncHandler(async (req, res) => {
  const dj = await getDjForUser(req.user.id);
  if (!dj) return res.status(404).json({ error: 'DJ profile missing' });

  const { name, slug, logo, bio, tagline, location, social_links } = req.body || {};
  const updates = {};
  if (typeof name === 'string' && name.trim()) updates.name = name.trim();
  if (typeof slug === 'string' && slug.trim()) updates.slug = slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
  if (typeof logo === 'string') updates.logo = logo.trim();
  if (typeof bio === 'string') updates.bio = bio;
  if (typeof tagline === 'string') updates.tagline = tagline;
  if (typeof location === 'string') updates.location = location;
  if (typeof social_links === 'object' && social_links !== null) updates.social_links = JSON.stringify(social_links);

  const keys = Object.keys(updates);
  if (!keys.length) return res.status(400).json({ error: 'Nothing to update' });

  const setClause = keys.map((key) => `${key} = ?`).join(', ');
  await run(`UPDATE djs SET ${setClause}, updated_at = ? WHERE id = ?`, [...Object.values(updates), new Date().toISOString(), dj.id]);

  const updated = await get('SELECT * FROM djs WHERE id = ?', [dj.id]);
  io.emit('profile:updated', { id: updated.id, name: updated.name, slug: updated.slug, logo: updated.logo, tagline: updated.tagline, location: updated.location });
  res.json({ profile: updated });
}));

app.get('/api/dj/public', async (req, res) => {
  const dj = await get(
    `SELECT d.*, u.role, u.status FROM djs d JOIN users u ON u.id = d.user_id
     WHERE u.role IN ('ADMIN', 'DJ') AND u.status = 'ACTIVE' ORDER BY d.created_at ASC LIMIT 1`
  );
  if (!dj) return res.status(404).json({ error: 'DJ not found' });
  const events = await all(
    `SELECT e.*, (SELECT COUNT(*) FROM song_requests WHERE event_id = e.id) AS request_count
     FROM events e WHERE e.dj_id = ? ORDER BY e.created_at DESC LIMIT 6`,
    [dj.id]
  );
  const posts = await all(
    `SELECT id, title, slug, excerpt, featured_image, category, published_at FROM blog_posts
     WHERE dj_id = ? AND status = 'PUBLISHED' ORDER BY published_at DESC LIMIT 3`,
    [dj.id]
  );
  const settings = await getSettings();
  res.json({ dj, events, posts, settings });
});

/* ----------------------------- EVENTS ----------------------------- */

app.get('/api/events', authMiddleware, requireAdmin, async (req, res) => {
  const dj = await getDjForUser(req.user.id);
  const rows = await all(
    `SELECT e.*, (SELECT COUNT(*) FROM song_requests WHERE event_id = e.id) AS request_count
     FROM events e WHERE e.dj_id = ? ORDER BY e.created_at DESC`,
    [dj.id]
  );
  res.json({ events: rows });
});

app.get('/api/events/:id', authMiddleware, requireAdmin, async (req, res) => {
  const dj = await getDjForUser(req.user.id);
  const event = await get('SELECT * FROM events WHERE id = ? AND dj_id = ?', [req.params.id, dj.id]);
  if (!event) return res.status(404).json({ error: 'Event not found' });
  const requests = await all('SELECT * FROM song_requests WHERE event_id = ? ORDER BY requested_at DESC LIMIT 100', [event.id]);
  res.json({ event, requests });
});

app.post('/api/events', authMiddleware, requireAdmin, async (req, res) => {
  const { name, venue, event_date, event_code, active } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Event name is required' });

  const dj = await getDjForUser(req.user.id);
  if (!dj) return res.status(404).json({ error: 'DJ profile missing' });

  const code = (event_code || `${(name || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`).trim();

  const event = await run(
    `INSERT INTO events (dj_id, name, venue, event_date, event_code, active) VALUES (?, ?, ?, ?, ?, ?)`,
    [dj.id, name.trim(), venue || null, event_date || null, code, active === false ? 0 : 1]
  );

  const created = await get('SELECT * FROM events WHERE id = ?', [event.id]);
  io.emit('event:updated', created);
  res.status(201).json({ event: created });
});

app.patch('/api/events/:id', authMiddleware, requireAdmin, async (req, res) => {
  const dj = await getDjForUser(req.user.id);
  const event = await get('SELECT * FROM events WHERE id = ? AND dj_id = ?', [req.params.id, dj.id]);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const { name, venue, event_date, event_code, active } = req.body || {};
  const updates = {};
  if (typeof name === 'string' && name.trim()) updates.name = name.trim();
  if (typeof venue === 'string') updates.venue = venue;
  if (typeof event_date === 'string') updates.event_date = event_date;
  if (typeof event_code === 'string' && event_code.trim()) updates.event_code = event_code.trim();
  if (typeof active === 'boolean' || active === 0 || active === 1) updates.active = active ? 1 : 0;

  const keys = Object.keys(updates);
  if (!keys.length) return res.status(400).json({ error: 'Nothing to update' });

  const setClause = keys.map((key) => `${key} = ?`).join(', ');
  await run(`UPDATE events SET ${setClause}, updated_at = ? WHERE id = ?`, [...Object.values(updates), new Date().toISOString(), event.id]);

  const updated = await get('SELECT * FROM events WHERE id = ?', [event.id]);
  io.emit('event:updated', updated);
  res.json({ event: updated });
});

app.delete('/api/events/:id', authMiddleware, requireAdmin, async (req, res) => {
  const dj = await getDjForUser(req.user.id);
  const event = await get('SELECT * FROM events WHERE id = ? AND dj_id = ?', [req.params.id, dj.id]);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  await run('DELETE FROM song_requests WHERE event_id = ?', [event.id]);
  await run('DELETE FROM events WHERE id = ?', [event.id]);
  io.emit('event:updated', { id: event.id, deleted: true });
  res.json({ success: true });
});

app.get('/api/events/:id/qr', authMiddleware, requireAdmin, async (req, res) => {
  const dj = await getDjForUser(req.user.id);
  const event = await get('SELECT * FROM events WHERE id = ? AND dj_id = ?', [req.params.id, dj.id]);
  if (!event) return res.status(404).json({ error: 'Event not found' });

  const url = `${config.frontendUrl}/request/${dj.slug}?event=${encodeURIComponent(event.event_code)}`;
  try {
    const qr = await QRCode.toDataURL(url);
    res.json({ url, qr });
  } catch (error) {
    res.status(500).json({ error: 'QR code generation failed' });
  }
});

app.get('/api/dj/qr', authMiddleware, requireAdmin, async (req, res) => {
  const dj = await getDjForUser(req.user.id);
  const url = `${config.frontendUrl}/request/${dj.slug}`;
  try {
    const qr = await QRCode.toDataURL(url);
    res.json({ url, qr });
  } catch (error) {
    res.status(500).json({ error: 'QR code generation failed' });
  }
});

/* ----------------------------- REQUESTS ----------------------------- */

app.post('/api/requests', async (req, res) => {
  const { songName, artistName, eventCode, slug } = req.body || {};
  const song = (songName || '').trim();
  const artist = (artistName || '').trim();

  if (!song || song.length < 2 || song.length > 120) {
    return res.status(400).json({ error: 'Please enter a valid song name.' });
  }

  if (artist && artist.length > 120) {
    return res.status(400).json({ error: 'Artist name is too long.' });
  }

  const djSlug = String(slug || '').trim();
  const dj = djSlug
    ? await get('SELECT d.*, u.role, u.status FROM djs d JOIN users u ON u.id = d.user_id WHERE d.slug = ?', [djSlug])
    : await get(
        `SELECT d.*, u.role, u.status FROM djs d JOIN users u ON u.id = d.user_id
         WHERE u.role IN ('ADMIN', 'DJ') AND u.status = 'ACTIVE' ORDER BY d.created_at ASC LIMIT 1`
      );
  if (!dj || !['ADMIN', 'DJ'].includes(dj.role) || dj.status !== 'ACTIVE') {
    return res.status(404).json({ error: 'DJ profile not found.' });
  }

  const event = eventCode
    ? await get('SELECT * FROM events WHERE dj_id = ? AND event_code = ? AND active = 1', [dj.id, eventCode])
    : await get('SELECT * FROM events WHERE dj_id = ? AND active = 1 ORDER BY created_at DESC LIMIT 1', [dj.id]);

  if (!event) {
    return res.status(400).json({ error: 'This event is no longer accepting requests.' });
  }

  const request = await run(
    `INSERT INTO song_requests (dj_id, event_id, song_name, artist_name, status, requested_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [dj.id, event.id, song, artist || null, 'NEW', new Date().toISOString()]
  );

  const createdRequest = await get('SELECT * FROM song_requests WHERE id = ?', [request.id]);
  const payload = { ...createdRequest, event_name: event.name, djName: dj.name };
  io.to(`dj-${dj.id}`).emit('request:new', payload);
  io.to(`dj-${dj.id}-event-${event.id}`).emit('request:new', payload);
  io.emit('request:created', { request: createdRequest, djId: dj.id, eventId: event.id });

  res.status(201).json({ request: { ...createdRequest, event_name: event.name } });
});

app.get('/api/requests', authMiddleware, requireAdmin, async (req, res) => {
  const dj = await getDjForUser(req.user.id);
  const { status, eventId, search, date, limit = 50, offset = 0 } = req.query || {};

  const clauses = ['sr.dj_id = ?'];
  const params = [dj.id];

  if (status && ['NEW', 'PLAYED', 'REJECTED'].includes(status)) {
    clauses.push('sr.status = ?');
    params.push(status);
  }

  if (eventId && String(eventId) !== 'all') {
    clauses.push('sr.event_id = ?');
    params.push(Number(eventId));
  }

  if (search && String(search).trim()) {
    clauses.push('(sr.song_name LIKE ? OR sr.artist_name LIKE ?)');
    params.push(`%${String(search).trim()}%`, `%${String(search).trim()}%`);
  }

  if (date && String(date).trim()) {
    clauses.push(`substr(sr.requested_at, 1, 10) = ?`);
    params.push(String(date).trim());
  }

  const where = clauses.join(' AND ');
  const rows = await all(
    `SELECT sr.*, e.name AS event_name FROM song_requests sr
     LEFT JOIN events e ON e.id = sr.event_id
     WHERE ${where}
     ORDER BY sr.requested_at DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit) || 50, Number(offset) || 0]
  );

  const totalRow = await get(
    `SELECT COUNT(*) AS total FROM song_requests sr WHERE ${where}`,
    params
  );

  res.json({ requests: rows, total: totalRow ? totalRow.total : rows.length, limit: Number(limit), offset: Number(offset) });
});

app.patch('/api/requests/:id/status', authMiddleware, requireAdmin, async (req, res) => {
  const { status } = req.body || {};
  const validStatus = ['NEW', 'PLAYED', 'REJECTED'];
  if (!validStatus.includes(status)) return res.status(400).json({ error: 'Invalid status' });

  const dj = await getDjForUser(req.user.id);
  const row = await get('SELECT * FROM song_requests WHERE id = ? AND dj_id = ?', [req.params.id, dj.id]);
  if (!row) return res.status(404).json({ error: 'Request not found' });

  await run(
    `UPDATE song_requests SET status = ?, played_at = ?, rejected_at = ? WHERE id = ?`,
    [
      status,
      status === 'PLAYED' ? new Date().toISOString() : null,
      status === 'REJECTED' ? new Date().toISOString() : null,
      req.params.id,
    ]
  );

  const result = await get('SELECT * FROM song_requests WHERE id = ?', [req.params.id]);
  const event = await get('SELECT name FROM events WHERE id = ?', [result.event_id]);
  const payload = { ...result, event_name: event ? event.name : null };
  io.to(`dj-${dj.id}`).emit('request:updated', payload);
  io.emit('request:updated', payload);
  res.json({ request: payload });
});

app.delete('/api/requests/:id', authMiddleware, requireAdmin, async (req, res) => {
  const dj = await getDjForUser(req.user.id);
  const row = await get('SELECT * FROM song_requests WHERE id = ? AND dj_id = ?', [req.params.id, dj.id]);
  if (!row) return res.status(404).json({ error: 'Request not found' });

  await run('DELETE FROM song_requests WHERE id = ?', [row.id]);
  io.to(`dj-${dj.id}`).emit('request:deleted', { id: row.id });
  io.emit('request:deleted', { id: row.id });
  res.json({ success: true });
});

/* ----------------------------- ADMIN STATS ----------------------------- */

app.get('/api/admin/overview', authMiddleware, requireAdmin, async (req, res) => {
  const dj = await getDjForUser(req.user.id);
  const overview = await get(
    `SELECT
      COUNT(*) AS total_requests,
      COUNT(CASE WHEN status = 'NEW' THEN 1 END) AS pending,
      COUNT(CASE WHEN status = 'PLAYED' THEN 1 END) AS songs_played,
      COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) AS rejected,
      COUNT(CASE WHEN datetime(requested_at) >= datetime('now', 'localtime', '-1 day') THEN 1 END) AS requests_today
    FROM song_requests WHERE dj_id = ?`,
    [dj.id]
  );

  const activeEvent = await get('SELECT * FROM events WHERE dj_id = ? AND active = 1 ORDER BY created_at DESC LIMIT 1', [dj.id]);
  const activeRequests = activeEvent
    ? await get('SELECT COUNT(*) AS n FROM song_requests WHERE event_id = ?', [activeEvent.id])
    : { n: 0 };

  const recentCount = await get(
    `SELECT COUNT(*) AS n FROM song_requests WHERE dj_id = ? AND datetime(requested_at) >= datetime('now', 'localtime', '-7 days')`,
    [dj.id]
  );

  const popular = await all(
    `SELECT song_name, artist_name, COUNT(*) AS times FROM song_requests
     WHERE dj_id = ? GROUP BY song_name, artist_name ORDER BY times DESC LIMIT 5`,
    [dj.id]
  );

  res.json({
    overview: {
      ...overview,
      requests_this_event: activeRequests.n,
      requests_this_week: recentCount.n,
      active_event: activeEvent || null,
    },
    popular,
    dj,
  });
});

app.get('/api/admin/stats', authMiddleware, requireAdmin, async (req, res) => {
  const dj = await getDjForUser(req.user.id);
  const requests = await all(
    `SELECT sr.*, e.name AS event_name FROM song_requests sr
     LEFT JOIN events e ON e.id = sr.event_id
     WHERE sr.dj_id = ? ORDER BY sr.requested_at DESC LIMIT 100`,
    [dj.id]
  );
  const events = await all('SELECT * FROM events WHERE dj_id = ? ORDER BY created_at DESC', [dj.id]);
  res.json({ requests, events, dj });
});

app.get('/api/admin/bookings', authMiddleware, requireAdmin, async (req, res) => {
  const bookings = await all('SELECT * FROM booking_messages ORDER BY created_at DESC LIMIT 50');
  res.json({ bookings });
});

/* ----------------------------- SUPERADMIN ----------------------------- */

app.get('/api/super/stats', authMiddleware, requireSuperAdmin, asyncHandler(async (req, res) => {
  const counts = await get(
    `SELECT
       COUNT(*) AS total_djs,
       COUNT(CASE WHEN status = 'PENDING' THEN 1 END) AS pending,
       COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) AS active,
       COUNT(CASE WHEN status = 'REJECTED' THEN 1 END) AS rejected,
       COUNT(CASE WHEN status = 'SUSPENDED' THEN 1 END) AS suspended
     FROM users WHERE role IN ('ADMIN', 'DJ')`
  );
  const eventCount = await get('SELECT COUNT(*) AS n FROM events');
  const requestStats = await get(
    `SELECT
       COUNT(*) AS total_requests,
       COUNT(CASE WHEN datetime(requested_at) >= datetime('now', 'localtime', '-1 day') THEN 1 END) AS requests_today
     FROM song_requests`
  );
  const subStats = await get(
    `SELECT
       COUNT(*) AS subscriptions_total,
       COUNT(CASE WHEN status = 'VERIFIED' THEN 1 END) AS subscriptions_verified,
       COUNT(CASE WHEN status = 'SUBMITTED' THEN 1 END) AS subscriptions_submitted
     FROM subscriptions`
  );
  const bookingCount = await get('SELECT COUNT(*) AS n FROM booking_messages');
  res.json({
    ...counts,
    events_total: eventCount ? eventCount.n : 0,
    requests_total: requestStats ? requestStats.total_requests : 0,
    requests_today: requestStats ? requestStats.requests_today : 0,
    bookings_total: bookingCount ? bookingCount.n : 0,
    ...subStats,
  });
}));

app.get('/api/super/djs', authMiddleware, requireSuperAdmin, asyncHandler(async (req, res) => {
  const { status } = req.query || {};
  let where = "u.role IN ('ADMIN', 'DJ')";
  const params = [];
  if (status && ['ACTIVE', 'PENDING', 'REJECTED', 'SUSPENDED'].includes(String(status))) {
    where += ' AND u.status = ?';
    params.push(String(status));
  }

  const rows = await all(
    `SELECT u.id, u.name, u.email, u.role, u.status, u.created_at, u.updated_at,
       d.slug, d.logo, d.tagline, d.location,
       (SELECT COUNT(*) FROM subscriptions s WHERE s.user_id = u.id) AS total_subscriptions,
       (SELECT COUNT(*) FROM subscriptions s WHERE s.user_id = u.id AND s.status = 'VERIFIED') AS verified_subscriptions
     FROM users u LEFT JOIN djs d ON d.user_id = u.id
     WHERE ${where} ORDER BY u.created_at DESC`,
    params
  );

  const djs = [];
  for (const row of rows) {
    const latest = await get('SELECT * FROM subscriptions WHERE user_id = ? ORDER BY id DESC LIMIT 1', [row.id]);
    djs.push({ ...row, latest_subscription: latest || null });
  }
  res.json({ djs });
}));

app.patch('/api/super/djs/:id/status', authMiddleware, requireSuperAdmin, asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!['ACTIVE', 'PENDING', 'REJECTED', 'SUSPENDED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const user = await get('SELECT id, name, email, role, status FROM users WHERE id = ?', [req.params.id]);
  if (!user || !['ADMIN', 'DJ'].includes(user.role)) {
    return res.status(404).json({ error: 'DJ not found' });
  }
  await run('UPDATE users SET status = ?, updated_at = ? WHERE id = ?', [status, new Date().toISOString(), user.id]);
  const updated = await get('SELECT id, name, email, role, status FROM users WHERE id = ?', [user.id]);
  io.emit('user:status', updated);
  res.json({ user: updated });
}));

app.get('/api/super/subscriptions', authMiddleware, requireSuperAdmin, asyncHandler(async (req, res) => {
  const rows = await all(
    `SELECT s.*, u.name AS user_name, u.email AS user_email, u.status AS user_status
     FROM subscriptions s JOIN users u ON u.id = s.user_id
     ORDER BY s.submitted_at DESC LIMIT 100`
  );
  res.json({ subscriptions: rows });
}));

app.patch('/api/super/subscriptions/:id', authMiddleware, requireSuperAdmin, asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!['VERIFIED', 'REJECTED'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }
  const sub = await get('SELECT * FROM subscriptions WHERE id = ?', [req.params.id]);
  if (!sub) return res.status(404).json({ error: 'Subscription not found' });

  await run(
    `UPDATE subscriptions SET status = ?, verified_at = CASE WHEN ? = 'VERIFIED' THEN ? ELSE NULL END, verified_by = ? WHERE id = ?`,
    [status, status, status === 'VERIFIED' ? new Date().toISOString() : null, req.dbUser.id, sub.id]
  );

  if (status === 'VERIFIED') {
    await run('UPDATE users SET status = ?, updated_at = ? WHERE id = ?', ['ACTIVE', new Date().toISOString(), sub.user_id]);
  }

  const updatedUser = await get('SELECT id, name, email, role, status FROM users WHERE id = ?', [sub.user_id]);
  if (updatedUser) io.emit('user:status', updatedUser);
  const updated = await get('SELECT * FROM subscriptions WHERE id = ?', [sub.id]);
  res.json({ subscription: updated, user: updatedUser });
}));

/* ----------------------------- TIPS / SETTINGS ----------------------------- */

app.get('/api/tips', async (req, res) => {
  const settings = await getSettings();
  const slug = String(req.query.slug || '').trim();
  const dj = slug ? await get('SELECT id, name, slug FROM djs WHERE slug = ?', [slug]) : null;
  res.json({
    tips: [],
    settings: {
      mtn_momo_number: settings.mtn_momo_number || config.mtnMomoNumber,
      mtn_momo_ussd: settings.mtn_momo_ussd || config.mtnMomoUssd,
      currency: settings.currency || 'RWF',
      suggested_tips: settings.suggested_tips ? JSON.parse(settings.suggested_tips) : [],
      tip_hint: settings.tip_hint || '',
      djName: dj ? dj.name : 'DJ',
    },
  });
});

app.get('/api/admin/settings', authMiddleware, requireAdmin, async (req, res) => {
  const settings = await getSettings();
  res.json({
    settings: {
      mtn_momo_number: settings.mtn_momo_number || config.mtnMomoNumber,
      mtn_momo_ussd: settings.mtn_momo_ussd || config.mtnMomoUssd,
      currency: settings.currency || 'RWF',
      suggested_tips: settings.suggested_tips ? JSON.parse(settings.suggested_tips) : [],
      tip_hint: settings.tip_hint || '',
    },
  });
});

app.patch('/api/admin/settings', authMiddleware, requireAdmin, asyncHandler(async (req, res) => {
  const { mtn_momo_number, mtn_momo_ussd, currency, suggested_tips, tip_hint } = req.body || {};

  if (typeof mtn_momo_number === 'string' && mtn_momo_number.trim()) {
    await setSetting('mtn_momo_number', mtn_momo_number.replace(/\s+/g, ''));
  }
  if (typeof mtn_momo_ussd === 'string' && mtn_momo_ussd.trim()) {
    await setSetting('mtn_momo_ussd', mtn_momo_ussd.trim());
  }
  if (typeof currency === 'string' && currency.trim()) {
    await setSetting('currency', currency.trim().toUpperCase());
  }
  if (Array.isArray(suggested_tips)) {
    await setSetting('suggested_tips', JSON.stringify(suggested_tips.map(String).slice(0, 6)));
  }
  if (typeof tip_hint === 'string') {
    await setSetting('tip_hint', tip_hint);
  }

  const settings = await getSettings();
  io.emit('settings:updated', settings);
  res.json({ settings });
}));

/* ----------------------------- BLOG ----------------------------- */

app.get('/api/blog', async (req, res) => {
  const rows = await all(
    `SELECT bp.id, bp.title, bp.slug, bp.excerpt, bp.featured_image, bp.category, bp.status, bp.published_at,
       d.name AS dj_name, d.slug AS dj_slug
     FROM blog_posts bp LEFT JOIN djs d ON d.id = bp.dj_id
     WHERE bp.status = 'PUBLISHED' ORDER BY bp.published_at DESC`
  );
  res.json({ posts: rows });
});

app.get('/api/blog/:slug', async (req, res) => {
  const post = await get(
    `SELECT bp.*, d.name AS dj_name, d.slug AS dj_slug, d.logo AS dj_logo
     FROM blog_posts bp LEFT JOIN djs d ON d.id = bp.dj_id
     WHERE bp.slug = ? AND bp.status = 'PUBLISHED'`,
    [req.params.slug]
  );
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json({ post });
});

app.post('/api/blog', authMiddleware, requireAdmin, asyncHandler(async (req, res) => {
  const { title, slug, excerpt, content, featured_image, category, status } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });

  const dj = await getDjForUser(req.user.id);
  const baseSlug = (slug || title).toString().trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  let finalSlug = baseSlug;
  const existing = await get('SELECT id FROM blog_posts WHERE slug = ?', [finalSlug]);
  if (existing) finalSlug = `${baseSlug}-${Date.now().toString(36)}`;

  const postStatus = status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';
  const publishedAt = postStatus === 'PUBLISHED' ? new Date().toISOString() : null;

  const result = await run(
    `INSERT INTO blog_posts (dj_id, title, slug, excerpt, content, featured_image, category, status, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [dj.id, title.trim(), finalSlug, excerpt || null, content || null, featured_image || null, category || null, postStatus, publishedAt]
  );

  const post = await get('SELECT * FROM blog_posts WHERE id = ?', [result.id]);
  res.status(201).json({ post });
}));

app.patch('/api/blog/:id', authMiddleware, requireAdmin, asyncHandler(async (req, res) => {
  const dj = await getDjForUser(req.user.id);
  const post = await get('SELECT * FROM blog_posts WHERE id = ? AND dj_id = ?', [req.params.id, dj.id]);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  const { title, slug, excerpt, content, featured_image, category, status } = req.body || {};
  const updates = {};
  if (typeof title === 'string' && title.trim()) updates.title = title.trim();
  if (typeof slug === 'string' && slug.trim()) updates.slug = slug.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (typeof excerpt === 'string') updates.excerpt = excerpt;
  if (typeof content === 'string') updates.content = content;
  if (typeof featured_image === 'string') updates.featured_image = featured_image;
  if (typeof category === 'string') updates.category = category;

  if (status === 'PUBLISHED' || status === 'DRAFT') {
    updates.status = status;
    if (status === 'PUBLISHED' && post.status !== 'PUBLISHED') updates.published_at = new Date().toISOString();
  }

  const keys = Object.keys(updates);
  if (!keys.length) return res.status(400).json({ error: 'Nothing to update' });

  if (updates.slug) {
    const dup = await get('SELECT id FROM blog_posts WHERE slug = ? AND id != ?', [updates.slug, post.id]);
    if (dup) updates.slug = `${updates.slug}-${Date.now().toString(36)}`;
  }

  const setClause = keys.map((key) => `${key} = ?`).join(', ');
  await run(`UPDATE blog_posts SET ${setClause}, updated_at = ? WHERE id = ?`, [...Object.values(updates), new Date().toISOString(), post.id]);

  const updated = await get('SELECT * FROM blog_posts WHERE id = ?', [post.id]);
  res.json({ post: updated });
}));

app.delete('/api/blog/:id', authMiddleware, requireAdmin, async (req, res) => {
  const dj = await getDjForUser(req.user.id);
  const post = await get('SELECT * FROM blog_posts WHERE id = ? AND dj_id = ?', [req.params.id, dj.id]);
  if (!post) return res.status(404).json({ error: 'Post not found' });

  await run('DELETE FROM blog_posts WHERE id = ?', [post.id]);
  res.json({ success: true });
});

app.get('/api/admin/blog', authMiddleware, requireAdmin, asyncHandler(async (req, res) => {
  const dj = await getDjForUser(req.user.id);
  const posts = await all('SELECT * FROM blog_posts WHERE dj_id = ? ORDER BY created_at DESC', [dj.id]);
  res.json({ posts });
}));

/* ----------------------------- CONTACT ----------------------------- */

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, event_type, event_date, message } = req.body || {};
  if (!name || !name.trim() || !email || !email.trim()) {
    return res.status(400).json({ error: 'Name and email are required.' });
  }

  await run(
    `INSERT INTO booking_messages (name, email, phone, event_type, event_date, message) VALUES (?, ?, ?, ?, ?, ?)`,
    [name.trim(), email.trim(), phone || null, event_type || null, event_date || null, message || null]
  );

  res.status(201).json({ success: true, message: 'Booking request sent!' });
});

/* ----------------------------- SOCKETS ----------------------------- */

io.use((socket, next) => {
  const token =
    (socket.handshake.auth && socket.handshake.auth.token) ||
    (socket.handshake.headers && socket.handshake.headers.authorization?.split(' ')[1]);
  if (!token) return next(new Error('Unauthorized'));

  try {
    const payload = jwt.verify(token, config.jwtSecret);
    socket.data.userId = payload.id;
    next();
  } catch (error) {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', async (socket) => {
  try {
    if (socket.data.userId) {
      const dj = await getDjForUser(socket.data.userId);
      if (dj) socket.join(`dj-${dj.id}`);
    }
  } catch (error) {
    // continue even if room join fails
  }

  socket.on('dj:join', ({ djId, eventId }) => {
    if (djId) socket.join(`dj-${djId}`);
    if (djId && eventId) socket.join(`dj-${djId}-event-${eventId}`);
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: 'We couldn\'t process your request. Please try again.' });
});

async function startServer() {
  mkdirSync(dirname(config.databasePath), { recursive: true });
  await initDb();
  await seedDatabase();
  server.listen(config.port, () => {
    console.log(`DJ platform backend running on http://localhost:${config.port}`);
  });
}

startServer().catch((error) => {
  console.error('Failed to start backend', error);
  process.exit(1);
});