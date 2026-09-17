'use client';

import { CheckCircle2, Copy, Music2, Phone, Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme';

type Dj = {
  name: string;
  slug: string;
  logo?: string | null;
  tagline?: string | null;
};

type TipSettings = {
  mtn_momo_number: string;
  mtn_momo_ussd: string;
  momo_account_name: string;
  currency: string;
  suggested_tips: string[];
  tip_hint: string;
  djName: string;
};

const fallbackTips: TipSettings = {
  mtn_momo_number: '0788205500',
  mtn_momo_ussd: '*182*8*1*1540166*22000#',
  momo_account_name: 'Ken',
  currency: 'RWF',
  suggested_tips: ['1000', '2000', '5000'],
  tip_hint: 'Send a tip via MTN Mobile Money to support live music.',
  djName: 'DJ',
};

function DjMark({ dj }: { dj: Dj }) {
  if (dj.logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={dj.logo} alt={`${dj.name} logo`} className="h-9 w-9 object-contain" />
    );
  }
  return (
    <span className="flex h-9 w-9 items-center justify-center bg-accent/10 text-xs font-extrabold text-accent">
      {dj.name.replace(/[^a-zA-Z0-9]/g, '').slice(0, 2).toUpperCase() || 'DJ'}
    </span>
  );
}

export default function RequestPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const slug = params.slug;
  const { theme, toggle } = useTheme();
  const [dj, setDj] = useState<Dj | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [tips, setTips] = useState<TipSettings>(fallbackTips);
  const [eventCode, setEventCode] = useState('');
  const [songName, setSongName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [tipOpen, setTipOpen] = useState(false);
  const [tipState, setTipState] = useState<'idle' | 'opening' | 'fallback'>('idle');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const queryEvent = typeof searchParams?.event === 'string' ? searchParams.event : '';
    setEventCode(queryEvent);

    api<{ dj: Dj }>(`/api/dj/public/${encodeURIComponent(slug)}`)
      .then((data) => setDj(data.dj))
      .catch(() => setNotFound(true));

    api<{ settings: TipSettings }>(`/api/tips?slug=${encodeURIComponent(slug)}`)
      .then((data) => setTips(data.settings))
      .catch(() => setTips(fallbackTips));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug, searchParams?.event]);

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const song = songName.trim();
    if (!song) {
      setStatus('error');
      setMessage('Please enter a song name.');
      return;
    }

    setStatus('loading');
    setMessage('Sending request...');

    try {
      await api<{ request: { requested_at: string } }>('/api/requests', {
        method: 'POST',
        body: JSON.stringify({ songName: song, artistName: artistName.trim(), eventCode, slug }),
      });

      setStatus('success');
      setMessage('');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    }
  }

  function handleTip() {
    setTipOpen(true);
    setTipState('opening');

    const dialerUrl = `tel:${tips.mtn_momo_ussd}`;

    const timer = window.setTimeout(() => {
      try {
        window.location.href = dialerUrl;
      } catch {
        // ignore — fall back to copy flow below
      }
      window.setTimeout(() => setTipState('fallback'), 1200);
    }, 250);

    return () => window.clearTimeout(timer);
  }

  async function copyText(value: string, label: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(value).catch(() => {});
    }
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1600);
  }

  const displayName = dj?.name || 'DJ';

  return (
    <main className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Top brand bar */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            {dj ? <DjMark dj={dj} /> : <span className="h-9 w-9 bg-zinc-200 dark:bg-zinc-800" />}
            <div className="leading-tight border-l border-zinc-200 dark:border-zinc-800 pl-2.5">
              <span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400">Request a song</span>
              <span className="block text-sm font-extrabold">{displayName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-xs border border-emerald-300 bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Live
            </span>
            <button
              type="button"
              onClick={toggle}
              aria-label="Toggle theme"
              className="inline-flex h-8 w-8 items-center justify-center rounded-xs border border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 items-center px-4 py-8">
        <div className="mx-auto w-full max-w-md">
          {notFound ? (
            <div className="card card-pad py-12 text-center">
              <h1 className="text-2xl font-extrabold tracking-tight">DJ not available</h1>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                This DJ does not exist or has not been approved yet. Check the link and try again.
              </p>
              <a href="/" className="btn-primary mt-6">
                Browse DJs
              </a>
            </div>
          ) : status === 'success' ? (
            <div className="card card-pad flex flex-col items-center py-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="h-8 w-8" />
              </span>
              <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Request sent!</h1>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {songName || 'Your song'} has been sent to the DJ booth.
              </p>
              <p className="mt-1 text-sm font-semibold text-emerald-600 dark:text-emerald-400">Request received just now</p>
              <div className="mt-8 flex w-full flex-col gap-3">
                <button type="button" className="btn-primary btn-lg" onClick={() => setStatus('idle')}>
                  Request another song
                </button>
                <button type="button" className="btn-outline" onClick={handleTip}>
                  Donate a tip
                </button>
              </div>
            </div>
          ) : (
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-extrabold tracking-tight">{dj?.tagline || 'What should I play next?'}</h1>
              <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">Takes less than 10 seconds</p>
            </div>
          )}

          {!notFound && status !== 'success' && (
            <form onSubmit={submitRequest} className="card card-pad" aria-live="polite">
              <div>
                <label htmlFor="song-name">Song name</label>
                <input
                  id="song-name"
                  type="text"
                  value={songName}
                  onChange={(event) => setSongName(event.target.value)}
                  placeholder="Enter the song you want to hear"
                  required
                  maxLength={120}
                  autoComplete="off"
                />
              </div>

              <div className="mt-4">
                <label htmlFor="artist-name">Artist name</label>
                <input
                  id="artist-name"
                  type="text"
                  value={artistName}
                  onChange={(event) => setArtistName(event.target.value)}
                  placeholder="Artist name (optional)"
                  maxLength={120}
                  autoComplete="off"
                />
              </div>

              <button type="submit" className="btn-primary btn-lg btn-block mt-6" disabled={status === 'loading' || !dj}>
                {!dj ? 'Loading...' : status === 'loading' ? 'Sending request...' : 'Request'}
              </button>

              <button type="button" onClick={handleTip} className="btn-outline btn-lg btn-block mt-3">
                Donate a tip
              </button>

              {status === 'error' && message && (
                <p className="mt-4 rounded-xs border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
                  {message}
                </p>
              )}
            </form>
          )}

          {tipOpen && (
            <div className="card card-pad mt-6" role="dialog" aria-modal="false" aria-label="Donate a tip">
              {tipState === 'opening' ? (
                <div className="flex flex-col items-center py-6 text-center">
                  <Phone className="h-8 w-8 text-accent" />
                  <p className="mt-3 font-semibold">Opening MTN Mobile Money...</p>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    If nothing happens, copy the code below.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-extrabold">Donate a tip</h2>
                    <span className="pill pill-played">MTN MoMo</span>
                  </div>
                  <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                    {tips.tip_hint || 'Your tip goes straight to the DJ via MTN Mobile Money.'}
                  </p>

                  <div className="mt-5 space-y-4">
                    <div className="surface-2 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Account name</p>
                      <p className="mt-1 text-base font-bold">{tips.momo_account_name || 'Ken'}</p>
                    </div>

                    <div className="surface-2 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">USSD code</p>
                          <p className="mt-1 font-mono text-base font-bold">{tips.mtn_momo_ussd}</p>
                        </div>
                        <button type="button" className="btn-outline btn-sm" onClick={() => copyText(tips.mtn_momo_ussd, 'ussd')}>
                          <Copy className="h-3.5 w-3.5" />
                          {copied === 'ussd' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>

                    <div className="surface-2 p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Number</p>
                          <p className="mt-1 text-base font-bold">{tips.mtn_momo_number}</p>
                        </div>
                        <button type="button" className="btn-outline btn-sm" onClick={() => copyText(tips.mtn_momo_number, 'number')}>
                          <Copy className="h-3.5 w-3.5" />
                          {copied === 'number' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {tips.suggested_tips.length > 0 && (
                    <div className="mt-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Suggested amounts ({tips.currency})
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tips.suggested_tips.map((amount) => (
                          <span key={amount} className="btn-outline btn-sm cursor-default">
                            {Number(amount).toLocaleString()} {tips.currency}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <p className="mt-5 flex items-start gap-2 rounded-xs border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                    <Music2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Open your phone dialer and enter the code above to send a tip. We never ask for your MoMo PIN.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      <footer className="border-t border-zinc-200 py-4 text-center text-xs text-zinc-400 dark:border-zinc-800 dark:text-zinc-500">
        Request a song, tip the DJ &middot; {displayName} on DJLink
      </footer>
    </main>
  );
}