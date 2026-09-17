'use client';

import {
  Ban,
  CalendarDays,
  CheckCircle2,
  Clock,
  Copy,
  FileText,
  Inbox,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Music4,
  Radio,
  ScrollText,
  Settings2,
  UserCog,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useRouter } from 'next/navigation';

import { BlogTab } from '@/components/admin/BlogTab';
import { EventsTab } from '@/components/admin/EventsTab';
import { HistoryTab } from '@/components/admin/HistoryTab';
import { Logo } from '@/components/site/Logo';
import { LiveQueue, StatCards } from '@/components/admin/LiveQueue';
import { MessagesTab } from '@/components/admin/MessagesTab';
import { ProfileTab } from '@/components/admin/ProfileTab';
import { SettingsTab } from '@/components/admin/SettingsTab';
import { BACKEND_URL, api } from '@/lib/api';
import { playNotificationSound } from '@/lib/sound';
import type { EventItem, Overview, RegistrationInfo, RequestItem, SubscriptionRecord } from '@/lib/types';

type TabId = 'live' | 'history' | 'events' | 'blog' | 'profile' | 'settings' | 'messages';

const tabs: { id: TabId; label: string; icon: typeof Radio }[] = [
  { id: 'live', label: 'Live Requests', icon: Radio },
  { id: 'history', label: 'History', icon: ScrollText },
  { id: 'events', label: 'Events', icon: CalendarDays },
  { id: 'blog', label: 'Blog', icon: FileText },
  { id: 'profile', label: 'Profile', icon: UserCog },
  { id: 'settings', label: 'Tipping', icon: Settings2 },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
];

type Toast = { id: number; title: string; body: string };

function ToastStack({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2">
      {toasts.map((toast) => (
        <div key={toast.id} className="card pointer-events-auto flex items-start gap-3 p-4" role="status">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center bg-accent/10 text-accent">
            <Music4 className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-bold">{toast.title}</p>
            <p className="mt-0.5 truncate text-sm text-zinc-500 dark:text-zinc-400">{toast.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const socketRef = useRef<Socket | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>('live');
  const [loading, setLoading] = useState(true);
  const [socketLive, setSocketLive] = useState(false);
  const [djName, setDjName] = useState('Dashboard');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [events, setEvents] = useState<EventItem[]>([]);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [gate, setGate] = useState<null | { status: string; name: string }>(null);
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [registrationInfo, setRegistrationInfo] = useState<RegistrationInfo | null>(null);
  const [reference, setReference] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [gateError, setGateError] = useState('');

  const pushToast = useCallback((title: string, body: string) => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, title, body }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 5000);
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('dj_token');
    if (!savedToken) {
      router.push('/admin/login');
      return;
    }
    setToken(savedToken);
  }, [router]);

  const loadDashboard = useCallback(async () => {
    const [overviewData, statsData] = await Promise.all([
      api<{ overview: Overview }>('/api/admin/overview'),
      api<{ requests: RequestItem[]; events: EventItem[]; dj: { name: string; logo?: string | null } }>('/api/admin/stats'),
    ]);
    setOverview(overviewData.overview);
    setRequests(statsData.requests || []);
    setEvents(statsData.events || []);
    if (statsData.dj?.name) setDjName(statsData.dj.name);
  }, []);

  useEffect(() => {
    if (!token) return;
    api<{ user: { role: string; status: string; name: string }; subscription: SubscriptionRecord | null }>('/api/auth/me')
      .then(async (me) => {
        if (me.user.role === 'SUPERADMIN') {
          router.replace('/admin/super');
          return;
        }
        if (me.user.status !== 'ACTIVE') {
          setGate({ status: me.user.status, name: me.user.name });
          setDjName(me.user.name);
          setSubscription(me.subscription);
          if (me.user.status === 'PENDING') {
            api<RegistrationInfo>('/api/registration-info').then(setRegistrationInfo).catch(() => {});
          }
          setLoading(false);
          return;
        }
        await loadDashboard();
        setLoading(false);
      })
      .catch(() => router.push('/admin/login'));
  }, [token, loadDashboard, router]);

  useEffect(() => {
    if (!token) return;

    const socket = io(BACKEND_URL, {
      transports: ['websocket'],
      auth: { token },
    });
    socketRef.current = socket;

    socket.on('connect', () => setSocketLive(true));
    socket.on('disconnect', () => setSocketLive(false));
    socket.on('connect_error', () => setSocketLive(false));

    socket.on('request:new', (payload: RequestItem) => {
      setRequests((current) => [payload, ...current.filter((item) => item.id !== payload.id)]);
      setOverview((current) =>
        current
          ? {
              ...current,
              total_requests: current.total_requests + 1,
              pending: current.pending + 1,
              requests_today: current.requests_today + 1,
              requests_this_week: current.requests_this_week + 1,
              requests_this_event: payload.event_id ? current.requests_this_event + 1 : current.requests_this_event,
            }
          : current
      );
      playNotificationSound();
      pushToast('New request', `${payload.song_name}${payload.artist_name ? ` — ${payload.artist_name}` : ''}`);
    });

    socket.on('request:updated', (payload: RequestItem) => {
      setRequests((current) => current.map((item) => (item.id === payload.id ? payload : item)));
    });

    socket.on('request:deleted', ({ id }: { id: number }) => {
      setRequests((current) => current.filter((item) => item.id !== id));
    });

    socket.on('event:updated', () => {
      loadDashboard().catch(() => {});
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, loadDashboard, pushToast]);

  async function updateStatus(requestId: number, status: 'PLAYED' | 'REJECTED' | 'NEW') {
    try {
      const data = await api<{ request: RequestItem }>(`/api/requests/${requestId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      setRequests((current) => current.map((item) => (item.id === data.request.id ? data.request : item)));
      setOverview((current) =>
        current
          ? {
              ...current,
              pending: status === 'NEW' ? current.pending + 1 : Math.max(0, current.pending - 1),
              songs_played: status === 'PLAYED' ? current.songs_played + 1 : current.songs_played,
              rejected: status === 'REJECTED' ? current.rejected + 1 : current.rejected,
            }
          : current
      );
    } catch {
      // keep UI in sync by reloading the whole dashboard
      loadDashboard().catch(() => {});
    }
  }

  async function deleteRequest(requestId: number) {
    try {
      await api(`/api/requests/${requestId}`, { method: 'DELETE' });
      setRequests((current) => current.filter((item) => item.id !== requestId));
    } catch {
      loadDashboard().catch(() => {});
    }
  }

  function logout() {
    localStorage.removeItem('dj_token');
    router.push('/admin/login');
  }

  async function submitPayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setGateError('');
    try {
      const data = await api<{ subscription: SubscriptionRecord }>('/api/dj/payment', {
        method: 'POST',
        body: JSON.stringify({ reference, amount: registrationInfo?.subscription_fee }),
      });
      setSubscription(data.subscription);
      setShowPaymentForm(false);
    } catch (err) {
      setGateError(err instanceof Error ? err.message : 'Could not submit payment reference.');
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">Loading dashboard...</p>
      </main>
    );
  }

  if (gate) {
    const pending = gate.status === 'PENDING';
    const blocked = gate.status === 'REJECTED' || gate.status === 'SUSPENDED';
    const paymentSent = subscription && subscription.status === 'SUBMITTED';

    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-4 py-12 dark:bg-zinc-950">
        <div className="w-full max-w-md">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Logo className="h-8 w-auto" />
              <div className="leading-tight">
                <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400">DJ Admin</p>
                <p className="text-sm font-extrabold">{gate.name}</p>
              </div>
            </div>
            <button type="button" className="btn-ghost" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <div className="card card-pad">
            {blocked ? (
              <div className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center bg-red-500/10 text-red-600 dark:text-red-400">
                  <Ban className="h-8 w-8" />
                </span>
                <h1 className="mt-5 text-2xl font-extrabold tracking-tight">
                  {gate.status === 'SUSPENDED' ? 'Account suspended' : 'Application not approved'}
                </h1>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Your DJ account is currently <span className="font-semibold">{gate.status.toLowerCase()}</span>. Please
                  contact the DJLink team if you think this is a mistake.
                </p>
                <a href="/#contact" className="btn-primary mt-6">
                  Contact support
                </a>
              </div>
            ) : pending && paymentSent && !showPaymentForm ? (
              <div className="text-center">
                <span className="mx-auto flex h-14 w-14 items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-8 w-8" />
                </span>
                <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Payment submitted</h1>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  Reference <span className="font-mono font-semibold">{subscription?.transaction_reference}</span> is
                  being verified. Your account will be activated within 24 hours.
                </p>
                <div className="mt-6 flex flex-col gap-3">
                  <button type="button" className="btn-outline" onClick={() => setShowPaymentForm(true)}>
                    Update reference
                  </button>
                  <button type="button" className="btn-outline" onClick={logout}>
                    Log out
                  </button>
                </div>
              </div>
            ) : pending ? (
              <>
                <span className="pill pill-new w-fit">
                  <Clock className="h-3 w-3" />
                  Pending approval
                </span>
                <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Activate your account</h1>
                <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  Pay the one-time membership with MTN Mobile Money, then submit the transaction reference for
                  verification.
                </p>

                <div className="mt-6 space-y-3">
                  <div className="surface-2 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Membership fee</p>
                    <p className="mt-1 text-lg font-extrabold">
                      ${registrationInfo?.subscription_fee_usd ?? 15} <span className="text-sm font-bold text-zinc-400">USD</span>
                    </p>
                    <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                      ≈ {(registrationInfo?.subscription_fee ?? 22000).toLocaleString()} {registrationInfo?.currency || 'RWF'} to pay
                    </p>
                  </div>
                  <div className="surface-2 p-4">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Account name</p>
                    <p className="mt-1 text-base font-bold">{registrationInfo?.momo_account_name || 'Ken'}</p>
                  </div>
                  <div className="surface-2 flex items-center justify-between p-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">USSD code</p>
                      <p className="mt-1 font-mono text-base font-bold">{registrationInfo?.mtn_momo_ussd || '*182*8*1*1540166*22000#'}</p>
                    </div>
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      onClick={() => navigator.clipboard?.writeText(registrationInfo?.mtn_momo_ussd || '')}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </button>
                  </div>
                  <div className="surface-2 flex items-center justify-between p-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">MoMo number</p>
                      <p className="mt-1 font-mono text-base font-bold">{registrationInfo?.mtn_momo_number || '0789630452'}</p>
                    </div>
                    <button
                      type="button"
                      className="btn-outline btn-sm"
                      onClick={() => navigator.clipboard?.writeText(registrationInfo?.mtn_momo_number || '')}
                    >
                      <Copy className="h-3.5 w-3.5" />
                      Copy
                    </button>
                  </div>
                </div>

                <form onSubmit={submitPayment} className="mt-6 grid gap-4">
                  <div>
                    <label htmlFor="gate-reference">Transaction reference</label>
                    <input
                      id="gate-reference"
                      type="text"
                      value={reference}
                      onChange={(event) => setReference(event.target.value)}
                      placeholder="e.g. MP240917.1234.A56789"
                      required
                      minLength={4}
                    />
                  </div>
                  {gateError && <p className="rounded-xs border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">{gateError}</p>}
                  <button type="submit" className="btn-primary btn-lg">
                    Submit payment reference
                  </button>
                </form>
              </>
            ) : null}
          </div>
        </div>
      </main>
    );
  }

  const sidebarNav = (
    <>
      <div className="mb-6 flex items-center gap-3 px-1">
        <Logo className="h-8 w-auto" />
        <div className="leading-tight">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400">DJ Admin</p>
          <p className="text-sm font-extrabold">{djName}</p>
        </div>
      </div>

      <nav className="flex flex-col gap-1">
        {tabs.map((item) => {
          const Icon = item.icon;
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex items-center gap-3 rounded-xs px-3 py-2.5 text-sm font-semibold ${
                active
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </button>
          );
        })}
      </nav>
    </>
  );

  const bottomNav = (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white lg:hidden dark:border-zinc-800 dark:bg-zinc-900">
      <div className="grid grid-cols-7">
        {tabs.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold uppercase tracking-wide ${
                tab === item.id ? 'text-accent' : 'text-zinc-400'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.id === 'live' ? 'Live' : item.label}
            </button>
          );
        })}
      </div>
    </nav>
  );

  return (
    <main className="min-h-screen lg:pl-64">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-zinc-200 bg-zinc-50 p-4 lg:flex dark:border-zinc-800 dark:bg-zinc-950">
        {sidebarNav}

        <div className="mt-auto space-y-3">
          <div className="flex items-center gap-2 rounded-xs border border-zinc-200 bg-white px-3 py-2 text-xs dark:border-zinc-800 dark:bg-zinc-900">
            <span className={`h-2 w-2 rounded-full ${socketLive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
            <span className={socketLive ? 'font-semibold text-emerald-600 dark:text-emerald-400' : 'font-semibold text-amber-600 dark:text-amber-400'}>
              {socketLive ? 'Live' : 'Reconnecting...'}
            </span>
          </div>
          <button type="button" className="btn-outline w-full" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <ToastStack toasts={toasts} />

      <div className="pb-20 lg:pb-8">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-zinc-50/90 backdrop-blur lg:hidden dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="flex h-14 items-center justify-between gap-3 px-4">
            <div className="flex items-center gap-2.5">
              <Logo className="h-7 w-auto" />
              <LayoutDashboard className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-extrabold">{djName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${socketLive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <button type="button" className="btn-ghost -mr-2" onClick={logout} aria-label="Log out">
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          {/* Desktop header */}
          <header className="mb-6 hidden items-center justify-between gap-4 lg:flex">
            <div>
              <p className="eyebrow">DJ Admin</p>
              <h1 className="text-2xl font-extrabold tracking-tight">{tabs.find((item) => item.id === tab)?.label}</h1>
            </div>
            <span className={`inline-flex items-center gap-2 rounded-xs border px-3 py-1.5 text-xs font-bold uppercase tracking-wider ${socketLive ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-400' : 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-400'}`}>
              <span className={`h-2 w-2 rounded-full ${socketLive ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              {socketLive ? 'Live' : 'Reconnecting...'}
            </span>
          </header>

          <div className="mb-4 flex items-center gap-2 lg:hidden">
            <h1 className="text-lg font-extrabold tracking-tight">{tabs.find((item) => item.id === tab)?.label}</h1>
          </div>

          {tab === 'live' && (
            <>
              <StatCards overview={overview} />
              <div className="mt-8">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base font-extrabold">
                    <Inbox className="h-4 w-4 text-accent" />
                    Incoming requests
                  </h2>
                  <span className="pill pill-new">{requests.filter((request) => request.status === 'NEW').length} new</span>
                </div>
                <LiveQueue requests={requests} onUpdateStatus={updateStatus} onDelete={deleteRequest} />
              </div>
            </>
          )}

          {tab === 'history' && <HistoryTab events={events} />}
          {tab === 'events' && <EventsTab events={events} onChanged={() => loadDashboard().catch(() => {})} />}
          {tab === 'blog' && <BlogTab />}
          {tab === 'profile' && <ProfileTab />}
          {tab === 'settings' && <SettingsTab />}
          {tab === 'messages' && <MessagesTab />}
        </div>
      </div>

      {bottomNav}
    </main>
  );
}