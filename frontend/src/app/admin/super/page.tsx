'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  BadgeDollarSign,
  Ban,
  BellRing,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Download,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Music4,
  Palette,
  RefreshCw,
  Shield,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import { Logo } from '@/components/site/Logo';
import { BrandingTab } from '@/components/admin/BrandingTab';
import { api, downloadCsv } from '@/lib/api';
import type { NotificationItem, SuperDj, SuperRenewal, SuperStats, SubscriptionRecord } from '@/lib/types';

type TabId = 'overview' | 'djs' | 'payments' | 'notifications' | 'branding';

type SubscriptionRow = SubscriptionRecord & { user_name: string; user_email: string; user_status: string };

const tabs: { id: TabId; label: string; icon: typeof Users }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'djs', label: 'DJs', icon: Users },
  { id: 'payments', label: 'Payments', icon: CreditCard },
  { id: 'notifications', label: 'Reminders', icon: BellRing },
  { id: 'branding', label: 'Branding', icon: Palette },
];

const statusPill: Record<string, string> = {
  ACTIVE: 'border-emerald-700/40 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400',
  PENDING: 'border-amber-700/40 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:text-amber-400',
  REJECTED: 'border-red-700/40 bg-red-500/10 text-red-700 dark:border-red-500/30 dark:text-red-400',
  SUSPENDED: 'border-zinc-400/40 bg-zinc-500/10 text-zinc-600 dark:border-zinc-600 dark:text-zinc-300',
  VERIFIED: 'border-emerald-700/40 bg-emerald-500/10 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400',
  SUBMITTED: 'border-amber-700/40 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:text-amber-400',
};

function Pill({ value }: { value: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-xs border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${statusPill[value] || statusPill.SUSPENDED}`}>
      {value}
    </span>
  );
}

function formatDate(value?: string | null): string {
  if (!value) return '—';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export default function SuperAdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState<TabId>(() => {
    if (typeof window === 'undefined') return 'overview';
    const hash = window.location.hash.replace('#', '') as TabId;
    return tabs.some((item) => item.id === hash) ? hash : 'overview';
  });
  const [ownerName, setOwnerName] = useState('DJLink Owner');
  const [stats, setStats] = useState<SuperStats | null>(null);
  const [djs, setDjs] = useState<SuperDj[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRow[]>([]);
  const [renewals, setRenewals] = useState<SuperRenewal[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'ACTIVE' | 'REJECTED' | 'SUSPENDED'>('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [statsData, djsData, subsData, renewalsData, notifData, meData] = await Promise.all([
      api<SuperStats>('/api/super/stats'),
      api<{ djs: SuperDj[] }>('/api/super/djs'),
      api<{ subscriptions: SubscriptionRow[] }>('/api/super/subscriptions'),
      api<{ renewals: SuperRenewal[] }>('/api/super/renewals'),
      api<{ items: NotificationItem[] }>('/api/super/notifications'),
      api<{ user: { name: string; role: string } }>('/api/auth/me'),
    ]);
    if (meData.user.role !== 'SUPERADMIN') {
      router.replace('/admin');
      return;
    }
    setStats(statsData);
    setDjs(djsData.djs || []);
    setSubscriptions(subsData.subscriptions || []);
    setRenewals(renewalsData.renewals || []);
    setNotifications(notifData.items || []);
    if (meData.user.name) setOwnerName(meData.user.name);
  }, [router]);

  useEffect(() => {
    const token = localStorage.getItem('dj_token');
    if (!token) {
      router.push('/admin/login');
      return;
    }
    load()
      .catch(() => router.push('/admin/login'))
      .finally(() => setLoading(false));
  }, [load, router]);

  useEffect(() => {
    window.history.replaceState(null, '', `#${tab}`);
  }, [tab]);

  async function setDjStatus(id: number, status: string) {
    setBusyId(`dj-${id}`);
    setError('');
    try {
      await api(`/api/super/djs/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update DJ status.');
    } finally {
      setBusyId(null);
    }
  }

  async function confirmRenewal(userId: number) {
    setBusyId(`renew-${userId}`);
    setError('');
    try {
      await api('/api/super/subscriptions/confirm', { method: 'POST', body: JSON.stringify({ user_id: userId }) });
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not confirm the renewal.');
    } finally {
      setBusyId(null);
    }
  }

  function logout() {
    localStorage.removeItem('dj_token');
    router.push('/admin/login');
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-zinc-500">Loading DJLink owner console...</p>
      </main>
    );
  }

  const filteredDjs = filter === 'ALL' ? djs : djs.filter((dj) => dj.status === filter);
  const expiredDjs = djs.filter((dj) => dj.status === 'ACTIVE' && dj.sub_expired);

  return (
    <main className="min-h-screen bg-zinc-100 lg:pl-64 dark:bg-zinc-950">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-zinc-200 bg-zinc-50 p-4 lg:flex dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-6 flex items-center gap-3 px-1">
          <Logo className="h-8 w-auto" />
          <div className="leading-tight">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-zinc-400">Owner console</p>
            <p className="text-sm font-extrabold">{ownerName}</p>
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

        <div className="mt-auto space-y-3">
          <a href="/" target="_blank" rel="noreferrer" className="btn-outline w-full">
            <ExternalLink className="h-4 w-4" />
            View DJLink
          </a>
          <button type="button" className="btn-outline w-full" onClick={logout}>
            <LogOut className="h-4 w-4" />
            Log out
          </button>
        </div>
      </aside>

      <div className="pb-16 lg:pb-8">
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-zinc-50/90 backdrop-blur lg:hidden dark:border-zinc-800 dark:bg-zinc-950/90">
          <div className="flex h-14 items-center justify-between gap-3 px-4">
            <div className="flex items-center gap-2.5">
              <Logo className="h-7 w-auto" />
              <Shield className="h-4 w-4 text-zinc-400" />
              <span className="text-sm font-extrabold">Owner</span>
            </div>
            <button type="button" className="btn-ghost -mr-2" onClick={logout} aria-label="Log out">
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <header className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="eyebrow">DJLink owner console</p>
              <h1 className="text-2xl font-extrabold tracking-tight">
                {tabs.find((item) => item.id === tab)?.label}
              </h1>
            </div>
            <button type="button" className="btn-outline btn-sm" onClick={() => window.location.reload()}>
              <RefreshCw className="h-3.5 w-3.5" />
              Refresh
            </button>
          </header>

          {error && <p className="mb-4 rounded-xs border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">{error}</p>}

          {tab === 'overview' && (
            <>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Total DJs', value: stats?.total_djs ?? 0, icon: Users },
                  { label: 'Active DJs', value: stats?.active ?? 0, icon: CheckCircle2 },
                  { label: 'Renewals due', value: stats?.renewals_due ?? 0, icon: BellRing },
                  { label: 'Suspended', value: stats?.suspended ?? 0, icon: Ban },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.label} className="card card-pad">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{card.label}</p>
                        <Icon className="h-4 w-4 text-zinc-400" />
                      </div>
                      <p className="mt-3 text-3xl font-extrabold tracking-tight">{card.value}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Events', value: stats?.events_total ?? 0, icon: CalendarDays },
                  { label: 'Requests', value: stats?.requests_total ?? 0, icon: Music4 },
                  { label: 'Requests today', value: stats?.requests_today ?? 0, icon: TrendingUp },
                  { label: 'Booking messages', value: stats?.bookings_total ?? 0, icon: MessageSquare },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.label} className="card card-pad">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{card.label}</p>
                        <Icon className="h-4 w-4 text-zinc-400" />
                      </div>
                      <p className="mt-3 text-3xl font-extrabold tracking-tight">{card.value}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Subscriptions', value: stats?.subscriptions_total ?? 0 },
                  { label: 'Verified', value: stats?.subscriptions_verified ?? 0 },
                  { label: 'Awaiting verification', value: stats?.subscriptions_submitted ?? 0 },
                ].map((card) => (
                  <div key={card.label} className="card card-pad">
                    <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{card.label}</p>
                    <p className="mt-3 text-3xl font-extrabold tracking-tight">{card.value}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                  { label: 'Renewals due', value: stats?.renewals_due ?? 0, icon: BellRing, tone: 'text-amber-600 dark:text-amber-400' },
                  { label: 'Expired accounts', value: stats?.renewals_expired ?? 0, icon: AlertTriangle, tone: 'text-red-600 dark:text-red-400' },
                  { label: 'Revenue (RWF)', value: stats?.revenue_total ? stats.revenue_total.toLocaleString() : 0, icon: BadgeDollarSign, tone: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Revenue est. (USD)', value: `$${stats?.revenue_usd_estimate ?? 0}`, icon: Wallet, tone: 'text-emerald-600 dark:text-emerald-400' },
                ].map((card) => {
                  const Icon = card.icon;
                  return (
                    <div key={card.label} className="card card-pad">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">{card.label}</p>
                        <Icon className={`h-4 w-4 ${card.tone || 'text-zinc-400'}`} />
                      </div>
                      <p className="mt-3 text-3xl font-extrabold tracking-tight">{card.value}</p>
                    </div>
                  );
                })}
              </div>

              <div className="mt-8 grid gap-6 lg:grid-cols-2">
              <div className="card card-pad">
                <h2 className="flex items-center gap-2 text-base font-extrabold">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  Top requested songs (platform)
                </h2>
                {!stats?.top_songs || stats.top_songs.length === 0 ? (
                  <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">No song requests yet.</p>
                ) : (
                  <ol className="mt-4 space-y-2.5">
                    {stats.top_songs.map((song, index) => (
                      <li key={`${song.song_name}-${index}`} className="flex items-center gap-3">
                        <span className="w-5 shrink-0 text-center text-xs font-extrabold text-zinc-400">{index + 1}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold">{song.song_name}</p>
                          {song.artist_name ? <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{song.artist_name}</p> : null}
                        </div>
                        <span className="pill">{song.times}×</span>
                      </li>
                    ))}
                  </ol>
                )}
              </div>

              <div className="card card-pad">
                <h2 className="flex items-center gap-2 text-base font-extrabold">
                  <CalendarDays className="h-4 w-4 text-accent" />
                  Requests — last 7 days
                </h2>
                {!stats?.requests_by_day || stats.requests_by_day.length === 0 ? (
                  <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">No requests in the last 7 days.</p>
                ) : (
                  <div className="mt-4 flex h-40 items-end justify-between gap-2">
                    {stats.requests_by_day.map((point) => {
                      const max = Math.max(1, ...stats.requests_by_day!.map((p) => p.n));
                      const height = Math.max(8, Math.round((point.n / max) * 100));
                      return (
                        <div key={point.day} className="flex flex-1 flex-col items-center gap-1.5">
                          <span className="text-[10px] font-bold text-zinc-400">{point.n}</span>
                          <div className="w-full rounded-t-xs bg-accent/80" style={{ height: `${height}%` }} />
                          <span className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">
                            {new Date(`${point.day}T00:00:00`).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' })}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="card card-pad mt-6">
              <h2 className="text-base font-extrabold">Owner notifications</h2>
              {notifications.length === 0 ? (
                <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">No reminders yet. You'll be notified here when a DJ's renewal is due.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {notifications.slice(0, 8).map((item) => (
                    <li key={item.id} className="flex items-start gap-3">
                      <BellRing className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                      <div className="min-w-0">
                        <p className="text-sm font-bold leading-tight">{item.title}</p>
                        {item.body ? <p className="mt-0.5 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">{item.body}</p> : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            </>
          )}

          {tab === 'djs' && (
            <>
              <div className="mb-4 flex flex-wrap gap-2">
                {(['ALL', 'PENDING', 'ACTIVE', 'REJECTED', 'SUSPENDED'] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFilter(value)}
                    className={`btn-sm ${filter === value ? 'btn-primary' : 'btn-outline'}`}
                  >
                    {value === 'ALL' ? 'All' : value.charAt(0) + value.slice(1).toLowerCase()}
                    <span className="ml-1 text-[10px] opacity-70">
                      {value === 'ALL' ? djs.length : djs.filter((dj) => dj.status === value).length}
                    </span>
                  </button>
                ))}
              </div>

              {filteredDjs.length === 0 ? (
                <div className="card card-pad py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">No DJs in this view.</div>
              ) : (
                <div className="space-y-3">
                  {filteredDjs.map((dj) => (
                    <div key={dj.id} className="card card-pad">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-extrabold">{dj.name}</h3>
                            <Pill value={dj.status} />
                            {dj.status === 'ACTIVE' && dj.sub_expired && (
                              <span className="inline-flex items-center gap-1.5 rounded-xs border border-red-700/40 bg-red-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-red-700 dark:border-red-500/30 dark:text-red-400">
                                <AlertTriangle className="h-3 w-3" />
                                Membership lapsed
                              </span>
                            )}
                            {dj.status === 'ACTIVE' && !dj.sub_expired && dj.sub_renewal_due && (
                              <span className="inline-flex items-center gap-1.5 rounded-xs border border-amber-700/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:border-amber-500/30 dark:text-amber-400">
                                <BellRing className="h-3 w-3" />
                                Renewal due
                              </span>
                            )}
                          </div>
                          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{dj.email}</p>
                          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                            {dj.slug && <span>/{dj.slug}</span>}
                            {dj.location && <span>{dj.location}</span>}
                            <span>Joined {formatDate(dj.created_at)}</span>
                            <span>
                              {dj.verified_subscriptions}/{dj.total_subscriptions} payments verified
                            </span>
                          </div>
                          {dj.latest_subscription?.transaction_reference && (
                            <p className="mt-1.5 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                              Ref: {dj.latest_subscription.transaction_reference} · {dj.latest_subscription.status}
                            </p>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {dj.status !== 'ACTIVE' && (
                            <button type="button" className="btn-primary btn-sm" disabled={busyId === `dj-${dj.id}`} onClick={() => setDjStatus(dj.id, 'ACTIVE')}>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                              Activate
                            </button>
                          )}
                          {dj.status !== 'SUSPENDED' && dj.status !== 'PENDING' && (
                            <button type="button" className="btn-outline btn-sm" disabled={busyId === `dj-${dj.id}`} onClick={() => setDjStatus(dj.id, 'SUSPENDED')}>
                              <Ban className="h-3.5 w-3.5" />
                              Suspend
                            </button>
                          )}
                          {dj.status !== 'REJECTED' && (
                            <button type="button" className="btn-danger btn-sm" disabled={busyId === `dj-${dj.id}`} onClick={() => setDjStatus(dj.id, 'REJECTED')}>
                              Reject
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'payments' && (
            <>
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 className="text-lg font-extrabold">Monthly renewals</h2>
                  <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
                    Every DJ starts with a 30-day free trial, then pays a $5 monthly
                    membership. You get a reminder 29.5 days after their last confirmed payment; if nothing is confirmed
                    within 30 days their dashboard locks until you confirm the new month.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-outline btn-sm"
                  onClick={() => downloadCsv('/api/super/payments/export.csv', 'djlink-payments.csv').catch((err) => setError(err instanceof Error ? err.message : 'Export failed'))}
                >
                  <Download className="h-3.5 w-3.5" />
                  Export payments CSV
                </button>
              </div>

              {renewals.length === 0 ? (
                <div className="card card-pad py-8 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No active memberships yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {renewals.map((renewal) => {
                    const expired = renewal.state.expired;
                    const due = renewal.state.renewalDue && !expired;
                    return (
                      <div key={renewal.user_id} className={`card card-pad ${renewal.needs_action ? 'border-amber-600/50 dark:border-amber-500/40' : ''}`}>
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h3 className="text-lg font-extrabold">{renewal.name}</h3>
                              {expired ? (
                                <span className="inline-flex items-center gap-1.5 rounded-xs border border-red-700/40 bg-red-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-red-700 dark:border-red-500/30 dark:text-red-400">
                                  <AlertTriangle className="h-3 w-3" />
                                  Lapsed
                                </span>
                              ) : due ? (
                                <span className="inline-flex items-center gap-1.5 rounded-xs border border-amber-700/40 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:border-amber-500/30 dark:text-amber-400">
                                  <BellRing className="h-3 w-3" />
                                  Renewal due
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 rounded-xs border border-emerald-700/40 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                              {renewal.email} · {renewal.phone || 'no phone'}
                            </p>
                            <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                              {renewal.latest_subscription?.verified_at && (
                                <span>Last paid {formatDate(renewal.latest_subscription.verified_at)}</span>
                              )}
                              {renewal.state.daysSincePayment !== null && (
                                <span>{renewal.state.daysSincePayment} day(s) since payment</span>
                              )}
                              {renewal.state.cutoffAt && (
                                <span>
                                  Reminder {formatDate(renewal.state.reminderAt)} · Lock{' '}
                                  {expired ? <span className="text-red-500 dark:text-red-400">{formatDate(renewal.state.cutoffAt)}</span> : formatDate(renewal.state.cutoffAt)}
                                </span>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="btn-primary btn-sm whitespace-nowrap"
                            disabled={busyId === `renew-${renewal.user_id}`}
                            onClick={() => confirmRenewal(renewal.user_id)}
                          >
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            {busyId === `renew-${renewal.user_id}` ? 'Confirming...' : 'Confirm month paid'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="mt-8 mb-4">
                <h2 className="text-lg font-extrabold">Payment records</h2>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  Confirmed membership payments. Each record maps to the DJ who paid.
                </p>
              </div>

              {subscriptions.length === 0 ? (
                <div className="card card-pad py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No payments yet. Once a free trial ends and the DJ pays, their payment record appears here.
                </div>
              ) : (
                <div className="space-y-3">
                  {subscriptions.map((sub) => (
                    <div key={sub.id} className="card card-pad">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="text-lg font-extrabold">{sub.user_name}</h3>
                            <Pill value={sub.status} />
                            <Pill value={sub.user_status} />
                          </div>
                          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{sub.user_email}</p>
                          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400">
                            <span>Ref: <span className="font-mono">{sub.transaction_reference || '—'}</span></span>
                            <span>Phone: {sub.phone || '—'}</span>
                            <span>
                              {sub.amount ? `${sub.amount.toLocaleString()} ${sub.currency}` : 'Amount unknown'}
                            </span>
                            <span>Paid {formatDate(sub.verified_at || sub.submitted_at)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        {tab === 'notifications' && (
            <>
              <div className="mb-6">
                <h2 className="text-lg font-extrabold">Membership reminders</h2>
                <p className="mt-1 max-w-2xl text-sm text-zinc-500 dark:text-zinc-400">
                  DJLink reminds you 29.5 days after a DJ's last confirmed payment. Confirm their next month in the
                  Payments tab to keep their dashboard unlocked.
                </p>
              </div>

              {notifications.length === 0 ? (
                <div className="card card-pad py-12 text-center text-sm text-zinc-500 dark:text-zinc-400">
                  No reminders yet. They'll appear here when a DJ's renewal is due or expires.
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((item) => (
                    <div key={item.id} className="card card-pad">
                      <div className="flex items-start gap-3">
                        <span className="mt-0.5 shrink-0">
                          {item.kind === 'error' ? (
                            <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                          ) : item.kind === 'warning' ? (
                            <BellRing className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                          )}
                        </span>
                        <div className="min-w-0">
                          <p className="text-sm font-bold leading-tight">{item.title}</p>
                          {item.body ? <p className="mt-0.5 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{item.body}</p> : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {tab === 'branding' && <BrandingTab />}
        </div>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white lg:hidden dark:border-zinc-800 dark:bg-zinc-900">
        <div className="grid grid-cols-5">
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
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
    </main>
  );
}