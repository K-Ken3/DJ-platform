'use client';

import Link from 'next/link';
import { ChevronRight, Eye, EyeOff, Home, Moon, Sun, UserPlus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  free_trial_days: 30,
  mtn_momo_number: '0788205500',
  momo_account_name: 'Ken',
};

export default function AdminRegisterPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [info, setInfo] = useState<RegistrationInfo>(fallbackInfo);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      router.push('/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create your account.');
    } finally {
      setLoading(false);
    }
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

        <div className="card card-pad">
          <span className="pill pill-new w-fit">For DJs</span>
          <h1 className="mt-4 text-2xl font-extrabold tracking-tight">Join DJLink</h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Free for {info.free_trial_days || 30} days. After that it's ${info.subscription_fee_usd || 5}/month (≈{' '}
            {(info.subscription_fee || 7500).toLocaleString()} {info.currency}) — no card needed at signup.
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
              <label htmlFor="reg-phone">Phone (optional)</label>
              <input
                id="reg-phone"
                type="tel"
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                placeholder="+250 7xx xxx xxx"
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
              {loading ? 'Creating account...' : "Start my free trial"}
            </button>
          </form>

          <p className="mt-5 flex items-start gap-2 rounded-xs border border-zinc-200 bg-zinc-50 px-3 py-2.5 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400">
            <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            You get {info.free_trial_days || 30} days free, then DJLink asks you to pay the monthly membership. Your live
            page stays active while your account is paid.
          </p>

          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Already have an account?{' '}
            <Link href="/admin/login" className="font-semibold text-accent hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}