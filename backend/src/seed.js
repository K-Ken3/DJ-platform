import bcrypt from 'bcryptjs';
import { run, all, get } from './db.js';

async function ensureSuperAdmin() {
  const existing = await get('SELECT id FROM users WHERE email = ?', ['admin@djlink.app']);
  if (existing) return;

  const passwordHash = await bcrypt.hash('djadmin123', 10);
  await run(
    `INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)`,
    ['DJLink Owner', 'admin@djlink.app', passwordHash, 'SUPERADMIN', 'ACTIVE']
  );
  console.log('Seeded SUPERADMIN: admin@djlink.app');
}

export async function seedDatabase() {
  await ensureSuperAdmin();

  const djUser = await get('SELECT id FROM users WHERE email = ?', ['dj@vaxino.com']);

  if (djUser) {
    await run(`UPDATE users SET status = ? WHERE email = ?`, ['ACTIVE', 'dj@vaxino.com']);
    await ensureSettings();
    return;
  }

  const passwordHash = await bcrypt.hash('djadmin123', 10);

  const user = await run(
    `INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)`,
    ['DJ Vaxino', 'dj@vaxino.com', passwordHash, 'ADMIN', 'ACTIVE']
  );

  const dj = await run(
    `INSERT INTO djs (user_id, name, slug, bio, tagline, location, social_links, logo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      user.id,
      'DJ Vaxino',
      'dj-vaxino',
      'A premium DJ delivering vibrant sets for clubs, weddings, and private events across Rwanda. Blending Afrobeat, Amapiano, house, and late-night dance classics into immersive sets designed to keep the room moving from the first track to the final encore.',
      'What should I play next?',
      'Kigali, Rwanda',
      JSON.stringify({
        instagram: 'https://instagram.com/dj_vaxino',
        audiomack: 'https://audiomack.com/dj-vaxino',
        facebook: 'https://facebook.com/dj_vaxino',
        youtube: 'https://www.youtube.com/@Deejayvaxino',
      }),
      'https://images.unsplash.com/photo-1496293455970-f8581aae0e3b?auto=format&fit=crop&w=800&q=80',
    ]
  );

  const event1 = await run(
    `INSERT INTO events (dj_id, name, venue, event_date, event_code, active) VALUES (?, ?, ?, ?, ?, ?)`,
    [dj.id, 'Saturday Night', 'Kigali Rooftop', '2026-09-20', 'party-2026', 1]
  );

  const event2 = await run(
    `INSERT INTO events (dj_id, name, venue, event_date, event_code, active) VALUES (?, ?, ?, ?, ?, ?)`,
    [dj.id, 'Wedding Bliss', 'Mille Collines', '2026-10-03', 'wedding-oct', 0]
  );

  const event3 = await run(
    `INSERT INTO events (dj_id, name, venue, event_date, event_code, active) VALUES (?, ?, ?, ?, ?, ?)`,
    [dj.id, 'Club Residency', 'Kigali City, Nyabugogo', '2026-09-26', 'residency-sep', 0]
  );

  const samples = [
    ['Blinding Lights', 'The Weeknd', 12000],
    ['Calm Down', 'Rema', 60000],
    ['One Dance', 'Drake', 240000],
    ['Love Nwantiti', 'CKay', 3600000],
    ['Jerusalema', 'Master KG', 7200000],
    ['Rush', 'Ayra Starr', 90000000],
    ['Asake – Lonely At The Top', null, 170000000],
    ['Unavailable', 'Davido', 190000000],
  ];

  for (let i = 0; i < samples.length; i++) {
    const [song, artist, ageMs] = samples[i];
    const eventId = i % 2 === 0 ? event1.id : event2.id;
    const status = i < 4 ? 'PLAYED' : 'NEW';
    await run(
      `INSERT INTO song_requests (dj_id, event_id, song_name, artist_name, status, requested_at, played_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        dj.id,
        eventId,
        song,
        artist,
        status,
        new Date(Date.now() - ageMs).toISOString(),
        status === 'PLAYED' ? new Date(Date.now() - ageMs + 60000).toISOString() : null,
      ]
    );
  }

  await run(
    `INSERT INTO blog_posts (dj_id, title, slug, excerpt, content, category, status, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      dj.id,
      'How I Build a Night to Remember',
      'how-i-build-a-night-to-remember',
      'Behind-the-scenes notes on preparing a high-energy set for an unforgettable crowd.',
      'A great night starts long before the music begins. For every set I open my crate with a clear arc in mind — a build, a peak, and a landing.\n\nI read the room from the first five tracks. The crowd decides the direction; my job is to react before they have to ask.\n\nPreparation is everything: knowing the venue, the crowd profile, and having a deep pool of edits and accapellas ready for any moment.',
      'Events',
      'PUBLISHED',
      new Date(Date.now() - 3 * 86400000).toISOString(),
    ]
  );

  await run(
    `INSERT INTO blog_posts (dj_id, title, slug, excerpt, content, category, status, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      dj.id,
      'Mixing for Diverse Crowds',
      'mixing-for-diverse-crowds',
      'Strategies for reading a room and balancing energy across different audiences.',
      'Reading the room is one of the most important parts of live mixing. Energy is never constant — it breathes.\n\nOn a roof-top in Kigali the same track that empties the floor at a wedding will pack it in a club. Learn to move between genres with intention, not panic.\n\nKeep it simple: smiles on the floor, feet moving, phones up — you are in the right place. Keep digging and keep it human.',
      'Tips',
      'PUBLISHED',
      new Date(Date.now() - 86400000).toISOString(),
    ]
  );

  await run(
    `INSERT INTO blog_posts (dj_id, title, slug, excerpt, content, category, status, published_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      dj.id,
      'Gear That Keeps My Sets Clean',
      'gear-that-keeps-my-sets-clean',
      'A quick look at the essential hardware I carry for every performance.',
      'Reliability is the real show. My kit is built around redundancy — double cables, backup drives, and a mixer that I know inside out.\n\nA clean set is 20% gear and 80% preparation. Test everything before the doors open and your night will take care of itself.',
      'Gear',
      'PUBLISHED',
      new Date(Date.now() - 2 * 86400000).toISOString(),
    ]
  );

  await ensureSettings();
}

async function ensureSettings() {
  const settings = [
    ['mtn_momo_number', '0789630452'],
    ['mtn_momo_ussd', '*182*1*1*0789630452#'],
    ['currency', 'RWF'],
    ['suggested_tips', JSON.stringify(['1000', '2000', '5000', '10000'])],
    ['tip_hint', 'Send a tip via MTN Mobile Money to support live music.'],
    ['subscription_fee', '5000'],
  ];

  for (const [key, value] of settings) {
    const existing = await get('SELECT id FROM app_settings WHERE key = ?', [key]);
    if (!existing) {
      await run(`INSERT INTO app_settings (key, value) VALUES (?, ?)`, [key, value]);
    }
  }
}