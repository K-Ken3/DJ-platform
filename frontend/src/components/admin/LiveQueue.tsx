'use client';

import { Inbox, Trash2, XCircle } from 'lucide-react';
import type { Overview, RequestItem } from '@/lib/types';
import { RelativeTime, exactTime } from '@/lib/time';
import { ConfirmButton } from '../Modal';

export function StatCards({ overview }: { overview: Overview | null }) {
  const cards = [
    { label: 'Requests today', value: overview?.requests_today ?? 0 },
    { label: 'This event', value: overview?.requests_this_event ?? 0 },
    { label: 'Pending', value: overview?.pending ?? 0 },
    { label: 'Played', value: overview?.songs_played ?? 0 },
    { label: 'This week', value: overview?.requests_this_week ?? 0 },
    { label: 'Total', value: overview?.total_requests ?? 0 },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      {cards.map((card) => (
        <div key={card.label} className="card card-pad !p-4">
          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{card.label}</p>
          <p className="mt-2 text-2xl font-extrabold tabular-nums">{card.value}</p>
        </div>
      ))}
    </div>
  );
}

export function LiveQueue({
  requests,
  onUpdateStatus,
  onDelete,
}: {
  requests: RequestItem[];
  onUpdateStatus: (id: number, status: 'PLAYED' | 'REJECTED' | 'NEW') => void;
  onDelete: (id: number) => void;
}) {
  if (requests.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center border border-dashed border-zinc-300 bg-zinc-50 px-6 py-16 text-center dark:border-zinc-700 dark:bg-zinc-950/50">
        <Inbox className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
        <p className="mt-3 font-semibold">No song requests yet.</p>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          New requests will appear here automatically in real time.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-zinc-200 border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
      {requests.map((request) => (
        <li key={request.id} className={`flex flex-col gap-3 p-4 sm:flex-row sm:items-start sm:justify-between ${request.status === 'NEW' ? 'bg-accent-dim/40 dark:bg-accent/5' : ''}`}>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate text-lg font-bold">{request.song_name}</p>
              <span className={`pill ${request.status === 'NEW' ? 'pill-new' : request.status === 'PLAYED' ? 'pill-played' : 'pill-rejected'}`}>
                {request.status}
              </span>
            </div>
            <p className="mt-0.5 text-sm font-medium text-zinc-500 dark:text-zinc-400">{request.artist_name || 'Unknown artist'}</p>
            <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400 dark:text-zinc-500">
              <RelativeTime date={request.requested_at} />
              {request.event_name && <span>{request.event_name}</span>}
              <span className="text-zinc-300 dark:text-zinc-600">#{request.id}</span>
            </p>
            <p className="mt-1 text-[11px] text-zinc-300 dark:text-zinc-600">Exact: {exactTime(request.requested_at)}</p>
          </div>

          <div className="flex shrink-0 gap-2">
            {request.status !== 'PLAYED' && (
              <button type="button" className="btn-outline btn-sm" onClick={() => onUpdateStatus(request.id, 'PLAYED')}>
                Played
              </button>
            )}
            {request.status !== 'REJECTED' && (
              <button type="button" className="btn-outline btn-sm" onClick={() => onUpdateStatus(request.id, 'REJECTED')}>
                <XCircle className="h-3.5 w-3.5" />
                Reject
              </button>
            )}
            <ConfirmButton onConfirm={() => onDelete(request.id)} label={`Delete "${request.song_name}"?`}>
              <Trash2 className="h-3.5 w-3.5" />
            </ConfirmButton>
          </div>
        </li>
      ))}
    </ul>
  );
}