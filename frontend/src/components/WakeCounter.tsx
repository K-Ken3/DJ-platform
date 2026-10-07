'use client';

import { useSyncExternalStore } from 'react';
import { IDLE, getWakeState, subscribeWakeState } from '@/lib/connection';

// Mirrors WAKE_BUDGET_S in lib/api.ts so the bar fills steadily.
const WAKE_BUDGET_S = 60;

export function WakeCounter() {
  // Server always renders the idle state so hydration matches.
  const state = useSyncExternalStore(subscribeWakeState, getWakeState, () => IDLE);

  if (!state.visible) return null;

  const waking = state.mode === 'waking';
  const width = waking
    ? `${Math.min(100, Math.max(4, ((WAKE_BUDGET_S - state.secondsLeft) / WAKE_BUDGET_S) * 100))}%`
    : '35%';

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex justify-center px-4 pb-4 sm:pb-6"
    >
      <div className="pointer-events-auto w-full max-w-sm overflow-hidden rounded-xs border border-zinc-700 bg-zinc-900 px-4 py-3 text-white shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
        <div className="flex items-center gap-3">
          <span className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-zinc-600 border-t-white" />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold uppercase tracking-wider">
              {waking ? 'Waking up the server' : 'Still working on it'}
            </p>
            <p className="text-[11px] leading-snug text-zinc-400">
              {waking ? (
                <>
                  Our free server sleeps when nobody&apos;s visiting. Please stay —{' '}
                  <span className="font-bold text-white">{state.secondsLeft}s</span> left.
                </>
              ) : (
                <>
                  This is taking a little longer than usual —{' '}
                  <span className="font-bold text-white">{state.elapsed}s</span>. Please stay on this page.
                </>
              )}
            </p>
          </div>
        </div>
        <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-zinc-700">
          <div
            className={waking ? 'h-full bg-white transition-[width] duration-1000 ease-linear' : 'wake-indicator h-full bg-white'}
            style={waking ? { width } : undefined}
          />
        </div>
      </div>
    </div>
  );
}
