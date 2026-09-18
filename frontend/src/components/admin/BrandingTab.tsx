'use client';

import { useEffect, useRef, useState } from 'react';
import { ImagePlus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useBranding, type SiteBranding } from '@/lib/branding';

type BrandKey = 'site_logo' | 'site_logo_dark' | 'footer_logo' | 'footer_logo_dark';

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

function LogoField({
  label,
  hint,
  value,
  onChange,
  error,
}: {
  label: string;
  hint: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 4 * 1024 * 1024) return;
    try {
      onChange(await fileToDataUrl(file));
    } catch {
      // ignore unreadable files
    }
  }

  return (
    <div>
      <label>{label}</label>
      <div className="flex items-center gap-4">
        <div className="flex h-16 w-28 shrink-0 items-center justify-center border border-zinc-200 bg-zinc-50 px-2 dark:border-zinc-800 dark:bg-zinc-950">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt={`${label} preview`} className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Default</span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <button type="button" className="btn-outline btn-sm" onClick={() => fileRef.current?.click()}>
            <ImagePlus className="h-3.5 w-3.5" />
            {value ? 'Replace' : 'Upload'}
          </button>
          {value && (
            <button
              type="button"
              className="btn-ghost btn-sm justify-start text-red-600 dark:text-red-400"
              onClick={() => onChange('')}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          )}
        </div>
      </div>
      <p className="mt-1.5 text-xs text-zinc-400">{hint}</p>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

const fields: { key: BrandKey; label: string; hint: string }[] = [
  { key: 'site_logo', label: 'Navbar logo (light mode)', hint: 'Shown in the navbar on light pages.' },
  { key: 'site_logo_dark', label: 'Navbar logo (dark mode)', hint: 'Shown in the navbar on dark pages.' },
  { key: 'footer_logo', label: 'Footer logo (light mode)', hint: 'Shown in the footer on light pages. Leave empty to reuse the navbar logo.' },
  { key: 'footer_logo_dark', label: 'Footer logo (dark mode)', hint: 'Shown in the footer on dark pages. Leave empty to reuse the navbar logo.' },
];

export function BrandingTab() {
  const { refresh } = useBranding();
  const [form, setForm] = useState<Partial<Record<BrandKey, string>>>({});
  const [siteName, setSiteName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Partial<Record<BrandKey, string>>>({});

  useEffect(() => {
    api<{ branding: Partial<SiteBranding> }>('/api/admin/site-branding')
      .then((data) => {
        const branding = data.branding;
        setForm({
          site_logo: branding.site_logo || '',
          site_logo_dark: branding.site_logo_dark || '',
          footer_logo: branding.footer_logo || '',
          footer_logo_dark: branding.footer_logo_dark || '',
        });
        setSiteName(branding.site_name || '');
      })
      .catch(() => {});
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await api('/api/admin/site-branding', {
        method: 'PATCH',
        body: JSON.stringify({ ...form, site_name: siteName }),
      });
      await refresh();
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save branding.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="grid gap-6">
      <div>
        <p className="mb-4 rounded-xs border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          Customize your site identity. Upload PNG or JPG logos; they are applied across the public website (navbar and
          footer).
        </p>
      </div>

      <div>
        <label htmlFor="bn-name">Site name</label>
        <input
          id="bn-name"
          type="text"
          value={siteName}
          onChange={(event) => setSiteName(event.target.value)}
          placeholder="DJLink"
          maxLength={40}
        />
        <p className="mt-1.5 text-xs text-zinc-400">Used as the logo&apos;s accessible label and in the footer copyright.</p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {fields.map((field) => (
          <LogoField
            key={field.key}
            label={field.label}
            hint={field.hint}
            value={form[field.key] || ''}
            error={errors[field.key]}
            onChange={(value) => {
              setForm((current) => ({ ...current, [field.key]: value }));
              setErrors((current) => ({ ...current, [field.key]: undefined }));
            }}
          />
        ))}
      </div>

      {error && <p className="rounded-xs border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">{error}</p>}
      {saved && <p className="rounded-xs border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400">Branding saved and applied.</p>}

      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={saving}>
          Save branding
        </button>
      </div>
    </form>
  );
}