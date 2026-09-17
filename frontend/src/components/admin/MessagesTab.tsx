'use client';

import { Mail, MessageSquare } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { BookingMessage } from '@/lib/types';
import { exactTime } from '@/lib/time';

export function MessagesTab() {
  const [messages, setMessages] = useState<BookingMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ bookings: BookingMessage[] }>('/api/admin/bookings')
      .then((data) => setMessages(data.bookings || []))
      .catch(() => setMessages([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="border border-zinc-200 p-10 text-center text-sm text-zinc-500 dark:border-zinc-800">Loading...</div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center border border-dashed border-zinc-300 p-12 text-center dark:border-zinc-700">
          <MessageSquare className="h-8 w-8 text-zinc-300 dark:text-zinc-600" />
          <p className="mt-3 font-semibold">No booking messages yet.</p>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Messages from the contact form will appear here.</p>
        </div>
      ) : (
        <ul className="divide-y divide-zinc-200 border border-zinc-200 dark:divide-zinc-800 dark:border-zinc-800">
          {messages.map((message) => (
            <li key={message.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-bold">{message.name}</p>
                <span className="text-xs text-zinc-400">{exactTime(message.created_at)}</span>
              </div>
              <a
                href={`mailto:${message.email}`}
                className="mt-1 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
              >
                <Mail className="h-3.5 w-3.5" />
                {message.email}
              </a>
              {message.phone && <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{message.phone}</p>}
              {(message.event_type || message.event_date) && (
                <p className="mt-1 text-xs uppercase tracking-wider text-zinc-400">
                  {[message.event_type, message.event_date].filter(Boolean).join(' · ')}
                </p>
              )}
              {message.message && <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">{message.message}</p>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}