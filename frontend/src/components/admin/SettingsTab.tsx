'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { AdminSettings } from '@/lib/types';

export function SettingsTab() {
  const [form, setForm] = useState({
    mtn_momo_number: '',
    mtn_momo_ussd: '',
    currency: '',
    suggested_tips: '',
    tip_hint: '',
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api<{ settings: AdminSettings }>('/api/admin/settings')
      .then((data) => {
        const settings = data.settings;
        setForm({
          mtn_momo_number: settings.mtn_momo_number || '',
          mtn_momo_ussd: settings.mtn_momo_ussd || '',
          currency: settings.currency || 'RWF',
          suggested_tips: (settings.suggested_tips || []).join(', '),
          tip_hint: settings.tip_hint || '',
        });
      })
      .catch(() => {});
  }, []);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSaved(false);
    setError('');
    try {
      await api('/api/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify({
          mtn_momo_number: form.mtn_momo_number,
          mtn_momo_ussd: form.mtn_momo_ussd,
          currency: form.currency,
          suggested_tips: form.suggested_tips.split(',').map((value) => value.trim()).filter(Boolean),
          tip_hint: form.tip_hint,
        }),
      });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save settings.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={save} className="grid gap-4">
      <div>
        <p className="mb-4 rounded-xs border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
          Tipping uses MTN Mobile Money USSD. Guests tap <strong>Donate a tip</strong>, the dialer opens with the code
          pre-filled, and they complete the flow on their phone. We never collect MoMo PINs on this site.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="st-number">MTN Mobile Money number</label>
          <input id="st-number" type="text" value={form.mtn_momo_number} onChange={(event) => setForm((current) => ({ ...current, mtn_momo_number: event.target.value }))} placeholder="0789630452" />
        </div>
        <div>
          <label htmlFor="st-ussd">USSD code</label>
          <input id="st-ussd" type="text" value={form.mtn_momo_ussd} onChange={(event) => setForm((current) => ({ ...current, mtn_momo_ussd: event.target.value }))} placeholder="*182*1*1*0789630452#" className="font-mono" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="st-currency">Currency</label>
          <input id="st-currency" type="text" value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))} placeholder="RWF" />
        </div>
        <div>
          <label htmlFor="st-tips">Suggested tip amounts (comma separated)</label>
          <input id="st-tips" type="text" value={form.suggested_tips} onChange={(event) => setForm((current) => ({ ...current, suggested_tips: event.target.value }))} placeholder="1000, 2000, 5000, 10000" />
        </div>
      </div>

      <div>
        <label htmlFor="st-hint">Tip hint text</label>
        <textarea id="st-hint" rows={2} value={form.tip_hint} onChange={(event) => setForm((current) => ({ ...current, tip_hint: event.target.value }))} placeholder="Send a tip via MTN Mobile Money to support live music." />
      </div>

      {error && <p className="rounded-xs border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">{error}</p>}
      {saved && <p className="rounded-xs border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400">Settings saved.</p>}

      <div className="flex justify-end">
        <button type="submit" className="btn-primary" disabled={saving}>Save settings</button>
      </div>
    </form>
  );
}