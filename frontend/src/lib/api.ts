export const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';

// Free hosting instances sleep when idle and need ~30-60s to wake up. While asleep
// the platform edge answers 502/503 with no CORS headers, which Chrome reports as
// "blocked by CORS policy" / "Failed to fetch". Retry through that window, then
// report it in plain language.
const NETWORK_ERROR =
  "Can't reach the server right now. It may be waking up after being idle — please wait a moment and try again.";

const WAKING_UP = [502, 503, 504];
// Render's free instances need up to ~60s to wake, so the waits add up to ~56s.
const WAIT_MS = [3000, 8000, 15000, 30000];

// POSTs are usually not safe to replay (a song request, an event, a payment),
// but these only read/check and create nothing, so replaying them is harmless.
const REPLAYABLE_POSTS = ['/api/auth/login', '/api/auth/me'];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(url: string, init: RequestInit, attempt = 0): Promise<Response> {
  // Only replay safe reads. Replaying a POST could double-submit a song request,
  // an event, or a payment, so those surface the message for a manual retry.
  const method = (init.method || 'GET').toUpperCase();
  const replayable = method === 'GET' || method === 'HEAD' || REPLAYABLE_POSTS.some((p) => url.endsWith(p));

  let res: Response;
  try {
    res = await fetch(url, init);
  } catch {
    if (!replayable || attempt >= WAIT_MS.length) throw new Error(NETWORK_ERROR);
    await sleep(WAIT_MS[attempt]);
    return request(url, init, attempt + 1);
  }

  if (replayable && WAKING_UP.includes(res.status) && attempt < WAIT_MS.length) {
    await sleep(WAIT_MS[attempt]);
    return request(url, init, attempt + 1);
  }

  return res;
}

export async function api<T = unknown>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('dj_token');
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await request(`${BACKEND_URL}${path}`, { ...options, headers });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error((data as { error?: string }).error || 'Something went wrong. Please try again.');
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
  if (typeof window !== 'undefined') {
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