'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import type { DjProfile } from '@/lib/types';

async function fileToDataUrl(file: File, maxSize = 480): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read the image file.'));
    reader.readAsDataURL(file);
  });

  const image = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load the image file.'));
    img.src = dataUrl;
  });

  const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
  const width = Math.max(1, Math.round(image.width * scale));
  const height = Math.max(1, Math.round(image.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  if (!context) return dataUrl;
  context.drawImage(image, 0, 0, width, height);
  return canvas.toDataURL('image/jpeg', 0.82);
}

export function ProfileTab() {
  const fileRef = useRef<HTMLInputElement | null>(null);
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
  const [logoError, setLogoError] = useState('');

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

  async function handleLogoFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setLogoError('');
    if (!file.type.startsWith('image/')) {
      setLogoError('Please choose an image file (PNG, JPG, or WEBP).');
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      setLogoError('Image is too large. Please choose a file under 4MB.');
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setForm((current) => ({ ...current, logo: dataUrl }));
    } catch (err) {
      setLogoError(err instanceof Error ? err.message : 'Could not process the image.');
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
          <input id="pf-slug" type="text" value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} placeholder="your-dj-name" />
          <p className="mt-1 text-xs text-zinc-400">Requests live at /request/{form.slug || 'your-dj-name'}</p>
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
          <label>DJ logo</label>
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
              {form.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.logo} alt="DJ logo preview" className="max-h-full max-w-full object-contain" />
              ) : (
                <ImagePlus className="h-5 w-5 text-zinc-400" />
              )}
            </div>
            <div className="flex flex-col gap-2">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleLogoFile} className="hidden" />
              <button type="button" className="btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
                <ImagePlus className="h-3.5 w-3.5" />
                {form.logo ? 'Replace logo' : 'Upload logo'}
              </button>
              {form.logo && (
                <button
                  type="button"
                  className="btn-ghost btn-sm justify-start text-red-600 dark:text-red-400"
                  onClick={() => setForm((current) => ({ ...current, logo: '' }))}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              )}
            </div>
          </div>
          <p className="mt-1.5 text-xs text-zinc-400">Shown on your request page and in the DJ directory.</p>
          {logoError && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{logoError}</p>}
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