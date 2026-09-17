'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Home, LogIn, Moon, Sun } from 'lucide-react';
import { api } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { Logo } from '@/components/site/Logo';

type LoginResponse = {
  token: string;
  user: { id: number; name: string; email: string; role: string; status: string };
  dj: { slug: string } | null;
};

export default function AdminLoginPage() {
  const router = useRouter();
  const { theme, toggle } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const data = await api<LoginResponse>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem('dj_token', data.token);
      router.push(data.user.role === 'SUPERADMIN' ? '/admin/super' : '/admin');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to log in');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col justify-center bg-zinc-100 px-4 py-12 dark:bg-zinc-950">
      <div className="mx-auto w-full max-w-sm">
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
          <h1 className="text-2xl font-extrabold tracking-tight">DJ sign in</h1>
          <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">
            Sign in to manage your request dashboard and events.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 grid gap-4">
            <div>
              <label htmlFor="login-email">Email</label>
              <input id="login-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            </div>
            <div>
              <label htmlFor="login-password">Password</label>
              <input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
            </div>

            {error && <p className="rounded-xs border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">{error}</p>}

            <button type="submit" className="btn-primary btn-lg" disabled={loading}>
              <LogIn className="h-4 w-4" />
              {loading ? 'Signing in...' : 'Login'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
            New here?{' '}
            <Link href="/admin/register" className="font-semibold text-accent hover:underline">
              Join as a DJ
            </Link>
          </p>
        </div>

        <div className="mt-6 rounded-xs border border-zinc-200 bg-zinc-50 px-4 py-3 text-xs text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
          <p className="font-bold uppercase tracking-wider">Demo accounts</p>
          <p className="mt-1 font-mono">DJ: dj@vaxino.com / djadmin123</p>
          <p className="font-mono">Owner: admin@djlink.app / djadmin123</p>
        </div>
      </div>
    </main>
  );
}