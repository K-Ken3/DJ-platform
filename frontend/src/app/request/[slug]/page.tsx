'use client';

import { CalendarX, CheckCircle2, Copy, Music2, Phone, Sun, Moon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Logo } from '@/components/site/Logo';
import { useTheme } from '@/lib/theme';

type Dj = {
  name: string;
  slug: string;
  logo?: string | null;
  tagline?: string | null;
};

type DjEvent = {
  id: number;
  name: string;
  event_code: string;
  active: number;
};

type TipSettings = {
  tipsEnabled: boolean;
  mtn_momo_number?: string;
  momo_account_name?: string;
  currency: string;
  suggested_tips: string[];
  tip_hint: string;
  djName: string;
};

const fallbackTips: TipSettings = {
  tipsEnabled: false,
  mtn_momo_number: '',
  momo_account_name: '',
  currency: 'RWF',
  suggested_tips: ['1000', '2000', '5000'],
  tip_hint: 'Send a tip via MTN Mobile Money to support live music.',
  djName: 'DJ',
};

function isBrandLogo(logo?: string | null) {
  return logo === '/logo.png' || logo === '/logo-white.png';
}

function DjMark({ dj }: { dj: Dj }) {
  if (isBrandLogo(dj.logo)) {
    return <Logo className="h-5 w-auto" />;
  }
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
  const [events, setEvents] = useState<DjEvent[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [tips, setTips] = useState<TipSettings>(fallbackTips);
  const [eventCode, setEventCode] = useState('');
  const [songName, setSongName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [tipOpen, setTipOpen] = useState(false);
  const [tipState, setTipState] = useState<'idle' | 'opening' | 'fallback'>('idle');
  const [tipAmount, setTipAmount] = useState('');
  const [dialCode, setDialCode] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const queryEvent = typeof searchParams?.event === 'string' ? searchParams.event : '';
    setEventCode(queryEvent);

    api<{ dj: Dj; events: DjEvent[] }>(`/api/dj/public/${encodeURIComponent(slug)}`)
      .then((data) => {
        setDj(data.dj);
        setEvents(data.events || []);
      })
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
    setTipAmount('');
    setTipOpen(true);
    setTipState('idle');
  }

  function openMomo(amount: string) {
    if (!tips.tipsEnabled) return;
    setTipState('opening');

    const momo = tips.mtn_momo_number || '';
    const dial = momo ? (amount ? `*182*1*1*${momo}*${amount}#` : `*182*1*1*${momo}#`) : '';
    setDialCode(dial);

    window.setTimeout(() => {
      try {
        window.location.href = `tel:${dial}`;
      } catch {
        // ignore — fall back to copy flow below
      }
      window.setTimeout(() => setTipState('fallback'), 1200);
    }, 250);
  }

  async function copyText(value: string, label: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(value).catch(() => {});
    }
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1600);
  }

  const displayName = dj?.name || 'DJ';
  const matchedEvent = eventCode ? events.find((event) => event.event_code === eventCode) : null;
  const hasActiveEvent = eventCode ? Boolean(matchedEvent?.active) : events.some((event) => Boolean(event.active));
  const eventEnded = Boolean(dj) && !hasActiveEvent;

  return (
    <main className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Top brand bar */}
      <header className="border-b border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex h-14 max-w-md items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            {dj ? <DjMark dj={dj} /> : <span className="h-9 w-9 bg-zinc-200 dark:bg-zinc-800" />}
            <div className="leading-tight border-l border-zinc-200 dark:border-zinc-800 pl-2.5">
              <span className="block text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400">
                {eventEnded ? 'Event ended' : 'Request a song'}
              </span>
              <span className="block text-sm font-extrabold">{displayName}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {eventEnded ? (
              <span className="inline-flex items-center gap-1.5 rounded-xs border border-zinc-300 bg-zinc-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                <span className="h-1.5 w-1.5 rounded-full bg-zinc-400" />
                Ended
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-xs border border-emerald-300 bg-emerald-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Live
              </span>
            )}
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
          ) : eventEnded ? (
            <div className="card card-pad flex flex-col items-center py-12 text-center">
              <span className="flex h-14 w-14 items-center justify-center bg-zinc-500/10 text-zinc-500 dark:text-zinc-400">
                <CalendarX className="h-8 w-8" />
              </span>
              <h1 className="mt-5 text-2xl font-extrabold tracking-tight">This event has ended</h1>
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                {matchedEvent
                  ? `${matchedEvent.name} is no longer accepting song requests.`
                  : `${displayName} is not live in any event right now, so song requests are paused.`}
              </p>
              <p className="mt-2 text-sm font-semibold text-accent">Stay tuned for the upcoming event.</p>
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

          {!notFound && !eventEnded && status !== 'success' && (
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
                    Confirm the payment on your phone.
                  </p>
                </div>
              ) : !tips.tipsEnabled ? (
                <div className="flex flex-col items-center py-8 text-center">
                  <span className="flex h-14 w-14 items-center justify-center bg-zinc-500/10 text-zinc-500 dark:text-zinc-400">
                    <Music2 className="h-8 w-8" />
                  </span>
                  <h2 className="mt-4 text-lg font-extrabold">Tipping is not available yet</h2>
                  <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                    {tips.djName || 'This DJ'} has not set up mobile money tipping yet. Check back later.
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-extrabold">Donate a tip</h2>
                    <span className="pill pill-played">MTN MoMo</span>
                  </div>
                  <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                    {tips.tip_hint || `Your tip goes straight to ${tips.momo_account_name || tips.djName} via MTN Mobile Money.`}
                  </p>

                  <div className="mt-5 space-y-4">
                    <div className="surface-2 p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Paying</p>
                      <p className="mt-1 text-base font-bold">{tips.momo_account_name || tips.djName || 'DJ'}</p>
                      <p className="mt-0.5 font-mono text-sm text-zinc-500 dark:text-zinc-400">{tips.mtn_momo_number}</p>
                    </div>
                  </div>

                  {tips.suggested_tips.length > 0 && (
                    <div className="mt-5">
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                        Choose amount ({tips.currency})
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {tips.suggested_tips.map((amount) => (
                          <button
                            key={amount}
                            type="button"
                            onClick={() => setTipAmount(amount)}
                            className={`btn-sm ${tipAmount === amount ? 'btn-primary' : 'btn-outline'}`}
                          >
                            {Number(amount).toLocaleString()} {tips.currency}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <button
                    type="button"
                    className="btn-primary btn-lg btn-block mt-5"
                    disabled={!tipAmount}
                    onClick={() => openMomo(tipAmount)}
                  >
                    {tipAmount ? `Open MoMo & send ${Number(tipAmount).toLocaleString()} ${tips.currency}` : 'Select an amount above'}
                  </button>

                  {tipState === 'fallback' ? (
                    <div className="surface-2 mt-4 flex items-center justify-between p-4">
                      <div className="min-w-0">
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Mobile money code</p>
                        <p className="mt-1 truncate font-mono text-sm font-bold">{dialCode}</p>
                      </div>
                      <button type="button" className="btn-outline btn-sm" onClick={() => copyText(dialCode, 'dial')}>
                        <Copy className="h-3.5 w-3.5" />
                        {copied === 'dial' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  ) : null}

                  <p className="mt-4 flex items-start gap-2 rounded-xs border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
                    <Music2 className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    Your phone dialer opens with {tips.mtn_momo_number} and your chosen amount pre-filled. We never
                    ask for your MoMo PIN.
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