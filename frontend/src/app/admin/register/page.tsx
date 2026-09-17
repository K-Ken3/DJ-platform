'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CheckCircle2, Clock, Copy, Moon, Phone, Sun, UserPlus } from 'lucide-react';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { Logo } from '@/components/site/Logo';
import type { RegistrationInfo } from '@/lib/types';

type RegisterResponse = { token: string; user: { id: number; name: string; status: string }; dj: { slug: string } | null };

const fallbackInfo: RegistrationInfo = {
  subscription_fee: 5000,
  currency: 'RWF',
  mtn_momo_number: '0789630452',
  mtn_momo_ussd: '*182*1*1*0789630452#',
};

export default function AdminRegisterPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [info, setInfo] = useState<RegistrationInfo>(fallbackInfo);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [phase, setPhase] = useState<'form' | 'pending'>('form');
  const [reference, setReference] = useState('');
  const [paymentSubmitted, setPaymentSubmitted] = useState(false);
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

  async function handlePayment(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      await api('/api/dj/payment', {
        method: 'POST',
        body: JSON.stringify({ reference, phone: form.phone, amount: info.subscription_fee }),
      });
      setPaymentSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit your payment reference.');
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
          <button
            type="button"
            onClick={toggle}
            aria-label="Toggle theme"
            className="inline-flex h-9 w-9 items-center justify-center rounded-xs border border-zinc-300 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
        </div>

        {phase === 'form' ? (
          <div className="card card-pad">
            <span className="pill pill-new w-fit">For DJs</span>
            <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Join DJLink</h1>
            <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
              Create your DJ account, then activate it with a one-time membership payment.
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
                <input
                  id="reg-password"
                  type="password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) => setForm((current) => ({ ...current, password: event.target.value }))}
                  placeholder="At least 8 characters"
                  required
                  minLength={8}
                />
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
            {paymentSubmitted ? (
              <div className="flex flex-col items-center py-6 text-center">
                <span className="flex h-14 w-14 items-center justify-center bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="h-8 w-8" />
                </span>
                <h1 className="mt-5 text-2xl font-extrabold tracking-tight">Payment submitted</h1>
                <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
                  We received reference <span className="font-mono font-semibold">{reference}</span>. Our team
                  will verify your membership and activate your DJ account — usually within 24 hours.
                </p>
                <div className="mt-8 flex w-full flex-col gap-3">
                  <button type="button" className="btn-primary btn-lg" onClick={() => router.push('/admin')}>
                    Go to my dashboard
                  </button>
                  <Link href="/" className="btn-outline">
                    Back to DJLink
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <span className="pill pill-new w-fit">
                  <Clock className="h-3 w-3" />
                  Pending approval
                </span>
                <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Activate your account</h1>
                <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
                  Your account is created. Pay the one-time membership with MTN Mobile Money, then submit the
                  transaction reference below for verification.
                </p>

                <div className="mt-6 space-y-3">
                  <div className="surface-2 flex items-center justify-between p-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">Membership fee</p>
                      <p className="mt-1 text-lg font-extrabold">
                        {info.subscription_fee.toLocaleString()} {info.currency}
                      </p>
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
                  Dial the USSD code, confirm the amount, and keep the transaction ID you receive.
                </p>

                <form onSubmit={handlePayment} className="mt-6 grid gap-4">
                  <div>
                    <label htmlFor="reg-reference">Transaction reference</label>
                    <input
                      id="reg-reference"
                      type="text"
                      value={reference}
                      onChange={(event) => setReference(event.target.value)}
                      placeholder="e.g. MP240917.1234.A56789"
                      required
                      minLength={4}
                    />
                  </div>

                  {error && <p className="rounded-xs border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">{error}</p>}

                  <button type="submit" className="btn-primary btn-lg" disabled={loading}>
                    {loading ? 'Submitting...' : 'Submit payment reference'}
                  </button>
                </form>
              </>
            )}
          </div>
        )}
      </div>
    </main>
  );
}