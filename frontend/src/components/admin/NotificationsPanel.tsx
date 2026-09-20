'use client';

import { Bell, CheckCircle2, ChevronRight, Info, TriangleAlert, XCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { RelativeTime } from '@/lib/time';
import type { NotificationItem } from '@/lib/types';

const iconFor = {
  success: <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />,
  warning: <TriangleAlert className="h-4 w-4 text-amber-600 dark:text-amber-400" />,
  error: <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />,
  info: <Info className="h-4 w-4 text-accent" />,
};

export function NotificationsPanel() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const close = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  const load = () => {
    api<{ items: NotificationItem[]; unread: number }>('/api/notifications')
      .then((data) => {
        setItems(data.items || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const unread = items.filter((item) => item.action === 'REMIND').length > 0 ? 1 : 0;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        className="relative inline-flex items-center justify-center rounded-xs border border-zinc-200 bg-white p-2 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800"
        onClick={() => {
          setOpen((value) => !value);
          if (!open) load();
        }}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {items.length > 0 && unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-xs border border-zinc-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-2.5 dark:border-zinc-800">
            <p className="text-xs font-extrabold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Notifications</p>
            {items.length > 0 && (
              <span className="pill">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </span>
            )}
          </div>
          {loading ? (
            <p className="p-6 text-center text-sm text-zinc-500">Loading...</p>
          ) : items.length === 0 ? (
            <p className="p-6 text-center text-sm text-zinc-500">
              You're all caught up.
              <span className="mt-1 block text-xs text-zinc-400">Membership reminders will appear here.</span>
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-zinc-100 overflow-y-auto dark:divide-zinc-800">
              {items.map((item) => (
                <li key={item.id} className="flex items-start gap-3 px-4 py-3">
                  <span className="mt-0.5 shrink-0">{iconFor[item.kind] || iconFor.info}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold leading-tight">{item.title}</p>
                    {item.body ? <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{item.body}</p> : null}
                    {item.created_at ? (
                      <p className="mt-0.5 text-[11px] text-zinc-400">
                        <RelativeTime date={item.created_at} />
                      </p>
                    ) : null}
                  </div>
                  {item.action === 'REMIND' ? <ChevronRight className="mt-1 h-3.5 w-3.5 shrink-0 text-zinc-300 dark:text-zinc-600" /> : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}