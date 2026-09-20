'use client';

import { ChevronLeft, ChevronRight, Download, Search } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { api, downloadCsv } from '@/lib/api';
import type { EventItem, RequestItem } from '@/lib/types';
import { RelativeTime } from '@/lib/time';

const PAGE_SIZE = 20;

export function HistoryTab({ events }: { events: EventItem[] }) {
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [status, setStatus] = useState('ALL');
  const [eventId, setEventId] = useState('all');
  const [search, setSearch] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset) });
      if (status !== 'ALL') params.set('status', status);
      if (eventId !== 'all') params.set('eventId', eventId);
      if (search.trim()) params.set('search', search.trim());
      if (date) params.set('date', date);

      const data = await api<{ requests: RequestItem[]; total: number }>(`/api/requests?${params.toString()}`);
      setRequests(data.requests || []);
      setTotal(data.total || 0);
    } catch {
      setRequests([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [status, eventId, search, date, offset]);

  useEffect(() => {
    load();
  }, [load]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.floor(offset / PAGE_SIZE) + 1;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="grid flex-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="h-status">Status</label>
            <select id="h-status" value={status} onChange={(event) => { setStatus(event.target.value); setOffset(0); }}>
            <option value="ALL">All statuses</option>
            <option value="NEW">New</option>
            <option value="PLAYED">Played</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <div>
          <label htmlFor="h-event">Event</label>
          <select id="h-event" value={eventId} onChange={(event) => { setEventId(event.target.value); setOffset(0); }}>
            <option value="all">All events</option>
            {events.map((event) => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="h-search">Search</label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              id="h-search"
              type="search"
              className="pl-8"
              placeholder="Song or artist..."
              value={search}
              onChange={(event) => { setSearch(event.target.value); setOffset(0); }}
            />
          </div>
        </div>
        <div>
          <label htmlFor="h-date">Date</label>
          <input id="h-date" type="date" value={date} onChange={(event) => { setDate(event.target.value); setOffset(0); }} />
        </div>
      </div>
      <button
        type="button"
        className="btn-outline btn-sm"
        onClick={() => downloadCsv('/api/admin/requests/export.csv', 'requests.csv').catch((err) => alert(err instanceof Error ? err.message : 'Export failed'))}
      >
        <Download className="h-3.5 w-3.5" />
        Export CSV
      </button>
      </div>

      {loading ? (
        <div className="border border-zinc-200 p-10 text-center text-sm text-zinc-500 dark:border-zinc-800">Loading...</div>
      ) : requests.length === 0 ? (
        <div className="border border-dashed border-zinc-300 p-10 text-center text-sm text-zinc-500 dark:border-zinc-700">
          No requests match your filters.
        </div>
      ) : (
        <div className="overflow-x-auto border border-zinc-200 dark:border-zinc-800">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wider text-zinc-500 dark:bg-zinc-950 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-bold">#</th>
                <th className="px-4 py-3 font-bold">Song</th>
                <th className="px-4 py-3 font-bold">Artist</th>
                <th className="px-4 py-3 font-bold">Event</th>
                <th className="px-4 py-3 font-bold">Requested</th>
                <th className="px-4 py-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-950/50">
                  <td className="px-4 py-3 tabular-nums text-zinc-400">{request.id}</td>
                  <td className="px-4 py-3 font-semibold">{request.song_name}</td>
                  <td className="px-4 py-3">{request.artist_name || <span className="text-zinc-400">—</span>}</td>
                  <td className="px-4 py-3">{request.event_name || <span className="text-zinc-400">—</span>}</td>
                  <td className="px-4 py-3 whitespace-nowrap text-zinc-500 dark:text-zinc-400">
                    <RelativeTime date={request.requested_at} />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`pill ${request.status === 'NEW' ? 'pill-new' : request.status === 'PLAYED' ? 'pill-played' : 'pill-rejected'}`}>
                      {request.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          {total} request{total === 1 ? '' : 's'} &middot; page {page} of {pages}
        </p>
        <div className="flex gap-2">
          <button type="button" className="btn-outline btn-sm" disabled={page <= 1} onClick={() => setOffset((value) => Math.max(0, value - PAGE_SIZE))}>
            <ChevronLeft className="h-3.5 w-3.5" />
            Previous
          </button>
          <button
            type="button"
            className="btn-outline btn-sm"
            disabled={page >= pages}
            onClick={() => setOffset((value) => value + PAGE_SIZE)}
          >
            Next
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}