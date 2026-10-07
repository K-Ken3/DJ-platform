import { IDLE, setWakeState } from './connection';

export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

// Free hosting instances sleep when idle and need ~30-60s to wake up. While asleep
// the platform edge answers 502/503 with no CORS headers, which Chrome reports as
// "blocked by CORS policy" / "Failed to fetch". Retry through that window, and keep
// the user informed with a live countdown so they don't give up.
const NETWORK_ERROR =
  "Can't reach the server right now. It may be waking up after being idle — please wait a moment and try again.";

const WAKING_UP = [502, 503, 504];
// Render's free instances need up to ~60s to wake, so the waits add up to ~56s.
const WAIT_MS = [3000, 8000, 15000, 30000];
// Waits (56s) plus a fetch round trip after each one — the countdown runs from this.
const WAKE_BUDGET_S = 60;
// Any request still in flight after this long shows the loading pill.
const SLOW_AFTER_MS = 2000;

// POSTs are usually not safe to replay (a song request, an event, a payment),
// but these only read/check and create nothing, so replaying them is harmless.
const REPLAYABLE_POSTS = ['/api/auth/login', '/api/auth/me'];

// Carries the HTTP status so callers can tell "your session ended" (401/403,
// which should log you out) apart from "the server hiccuped" (which should not).
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type WaitCtx = { woke: boolean };

let pending = 0;
let woke = 0;
let wakeSeconds = WAKE_BUDGET_S;
let wakeAttempt = 0;
let slowSince = 0;
let ticker: ReturnType<typeof setInterval> | null = null;

const isBrowser = () => typeof window !== 'undefined';

function publish(): void {
  if (!isBrowser()) return;
  if (woke > 0) {
    setWakeState({ visible: true, mode: 'waking', secondsLeft: wakeSeconds, elapsed: 0, attempt: wakeAttempt });
    return;
  }
  if (pending > 0 && Date.now() - slowSince >= SLOW_AFTER_MS) {
    setWakeState({
      visible: true,
      mode: 'loading',
      secondsLeft: 0,
      elapsed: Math.floor((Date.now() - slowSince) / 1000),
      attempt: 0,
    });
    return;
  }
  setWakeState(IDLE);
}

function ensureTicker(): void {
  if (!isBrowser() || ticker) return;
  ticker = setInterval(() => {
    if (woke > 0) wakeSeconds = Math.max(0, wakeSeconds - 1);
    publish();
  }, 1000);
}

function stopTicker(): void {
  if (!ticker) return;
  clearInterval(ticker);
  ticker = null;
}

function beginRequest(): void {
  if (pending === 0) slowSince = Date.now();
  pending += 1;
  ensureTicker();
  publish();
}

function endRequest(ctx: WaitCtx): void {
  pending = Math.max(0, pending - 1);
  if (ctx.woke) woke = Math.max(0, woke - 1);
  if (pending === 0) slowSince = 0;
  if (pending === 0 && woke === 0) {
    stopTicker();
    setWakeState(IDLE);
    return;
  }
  publish();
}

// First wait of a cold instance arms the countdown; later waits just advance the
// attempt number, because the budget is shared across the whole request.
function beginWake(ctx: WaitCtx, attempt: number): void {
  if (!ctx.woke) {
    ctx.woke = true;
    if (woke === 0) {
      wakeSeconds = WAKE_BUDGET_S;
      wakeAttempt = 0;
    }
    woke += 1;
  }
  wakeAttempt = attempt;
  ensureTicker();
  publish();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function replayingRequest(
  url: string,
  init: RequestInit,
  attempt: number,
  safeMethod: boolean,
  ctx: WaitCtx,
): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    // The connection dropped: the app may already have processed the request, so
    // only replay reads. Replaying a write here could duplicate data.
    if (!safeMethod || attempt >= WAIT_MS.length) throw new ApiError(NETWORK_ERROR, 0);
    beginWake(ctx, attempt);
    await sleep(WAIT_MS[attempt]);
    return replayingRequest(url, init, attempt + 1, safeMethod, ctx);
  }

  // 502/503/504 come from the hosting edge while the instance is asleep, before the
  // request reaches our code — so nothing was written and replaying is always safe.
  if (WAKING_UP.includes(res.status) && attempt < WAIT_MS.length) {
    beginWake(ctx, attempt);
    await sleep(WAIT_MS[attempt]);
    return replayingRequest(url, init, attempt + 1, safeMethod, ctx);
  }

  return res;
}

async function request(url: string, init: RequestInit): Promise<Response> {
  // Reads and these two POSTs never create data, so they are safe to replay even
  // if the connection drops. Every other write is replayed only on an edge 5xx.
  const method = (init.method || 'GET').toUpperCase();
  const safeMethod = method === 'GET' || method === 'HEAD' || REPLAYABLE_POSTS.some((p) => url.endsWith(p));

  const ctx: WaitCtx = { woke: false };
  beginRequest();
  try {
    return await replayingRequest(url, init, 0, safeMethod, ctx);
  } finally {
    endRequest(ctx);
  }
}

export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (isBrowser()) {
    const token = localStorage.getItem('dj_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await request(`${BACKEND_URL}${path}`, { ...options, headers });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(
      (data as { error?: string }).error || 'Something went wrong. Please try again.',
      res.status
    );
  }
  return data as T;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function downloadCsv(path: string, filename: string): Promise<void> {
  const headers: Record<string, string> = {};
  if (isBrowser()) {
    const token = localStorage.getItem('dj_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  const res = await request(`${BACKEND_URL}${path}`, { headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error((data as { error?: string }).error || 'Export failed.');
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
