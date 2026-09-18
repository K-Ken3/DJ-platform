'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

const initialForm = {
  name: '',
  email: '',
  phone: '',
  event_type: '',
  event_date: '',
  message: '',
};

export function ContactForm({ djId }: { djId?: number }) {
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');

  function update(field: keyof typeof initialForm) {
    return (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');
    setError('');

    try {
      await api<{ message: string }>('/api/contact', {
        method: 'POST',
        body: JSON.stringify({ ...form, dj_id: djId }),
      });
      setStatus('success');
      setForm(initialForm);
    } catch (err) {
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
  }

  if (status === 'success') {
    return (
      <div className="surface-2 flex flex-col items-start gap-3 p-6">
        <p className="text-lg font-bold">Booking request sent!</p>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Thanks for reaching out. We&apos;ll get back to you soon.
        </p>
        <button type="button" className="btn-outline" onClick={() => setStatus('idle')}>
          Send another request
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-name">Name</label>
          <input id="cf-name" type="text" required value={form.name} onChange={update('name')} placeholder="Your name" />
        </div>
        <div>
          <label htmlFor="cf-email">Email</label>
          <input id="cf-email" type="email" required value={form.email} onChange={update('email')} placeholder="you@email.com" />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="cf-phone">Phone</label>
          <input id="cf-phone" type="tel" value={form.phone} onChange={update('phone')} placeholder="+250..." />
        </div>
        <div>
          <label htmlFor="cf-type">Event type</label>
          <input id="cf-type" type="text" value={form.event_type} onChange={update('event_type')} placeholder="Wedding, club, private party..." />
        </div>
      </div>
      <div>
        <label htmlFor="cf-date">Event date</label>
        <input id="cf-date" type="date" value={form.event_date} onChange={update('event_date')} />
      </div>
      <div>
        <label htmlFor="cf-message">Message</label>
        <textarea id="cf-message" rows={5} value={form.message} onChange={update('message')} placeholder="Tell us about your event..." />
      </div>

      {status === 'error' && (
        <p className="rounded-xs border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </p>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" className="btn-primary" disabled={status === 'sending'}>
          {status === 'sending' ? 'Sending...' : 'Send Request'}
        </button>
      </div>
    </form>
  );
}