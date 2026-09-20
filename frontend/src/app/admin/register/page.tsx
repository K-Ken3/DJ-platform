'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Clock, Copy, Eye, EyeOff, Home, Moon, Phone, Sun, UserPlus } from 'lucide-react';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { Logo } from '@/components/site/Logo';
import type { RegistrationInfo } from '@/lib/types';

type RegisterResponse = { token: string; user: { id: number; name: string; status: string }; dj: { slug: string } | null };

const fallbackInfo: RegistrationInfo = {
  subscription_fee: 7500,
  subscription_fee_usd: 5,
  usd_rwf_rate: 1469,
  currency: 'RWF',
  mtn_momo_number: '0788205500',
  mtn_momo_ussd: '*182*8*1*1540166*7500#',
  momo_account_name: 'Ken',
};

export default function AdminRegisterPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [info, setInfo] = useState<RegistrationInfo>(fallbackInfo);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [phase, setPhase] = useState<'form' | 'pending'>('form');
  const [paymentCode, setPaymentCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    api<RegistrationInfo>('/api/registration-info')
      .then((data) => setInfo(data))
      .catch(() => {});
  }, []);

  async function handleRegister(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api<RegisterResponse>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      localStorage.setItem('dj_token', data.token);
      setPhase('pending');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
  }

  async function handleActivate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api<{ token: string }>('/api/dj/activate', {
        method: 'POST',
        body: JSON.stringify({ code: paymentCode }),
      });
      localStorage.setItem('dj_token', data.token);
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to activate your account.');
    } finally {
      setLoading(false);
    }
  }

  async function copyText(value: string, label: string) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(value).catch(() => {});
    }
    setCopied(label);
    window.setTimeout(() => setCopied(null), 1600);
  }

  return (
    <main className="flex min-h-screen flex-col justify-center bg-zinc-100 px-4 py-12 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-md">
        <div className="mb-8 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Logo className="h-8 w-auto" />
          </Link>
          <div className="flex items-center gap-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-xs border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-600 transition-colors hover:border-accent hover:text-accent dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              <Home className="h-3.5 w-3.5" />
              Home
            </Link>
            <button
              type="button"
              onClick={toggle}
              aria-label="Toggle theme"
              className="inline-flex h-9 w-9 items-center justify-center rounded-xs border border-zinc-300 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {phase === 'form' ? (
          <div className="card card-pad">
            <span className="pill pill-new w-fit">For DJs</span>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Join DJLink</h1>
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              Create your DJ account, then activate it with the monthly membership payment.
            </p>

            <form onSubmit={handleRegister} className="mt-7 grid gap-4">
              <div>
                <label htmlFor="reg-name">DJ / stage name</label>
                <input
                  id="reg-name"
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="DJ Nova"
                  required
                  minLength={2}
                />
              </div>
              <div>
                <label htmlFor="reg-email">Email</label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  value={form.email}
                  onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                  placeholder="you@example.com"
                  required
                />
              </div>
              <div>
                <label htmlFor="reg-phone">MTN Mobile Money number</label>
                <input
                  id="reg-phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                  placeholder="0788123456"
                />
              </div>
              <div>
                <label htmlFor="reg-password">Password</label>
                <div className="relative">
                  <input
                    id="reg-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                    placeholder="At least 8 characters"
                    className="pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((value) => !value)}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && <p className="rounded-xs border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">{error}</p>}

              <button type="submit" className="btn-primary btn-lg" disabled={loading}>
                <UserPlus className="h-4 w-4" />
                {loading ? 'Creating account...' : 'Create account'}
              </button>
            </form>

            <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Already have an account?{' '}
              <Link href="/admin/login" className="font-semibold text-accent hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        ) : (
          <div className="card card-pad">
            <span className="pill pill-new w-fit">
              <Clock className="h-3 w-3" />
              Pending approval
            </span>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Activate your account</h1>
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              Pay the monthly membership with MTN Mobile Money, then enter the payment confirmation code you received
              from DJLink to unlock your dashboard.
            </p>

            <div className="mt-6 space-y-3">
              <div className="surface-2 flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Monthly membership</p>
                  <p className="mt-1 text-lg font-extrabold">
                    ${info.subscription_fee_usd || 5} <span className="text-sm font-bold text-zinc-400">USD / month</span>
                  </p>
                  <p className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                    ≈ {info.subscription_fee.toLocaleString()} {info.currency} to pay
                  </p>
                </div>
              </div>

              <div className="surface-2 flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Account name</p>
                  <p className="mt-1 text-base font-bold">{info.momo_account_name || 'Ken'}</p>
                </div>
              </div>

              <div className="surface-2 flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">USSD code</p>
                  <p className="mt-1 font-mono text-base font-bold">{info.mtn_momo_ussd}</p>
                </div>
                <button type="button" className="btn-outline btn-sm" onClick={() => copyText(info.mtn_momo_ussd, 'ussd')}>
                  <Copy className="h-3.5 w-3.5" />
                  {copied === 'ussd' ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="surface-2 flex items-center justify-between p-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">MoMo number</p>
                  <p className="mt-1 font-mono text-base font-bold">{info.mtn_momo_number}</p>
                </div>
                <button type="button" className="btn-outline btn-sm" onClick={() => copyText(info.mtn_momo_number, 'number')}>
                  <Copy className="h-3.5 w-3.5" />
                  {copied === 'number' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <p className="mt-4 flex items-start gap-2 rounded-xs border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
              <Phone className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Dial the USSD code, confirm the payment, then enter the confirmation code DJLink gives you (e.g.{' '}
              <span className="font-mono">DJL-XXXX-XXXX</span>).
            </p>

            <form onSubmit={handleActivate} className="mt-6 grid gap-4">
              <div>
                <label htmlFor="reg-code">Payment confirmation code</label>
                <input
                  id="reg-code"
                  type="text"
                  value={paymentCode}
                  onChange={(event) => setPaymentCode(event.target.value.toUpperCase())}
                  placeholder="DJL-XXXX-XXXX"
                  className="font-mono uppercase"
                  required
                  minLength={6}
                />
              </div>

              {error && <p className="rounded-xs border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">{error}</p>}

              <button type="submit" className="btn-primary btn-lg" disabled={loading}>
                {loading ? 'Activating...' : 'Activate my account'}
              </button>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}