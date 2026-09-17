'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { MapPin, Music2, Search } from 'lucide-react';
import type { PublicDj } from '@/lib/types';

function DjLogo({ dj }: { dj: PublicDj }) {
  if (dj.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={dj.logo} alt={`${dj.name} logo`} className="max-h-24 max-w-full object-contain" />
    );
  }
  return (
    <span className="flex h-24 w-24 items-center justify-center bg-accent/10 text-3xl font-extrabold text-accent">
      {dj.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'DJ'}
    </span>
  );
}

export function DjDirectory({ djs }: { djs: PublicDj[] }) {
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return djs;
    return djs.filter((dj) =>
      [dj.name, dj.tagline, dj.location].filter(Boolean).some((value) => String(value).toLowerCase().includes(q))
    );
  }, [djs, query]);

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {djs.length} {djs.length === 1 ? 'DJ' : 'DJs'} available
        </p>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or city"
            className="pl-9"
            aria-label="Search DJs"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="card card-pad py-14 text-center">
          <p className="text-lg font-bold">No DJs found</p>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            {djs.length === 0
              ? 'Be the first DJ on DJLink and start taking live requests.'
              : 'Try a different search term.'}
          </p>
          {djs.length === 0 && (
            <Link href="/admin/register" className="btn-primary mt-6">
              Join as a DJ
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((dj) => (
            <article key={dj.slug} className="card card-pad flex flex-col">
              <div className="mb-5 flex h-32 items-center justify-center overflow-hidden bg-zinc-50 dark:bg-zinc-950/60">
                <DjLogo dj={dj} />
              </div>

              <h3 className="text-xl font-extrabold leading-snug">{dj.name}</h3>
              <p className="mt-1.5 line-clamp-2 text-sm text-zinc-500 dark:text-zinc-400">
                {dj.tagline || 'Live song requests and unforgettable sets.'}
              </p>

              {dj.location && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-zinc-400">
                  <MapPin className="h-3.5 w-3.5" />
                  {dj.location}
                </p>
              )}

              {dj.events && dj.events.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {dj.events.slice(0, 2).map((event) => (
                    <span
                      key={event.id}
                      className="inline-flex items-center gap-1.5 rounded-xs border border-emerald-700/40 bg-emerald-500/10 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      {event.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-auto pt-6">
                <p className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
                  <Music2 className="h-3.5 w-3.5" />
                  Scan the event QR code to request a song
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}