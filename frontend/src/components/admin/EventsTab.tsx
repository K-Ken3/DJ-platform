'use client';

import { CalendarDays, Download, Pencil, Plus, Printer, QrCode, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { api } from '@/lib/api';
import type { EventItem } from '@/lib/types';
import { Modal, ConfirmButton } from '../Modal';

const emptyForm = { name: '', venue: '', event_date: '', event_code: '' };

export function EventsTab({ events, onChanged }: { events: EventItem[]; onChanged: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [savingError, setSavingError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [qrEvent, setQrEvent] = useState<EventItem | null>(null);
  const [qrData, setQrData] = useState<{ url: string; qr: string } | null>(null);
  const [qrLoading, setQrLoading] = useState(false);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setSavingError('');
    setShowForm(true);
  }

  function openEdit(event: EventItem) {
    setEditingId(event.id);
    setForm({
      name: event.name,
      venue: event.venue || '',
      event_date: event.event_date || '',
      event_code: event.event_code,
    });
    setSavingError('');
    setShowForm(true);
  }

  async function saveEvent(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setSavingError('');
    try {
      if (editingId) {
        await api(`/api/events/${editingId}`, { method: 'PATCH', body: JSON.stringify(form) });
      } else {
        await api('/api/events', { method: 'POST', body: JSON.stringify(form) });
      }
      setShowForm(false);
      onChanged();
    } catch (error) {
      setSavingError(error instanceof Error ? error.message : 'Could not save event.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(event: EventItem) {
    await api(`/api/events/${event.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ active: !Boolean(event.active) }),
    });
    onChanged();
  }

  async function deleteEvent(event: EventItem) {
    await api(`/api/events/${event.id}`, { method: 'DELETE' });
    onChanged();
  }

  async function generateQr(event: EventItem) {
    setQrEvent(event);
    setQrData(null);
    setQrLoading(true);
    try {
      const data = await api<{ url: string; qr: string }>(`/api/events/${event.id}/qr`);
      setQrData(data);
    } catch {
      setQrData(null);
    } finally {
      setQrLoading(false);
    }
  }

  function downloadQr() {
    if (!qrData || !qrEvent) return;
    const link = document.createElement('a');
    link.href = qrData.qr;
    link.download = `qr-${qrEvent.event_code}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  function printQr() {
    if (!qrData) return;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(
      `<html><head><title>QR</title><style>body{display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:system-ui}</style></head><body><img src="${qrData.qr}" alt="QR" /></body></html>`
    );
    win.document.close();
    win.focus();
    win.print();
  }

  function formatDate(value?: string | null) {
    if (!value) return 'No date';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {events.filter((event) => Boolean(event.active)).length} active &middot; {events.length} total
        </p>
        <button type="button" className="btn-primary btn-sm" onClick={openCreate}>
          <Plus className="h-4 w-4" />
          New event
        </button>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <CalendarDays className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
          <p className="mt-3 font-semibold">No events yet.</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Create an event to generate QR codes and start collecting requests.</p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {events.map((event) => (
            <li key={event.id} className="flex flex-col gap-3 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-bold">{event.name}</p>
                  <span className={`pill ${Boolean(event.active) ? 'pill-played' : 'pill-rejected'}`}>
                    {Boolean(event.active) ? 'Active' : 'Inactive'}
                  </span>
                  <span className="font-mono text-xs text-zinc-400">{event.event_code}</span>
                </div>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {event.venue || 'Venue TBA'} &middot; {formatDate(event.event_date)} &middot; {event.request_count ?? 0} requests
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" className="btn-outline btn-sm" onClick={() => toggleActive(event)}>
                  {Boolean(event.active) ? 'Deactivate' : 'Activate'}
                </button>
                <button type="button" className="btn-outline btn-sm" onClick={() => generateQr(event)}>
                  <QrCode className="h-3.5 w-3.5" />
                  QR
                </button>
                <button type="button" className="btn-outline btn-sm" onClick={() => openEdit(event)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Edit
                </button>
                <ConfirmButton onConfirm={() => deleteEvent(event)} label={`Delete "${event.name}" and its requests?`}>
                  <Trash2 className="h-3.5 w-3.5" />
                </ConfirmButton>
              </div>
            </li>
          ))}
        </ul>
      )}

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editingId ? 'Edit event' : 'New event'}>
        <form onSubmit={saveEvent} className="grid gap-4">
          <div>
            <label htmlFor="ev-name">Event name</label>
            <input id="ev-name" type="text" required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="Saturday Night" />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="ev-venue">Venue</label>
              <input id="ev-venue" type="text" value={form.venue} onChange={(event) => setForm((current) => ({ ...current, venue: event.target.value }))} placeholder="Kigali Rooftop" />
            </div>
            <div>
              <label htmlFor="ev-date">Event date</label>
              <input id="ev-date" type="date" value={form.event_date} onChange={(event) => setForm((current) => ({ ...current, event_date: event.target.value }))} />
            </div>
          </div>
          <div>
            <label htmlFor="ev-code">Event code (optional)</label>
            <input id="ev-code" type="text" value={form.event_code} onChange={(event) => setForm((current) => ({ ...current, event_code: event.target.value }))} placeholder="party-2026" />
            <p className="mt-1 text-xs text-zinc-400">Used in the request URL and QR code.</p>
          </div>

          {savingError && <p className="rounded-xs border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">{savingError}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" className="btn-outline" onClick={() => setShowForm(false)}>Cancel</button>
            <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save event'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(qrEvent)} onClose={() => setQrEvent(null)} title="Event QR code" wide>
        {qrLoading || !qrData ? (
          <p className="py-10 text-center text-sm text-zinc-500">Generating QR code...</p>
        ) : (
          <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
            <div className="border border-zinc-200 p-3 dark:border-zinc-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrData.qr} alt={`QR code for ${qrEvent?.name}`} className="h-56 w-56" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold">{qrEvent?.name}</h3>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Scan to open the request page for this event.</p>
              <p className="mt-3 break-all rounded-xs border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                {qrData.url}
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <button type="button" className="btn-primary btn-sm" onClick={downloadQr}>
                  <Download className="h-3.5 w-3.5" />
                  Download PNG
                </button>
                <button type="button" className="btn-outline btn-sm" onClick={printQr}>
                  <Printer className="h-3.5 w-3.5" />
                  Print QR
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}