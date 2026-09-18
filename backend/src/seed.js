import bcrypt from 'bcryptjs';
import { run, all, get } from './db.js';

const SUPERADMIN_EMAIL = 'karasiraken5@gmail.com';
const SUPERADMIN_PASSWORD = '20060Ken';
const SUPERADMIN_NAME = 'Ken';

async function ensureSuperAdmin() {
  const existing = await get('SELECT id FROM users WHERE email = ?', [SUPERADMIN_EMAIL]);
  if (existing) {
    await run(`UPDATE users SET role = 'SUPERADMIN', status = 'ACTIVE' WHERE id = ?`, [existing.id]);
    return;
  }
  const passwordHash = await bcrypt.hash(SUPERADMIN_PASSWORD, 10);
  await run(
    `INSERT INTO users (name, email, password_hash, role, status) VALUES (?, ?, ?, ?, ?)`,
    [SUPERADMIN_NAME, SUPERADMIN_EMAIL, passwordHash, 'SUPERADMIN', 'ACTIVE']
  );
  console.log(`Seeded SUPERADMIN: ${SUPERADMIN_EMAIL}`);
}

async function purgeDemoData() {
  const djRows = await all('SELECT id FROM djs');
  for (const dj of djRows) {
    await run('DELETE FROM song_requests WHERE dj_id = ?', [dj.id]);
    await run('DELETE FROM tips WHERE dj_id = ?', [dj.id]);
    await run('DELETE FROM blog_posts WHERE dj_id = ?', [dj.id]);
    await run('DELETE FROM events WHERE dj_id = ?', [dj.id]);
  }
  await run('DELETE FROM djs');
  await run('DELETE FROM subscriptions');
  await run('DELETE FROM booking_messages');
  await run('DELETE FROM users');
}

export async function seedDatabase() {
  await purgeDemoData();
  await ensureSuperAdmin();
  await ensureSettings();
}

async function ensureSettings() {
  const settings = [
    ['mtn_momo_number', '0788205500'],
    ['mtn_momo_ussd', '*182*8*1*1540166*22000#'],
    ['momo_account_name', 'Ken'],
    ['currency', 'RWF'],
    ['suggested_tips', JSON.stringify(['1000', '2000', '5000', '10000'])],
    ['tip_hint', 'Send a tip via MTN Mobile Money to support live music.'],
    ['subscription_fee', '22000'],
    ['subscription_fee_usd', '15'],
    ['usd_rwf_rate', '1469'],
    ['site_logo', '/logo.png'],
    ['site_logo_dark', '/logo-white.png'],
    ['footer_logo', '/logo.png'],
    ['footer_logo_dark', '/logo-white.png'],
    ['site_name', 'DJLink'],
  ];

  for (const [key, value] of settings) {
    const existing = await get('SELECT id FROM app_settings WHERE key = ?', [key]);
    if (!existing) {
      await run(`INSERT INTO app_settings (key, value) VALUES (?, ?)`, [key, value]);
    }
  }
}