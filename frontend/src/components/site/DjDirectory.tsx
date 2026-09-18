'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { MapPin, Search } from 'lucide-react';
import { Logo } from '@/components/site/Logo';
import type { PublicDj } from '@/lib/types';

function isBrandLogo(logo?: string | null) {
  return logo === '/logo.png' || logo === '/logo-white.png';
}

function DjLogo({ dj }: { dj: PublicDj }) {
  if (isBrandLogo(dj.logo)) {
    return <Logo className="h-8 w-auto sm:h-12" />;
  }
  if (dj.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={dj.logo} alt={`${dj.name} logo`} className="max-h-14 max-w-full object-contain sm:max-h-24" />
    );
  }
  return (
    <span className="flex h-14 w-14 items-center justify-center bg-accent/10 text-xl font-extrabold text-accent sm:h-20 sm:w-20 sm:text-2xl">
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
        <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-3">
          {filtered.map((dj) => (
            <article key={dj.slug} className="card flex flex-col p-4 sm:p-6">
              <Link
                href={`/dj/${dj.slug}`}
                className="flex h-20 items-center justify-center overflow-hidden rounded-xs bg-zinc-50 dark:bg-zinc-950/60 sm:h-28"
                aria-label={`View ${dj.name} profile`}
              >
                <DjLogo dj={dj} />
              </Link>

              <Link href={`/dj/${dj.slug}`} className="mt-3 text-lg font-extrabold leading-snug hover:text-accent sm:text-xl">
                {dj.name}
              </Link>
              <p className="mt-1 line-clamp-2 text-xs text-zinc-500 dark:text-zinc-400 sm:text-sm">
                {dj.tagline || 'Live song requests and unforgettable sets.'}
              </p>

              {dj.location && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                  <MapPin className="h-3.5 w-3.5" />
                  {dj.location}
                </p>
              )}

              {dj.events && dj.events.length > 0 && (
                <div className="mt-3 hidden flex-wrap gap-1.5 sm:flex">
                  {dj.events.slice(0, 2).map((event) => (
                    <span
                      key={event.id}
                      className="inline-flex items-center gap-1.5 rounded-xs border border-emerald-700/40 bg-emerald-500/10 px-2 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400"
                    >
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span className="max-w-24 truncate">{event.name}</span>
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-auto pt-4">
                <Link href={`/dj/${dj.slug}`} className="btn-outline btn-sm w-full">
                  View profile
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}