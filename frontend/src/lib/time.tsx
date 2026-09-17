'use client';

import { useEffect, useState } from 'react';

export function formatRelativeTime(dateIso: string, now = Date.now()): string {
  const diffMs = now - new Date(dateIso).getTime();
  const seconds = Math.max(0, Math.floor(diffMs / 1000));

  if (seconds < 10) return 'Just now';
  if (seconds < 60) return `${seconds} sec ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} hrs ago`;
  return `${Math.floor(seconds / 86400)} days ago`;
}

export function exactTime(dateIso: string): string {
  return new Date(dateIso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

export function RelativeTime({ date, className }: { date: string; className?: string }) {
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setTick((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, []);

  return <time className={className}>{formatRelativeTime(date)}</time>;
}