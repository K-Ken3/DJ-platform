'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { DjProfile } from '@/lib/types';

export function ProfileTab() {
  const [profile, setProfile] = useState<DjProfile | null>(null);
  const [form, setForm] = useState({
    name: '',
    slug: '',
    tagline: '',
    bio: '',
    location: '',
    logo: '',
    instagram: '',
    audiomack: '',
    facebook: '',
    youtube: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ user: unknown; dj: DjProfile | null }>('/api/auth/me')
      .then((data) => {
        const dj = data.dj;
        setProfile(dj);
        if (dj) {
          let social = {};
          try {
            social = dj.social_links ? JSON.parse(dj.social_links) : {};
          } catch {
            social = {};
          }
          setForm({
            name: dj.name || '',
            slug: dj.slug || '',
            tagline: dj.tagline || '',
            bio: dj.bio || '',
            location: dj.location || '',
            logo: dj.logo || '',
            instagram: (social as Record<string, string>).instagram || '',
            audiomack: (social as Record<string, string>).audiomack || '',
            facebook: (social as Record<string, string>).facebook || '',
            youtube: (social as Record<string, string>).youtube || '',
          });
        }
      })
      .catch(() => {});
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await api('/api/dj/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: form.name,
          slug: form.slug,
          tagline: form.tagline,
          bio: form.bio,
          location: form.location,
          logo: form.logo,
          social_links: {
            instagram: form.instagram,
            audiomack: form.audiomack,
            facebook: form.facebook,
            youtube: form.youtube,
          },
        }),
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pf-name">DJ name</label>
          <input id="pf-name" type="text" required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} />
        </div>
        <div>
          <label htmlFor="pf-slug">Slug (request URL)</label>
          <input id="pf-slug" type="text" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} placeholder="dj-vaxino" />
          <p className="mt-1 text-xs text-zinc-400">Requests live at /request/{form.slug || 'dj-vaxino'}</p>
        </div>
      </div>

      <div>
        <label htmlFor="pf-tagline">Tagline</label>
        <input id="pf-tagline" type="text" value={form.tagline} onChange={(event) => setForm((current) => ({ ...current, tagline: event.target.value }))} placeholder="What should I play next?" />
      </div>
      <div>
        <label htmlFor="pf-bio">Bio</label>
        <textarea id="pf-bio" rows={5} value={form.bio} onChange={(event) => setForm((current) => ({ ...current, bio: event.target.value }))} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="pf-location">Location</label>
          <input id="pf-location" type="text" value={form.location} onChange={(event) => setForm((current) => ({ ...current, location: event.target.value }))} placeholder="Kigali, Rwanda" />
        </div>
        <div>
          <label htmlFor="pf-logo">Logo image URL</label>
          <input id="pf-logo" type="url" value={form.logo} onChange={(event) => setForm((current) => ({ ...current, logo: event.target.value }))} placeholder="https://..." />
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Social links</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {(['instagram', 'audiomack', 'facebook', 'youtube'] as const).map((platform) => (
            <div key={platform}>
              <label htmlFor={`pf-${platform}`} className="capitalize">{platform}</label>
              <input id={`pf-${platform}`} type="url" value={form[platform]} onChange={(event) => setForm((current) => ({ ...current, [platform]: event.target.value }))} placeholder={`https://${platform}.com/...`} />
            </div>
          ))}
        </div>
      </div>

      {error && <p className="rounded-xs border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">{error}</p>}
      {saved && <p className="rounded-xs border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400">Profile saved.</p>}

      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={saving}>Save profile</button>
      </div>
    </form>
  );
}